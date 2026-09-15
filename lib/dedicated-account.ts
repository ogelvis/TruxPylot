import 'server-only';
import { prisma } from '@/lib/prisma';

const endpoint = 'https://api.paystack.co';

function headers(extra?: HeadersInit) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is required');
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(extra ?? {}) };
}

class PaystackError extends Error {
  constructor(public status: number, public messageText = 'Paystack request failed') {
    super(messageText);
  }
}

export class DvaPhoneRequiredError extends Error {
  constructor() {
    super('Customer phone number is required before a Dedicated Virtual Account can be created.');
    this.name = 'DvaPhoneRequiredError';
  }
}

function cleanPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const phone = value.trim();
  return phone.length >= 7 ? phone : null;
}

async function paystack(path: string, init?: RequestInit) {
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.status) {
    throw new PaystackError(response.status, body?.message ?? 'Paystack request failed');
  }
  return body.data;
}

function normalizeAccount(item: any) {
  const account = item?.dedicated_account ?? item?.data?.dedicated_account ?? item;
  if (!account || typeof account !== 'object') return null;
  return {
    paystackAccountId: account.id != null ? String(account.id) : undefined,
    accountNumber: typeof account.account_number === 'string' ? account.account_number : undefined,
    accountName: typeof account.account_name === 'string' ? account.account_name : undefined,
    bankName: typeof account.bank?.name === 'string' ? account.bank.name : typeof account.bank_name === 'string' ? account.bank_name : undefined,
    bankSlug: typeof account.bank?.slug === 'string' ? account.bank.slug : typeof account.bank_slug === 'string' ? account.bank_slug : undefined,
    active: account.active !== false,
    assigned: account.assigned !== false,
  };
}

async function syncFromCustomerCode(accountId: string, customerCode: string) {
  const customer = await paystack(`/customer/${encodeURIComponent(customerCode)}`);
  const normalized = normalizeAccount(customer);
  if (!normalized?.accountNumber) return null;

  return prisma.dedicatedAccount.update({
    where: { id: accountId },
    data: {
      paystackAccountId: normalized.paystackAccountId,
      accountNumber: normalized.accountNumber,
      accountName: normalized.accountName,
      bankName: normalized.bankName,
      bankSlug: normalized.bankSlug,
      active: normalized.active,
      status: normalized.assigned ? 'ACTIVE' : 'PENDING',
      lastSyncError: null,
      lastSyncedAt: new Date(),
    },
  });
}

export async function syncDedicatedAccountForCustomerCode(customerCode: string) {
  if (!customerCode) return null;
  const account = await prisma.dedicatedAccount.findFirst({ where: { paystackCustomerCode: customerCode } });
  if (!account) return null;
  try {
    return await syncFromCustomerCode(account.id, customerCode);
  } catch (error) {
    console.warn('[DVA SYNC] customer lookup failed', { customerCode, error: error instanceof Error ? error.message : 'unknown' });
    return null;
  }
}

export async function markDedicatedAccountProvisioningFailure(customerCode: string, reason: string) {
  if (!customerCode) return;
  await prisma.dedicatedAccount.updateMany({
    where: { paystackCustomerCode: customerCode },
    data: { status: 'ERROR', lastSyncError: reason.slice(0, 500), lastSyncedAt: new Date() },
  });
}

export async function getOrCreateDedicatedAccount(userId: string, refresh = false, requery = false) {
  const professional = await prisma.professional.findUnique({
    where: { userId },
    include: { wallet: true, dedicatedAccount: true, user: true },
  });
  if (!professional) return null;

  const wallet = professional.wallet ?? await prisma.wallet.upsert({
    where: { professionalId: professional.id },
    create: { professionalId: professional.id },
    update: {},
  });

  let account = professional.dedicatedAccount;

  if (!account) {
    let customer: any;
    try {
      customer = await paystack(`/customer/${encodeURIComponent(professional.user.email)}`);
    } catch (error) {
      if (!(error instanceof PaystackError) || error.status !== 404) throw error;

      // Paystack requires a phone number for DVA customers. Do not create a
      // partial Paystack customer and then repeatedly retry DVA provisioning.
      const localPhone = cleanPhone(professional.user.phone);
      if (!localPhone) {
        throw new DvaPhoneRequiredError();
      }

      const names = professional.fullName.trim().split(/\s+/);
      customer = await paystack('/customer', {
        method: 'POST',
        body: JSON.stringify({
          email: professional.user.email,
          first_name: names[0] ?? professional.fullName,
          last_name: names.slice(1).join(' ') || names[0] || professional.fullName,
          phone: localPhone,
        }),
      });
    }

    const customerCode = customer?.customer_code ?? customer?.customer?.customer_code;
    if (!customerCode) throw new Error('Paystack customer unavailable');

    // Use the phone already stored on the Paystack customer when available.
    // Otherwise require the user's TruxPylot profile phone before provisioning.
    const paystackPhone = cleanPhone(customer?.phone ?? customer?.customer?.phone);
    const localPhone = cleanPhone(professional.user.phone);
    const customerPhone = localPhone ?? paystackPhone;
    if (!customerPhone) {
      await prisma.dedicatedAccount.upsert({
        where: { professionalId: professional.id },
        create: {
          professionalId: professional.id,
          walletId: wallet.id,
          paystackCustomerCode: customerCode,
          status: 'AWAITING_PHONE',
          lastSyncError: 'Add a phone number to your professional profile before creating a bank transfer account.',
        },
        update: {
          paystackCustomerCode: customerCode,
          walletId: wallet.id,
          status: 'AWAITING_PHONE',
          lastSyncError: 'Add a phone number to your professional profile before creating a bank transfer account.',
        },
      });
      throw new DvaPhoneRequiredError();
    }

    // Keep the Paystack customer complete enough for DVA assignment. If the
    // local profile has a phone, make sure Paystack has the same current value.
    try {
      const names = professional.fullName.trim().split(/\s+/);
      await paystack(`/customer/${encodeURIComponent(customerCode)}`, {
        method: 'PUT',
        body: JSON.stringify({
          first_name: names[0] ?? professional.fullName,
          last_name: names.slice(1).join(' ') || names[0] || professional.fullName,
          phone: customerPhone,
        }),
      });
    } catch (error) {
      console.warn('[DVA SYNC] customer update skipped', { customerCode, error: error instanceof Error ? error.message : 'unknown' });
    }

    account = await prisma.dedicatedAccount.upsert({
      where: { professionalId: professional.id },
      create: { professionalId: professional.id, walletId: wallet.id, paystackCustomerCode: customerCode },
      update: { paystackCustomerCode: customerCode, walletId: wallet.id },
    });
  }

  // Paystack can assign the DVA asynchronously. First ask the customer record
  // whether an account already exists before attempting to create another one.
  if (!account.accountNumber || refresh) {
    try {
      // Check the Paystack customer before creating/recreating a DVA. Existing
      // customers may already have a phone even when the TruxPylot profile
      // does not, and Paystack requires the customer phone for DVA creation.
      const customer = await paystack(`/customer/${encodeURIComponent(account.paystackCustomerCode)}`);
      const paystackPhone = cleanPhone(customer?.phone ?? customer?.customer?.phone);
      const localPhone = cleanPhone(professional.user.phone);
      const customerPhone = localPhone ?? paystackPhone;

      if (!customerPhone) {
        const awaiting = await prisma.dedicatedAccount.update({
          where: { id: account.id },
          data: {
            status: 'AWAITING_PHONE',
            lastSyncError: 'Add a phone number to your professional profile before creating a bank transfer account.',
            lastSyncedAt: new Date(),
          },
        });
        return awaiting;
      }

      // If the professional has supplied a phone locally, synchronize it to
      // the Paystack customer before DVA creation.
      if (localPhone) {
        try {
          const names = professional.fullName.trim().split(/\s+/);
          await paystack(`/customer/${encodeURIComponent(account.paystackCustomerCode)}`, {
            method: 'PUT',
            body: JSON.stringify({
              first_name: names[0] ?? professional.fullName,
              last_name: names.slice(1).join(' ') || names[0] || professional.fullName,
              phone: localPhone,
            }),
          });
        } catch (error) {
          console.warn('[DVA SYNC] customer update skipped', {
            customerCode: account.paystackCustomerCode,
            error: error instanceof Error ? error.message : 'unknown',
          });
        }
      }

      await prisma.dedicatedAccount.update({
        where: { id: account.id },
        data: { status: 'PROVISIONING', lastSyncError: null, syncAttempts: { increment: 1 } },
      });

      const synced = await syncFromCustomerCode(account.id, account.paystackCustomerCode);
      if (synced?.accountNumber) {
        account = synced;
      } else if (account.paystackAccountId) {
        const data = await paystack(`/dedicated_account/${encodeURIComponent(account.paystackAccountId)}`);
        const normalized = normalizeAccount(data);
        if (!normalized?.accountNumber) {
          account = await prisma.dedicatedAccount.update({ where: { id: account.id }, data: { status: 'PENDING', lastSyncedAt: new Date() } });
        } else {
          account = await prisma.dedicatedAccount.update({
            where: { id: account.id },
            data: {
              paystackAccountId: normalized.paystackAccountId ?? account.paystackAccountId,
              accountNumber: normalized.accountNumber,
              accountName: normalized.accountName,
              bankName: normalized.bankName,
              bankSlug: normalized.bankSlug,
              active: normalized.active,
              status: normalized.assigned ? 'ACTIVE' : 'PENDING',
              lastSyncError: null,
              lastSyncedAt: new Date(),
            },
          });
        }
      } else {
        const preferredBank = process.env.PAYSTACK_DVA_PREFERRED_BANK;
        const data = await paystack('/dedicated_account', {
          method: 'POST',
          headers: { 'X-Idempotency-Key': `truxpylot-dva-${account.id}` },
          body: JSON.stringify({
            customer: account.paystackCustomerCode,
            ...(preferredBank ? { preferred_bank: preferredBank } : {}),
          }),
        });
        const normalized = normalizeAccount(data);
        account = await prisma.dedicatedAccount.update({
          where: { id: account.id },
          data: {
            paystackAccountId: normalized?.paystackAccountId ?? account.paystackAccountId,
            accountNumber: normalized?.accountNumber,
            accountName: normalized?.accountName,
            bankName: normalized?.bankName,
            bankSlug: normalized?.bankSlug,
            active: normalized?.active ?? true,
            status: normalized?.accountNumber && normalized.assigned ? 'ACTIVE' : 'PENDING',
            lastSyncError: null,
            lastSyncedAt: new Date(),
          },
        });
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Provisioning failed';
      console.error('[DVA SYNC] provisioning failed', { professionalId: professional.id, error: reason });
      account = await prisma.dedicatedAccount.update({
        where: { id: account.id },
        data: { status: 'ERROR', lastSyncError: reason.slice(0, 500), lastSyncedAt: new Date() },
      });
    }
  }

  // The user-facing "check status" action can request a Paystack requery. This
  // is intentionally opt-in because Paystack limits DVA requery to once/10 min.
  if (requery && account.accountNumber && account.bankSlug) {
    const date = new Date().toISOString().slice(0, 10);
    try {
      await paystack(`/dedicated_account/requery?account_number=${encodeURIComponent(account.accountNumber)}&provider_slug=${encodeURIComponent(account.bankSlug)}&date=${date}`);
    } catch (error) {
      console.warn('[DVA REQUERY] failed', { accountId: account.id, error: error instanceof Error ? error.message : 'unknown' });
    }
  }

  return account;
}
