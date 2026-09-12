import crypto from 'node:crypto';

class PaystackTransferError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'PaystackTransferError';
  }
}

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not configured.');
  return key;
}

async function paystackRequest<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret()}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.status === false) {
    throw new PaystackTransferError(response.status, body?.message ?? 'Paystack request failed.', body);
  }
  return body;
}

export async function listNigeriaBanks() {
  const body = await paystackRequest<{ data: Array<{ id: number; name: string; code: string; active: boolean; currency?: string }> }>('/bank?country=nigeria&perPage=100');
  return (body.data ?? []).filter(bank => bank.active !== false).map(bank => ({ id: bank.id, name: bank.name, code: bank.code }));
}

export async function resolveNigerianAccount(accountNumber: string, bankCode: string) {
  const body = await paystackRequest<{ data: { account_number: string; account_name: string; bank_id?: number } }>(`/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`);
  return body.data;
}

export async function createTransferRecipient(input: { name: string; accountNumber: string; bankCode: string; currency?: string; email?: string; metadata?: Record<string, unknown> }) {
  const body = await paystackRequest<{ data: { recipient_code: string; name: string; details?: { account_number?: string; account_name?: string; bank_code?: string; bank_name?: string } } }>('/transferrecipient', {
    method: 'POST',
    body: JSON.stringify({
      type: 'nuban',
      name: input.name,
      account_number: input.accountNumber,
      bank_code: input.bankCode,
      currency: input.currency ?? 'NGN',
      email: input.email,
      metadata: input.metadata,
    }),
  });
  return body.data;
}

export async function initiateTransfer(input: { amount: number; recipientCode: string; reference: string; reason: string }) {
  const body = await paystackRequest<{ data: { id: number; reference: string; status: string; transfer_code?: string; failures?: unknown; recipient?: number } }>('/transfer', {
    method: 'POST',
    body: JSON.stringify({
      source: 'balance',
      amount: input.amount,
      recipient: input.recipientCode,
      reference: input.reference,
      reason: input.reason,
      currency: 'NGN',
    }),
  });
  return body.data;
}

export async function finalizeTransfer(transferCode: string, otp: string) {
  const body = await paystackRequest<{ data: { id: number; reference: string; status: string; transfer_code?: string } }>('/transfer/finalize_transfer', {
    method: 'POST',
    body: JSON.stringify({ transfer_code: transferCode, otp }),
  });
  return body.data;
}


export async function verifyTransfer(reference: string) {
  const body = await paystackRequest<{ data: { id: number; reference: string; status: string; transfer_code?: string; failures?: unknown } }>(`/transfer/verify/${encodeURIComponent(reference)}`);
  return body.data;
}

export function withdrawalProviderReference(withdrawalId: string) {
  const safe = withdrawalId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 28);
  const random = crypto.randomUUID().replaceAll('-', '').slice(0, 8);
  return `tpwd_${safe}_${random}`.slice(0, 50);
}
