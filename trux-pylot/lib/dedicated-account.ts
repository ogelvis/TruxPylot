import 'server-only';
import { prisma } from '@/lib/prisma';

// Paystack credentials and DVA mapping must never enter the client bundle.
const endpoint = 'https://api.paystack.co';
function headers() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is required');
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}
class PaystackError extends Error {
  constructor(public status: number) { super('Paystack request failed'); }
}
async function paystack(path: string, init?: RequestInit) {
  const response = await fetch(`${endpoint}${path}`, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.status) throw new PaystackError(response.status);
  return body.data;
}

export async function getOrCreateDedicatedAccount(userId: string, refresh = false) {
  const professional = await prisma.professional.findUnique({ where: { userId }, include: { wallet: true, dedicatedAccount: true, user: true } });
  if (!professional) return null;
  const wallet = professional.wallet ?? await prisma.wallet.upsert({ where: { professionalId: professional.id }, create: { professionalId: professional.id }, update: {} });
  let account = professional.dedicatedAccount;
  if (!account) {
    let customer;
    try {
      customer = await paystack(`/customer/${encodeURIComponent(professional.user.email)}`);
    } catch (error) {
      if (!(error instanceof PaystackError) || error.status !== 404) throw error;
      customer = await paystack('/customer', { method: 'POST', body: JSON.stringify({ email: professional.user.email, first_name: professional.fullName.split(' ')[0], last_name: professional.fullName.split(' ').slice(1).join(' ') || professional.fullName }) });
    }
    const customerCode = customer?.customer_code ?? customer?.customer?.customer_code ?? customer?.data?.customer_code;
    if (!customerCode) throw new Error('Paystack customer unavailable');
    account = await prisma.dedicatedAccount.upsert({
      where: { professionalId: professional.id },
      create: { professionalId: professional.id, walletId: wallet.id, paystackCustomerCode: customerCode },
      update: { paystackCustomerCode: customerCode, walletId: wallet.id },
    });
  }
  if (!account.accountNumber || refresh) {
    try {
      await prisma.dedicatedAccount.update({ where: { id: account.id }, data: { status: 'PROVISIONING', lastSyncError: null, syncAttempts: { increment: 1 } } });
      const data = account.paystackAccountId
        ? await paystack(`/dedicated_account/${account.paystackAccountId}`)
        : await paystack('/dedicated_account', { method: 'POST', headers: { 'X-Idempotency-Key': `truxpylot-dva-${account.id}` }, body: JSON.stringify({ customer: account.paystackCustomerCode }) });
      const item = data?.dedicated_account ?? data;
      const pending = !item?.account_number;
      account = await prisma.dedicatedAccount.update({ where: { id: account.id }, data: { paystackAccountId: item?.id ? String(item.id) : account.paystackAccountId, accountNumber: item?.account_number ?? undefined, accountName: item?.account_name ?? undefined, bankName: item?.bank?.name ?? item?.bank_name ?? undefined, bankSlug: item?.bank?.slug ?? item?.bank_slug ?? undefined, status: pending ? 'PENDING' : 'ACTIVE', lastSyncError: null, lastSyncedAt: new Date() } });
    } catch {
      await prisma.dedicatedAccount.update({ where: { id: account.id }, data: { status: 'ERROR', lastSyncError: 'Provisioning failed' } });
      if (!account.accountNumber) return prisma.dedicatedAccount.findUnique({ where: { id: account.id } });
    }
  }
  return account;
}
