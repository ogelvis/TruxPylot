import 'server-only';
import { prisma } from '@/lib/prisma';

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
    account = await prisma.dedicatedAccount.upsert({
      where: { professionalId: professional.id },
      create: { professionalId: professional.id, walletId: wallet.id, paystackCustomerCode: customer.customer_code },
      update: { paystackCustomerCode: customer.customer_code, walletId: wallet.id },
    });
  }
  if (!account.accountNumber || refresh) {
    const data = account.paystackAccountId
      ? await paystack(`/dedicated_account/${account.paystackAccountId}`)
      : await paystack('/dedicated_account', { method: 'POST', headers: { 'X-Idempotency-Key': `truxpylot-dva-${account.id}` }, body: JSON.stringify({ customer: account.paystackCustomerCode }) });
    account = await prisma.dedicatedAccount.update({ where: { id: account.id }, data: { paystackAccountId: String(data.id), accountNumber: data.account_number, accountName: data.account_name, bankName: data.bank?.name ?? data.bank_name, bankSlug: data.bank?.slug, lastSyncedAt: new Date() } });
  }
  return account;
}
