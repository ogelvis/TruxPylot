import { NextResponse } from 'next/server';
import { verifyPaystackSignature, applySuccessfulPayment } from '@/lib/payments';
import { applyWalletFunding, applyDedicatedAccountTransfer } from '@/lib/wallet';
import {
  markDedicatedAccountProvisioningFailure,
  syncDedicatedAccountForCustomerCode,
} from '@/lib/dedicated-account';

export const runtime = 'nodejs';

function customerCodeFromEvent(data: any): string | null {
  if (typeof data?.customer === 'string' && data.customer.trim()) return data.customer.trim();
  if (data?.customer && typeof data.customer === 'object' && typeof data.customer.customer_code === 'string') {
    return data.customer.customer_code.trim() || null;
  }
  if (typeof data?.customer_code === 'string') return data.customer_code.trim() || null;
  return null;
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!verifyPaystackSignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = String(event?.event ?? '');
  const data = event?.data ?? {};
  const providerEventId = data?.id != null ? String(data.id) : undefined;

  console.info('[PAYSTACK WEBHOOK]', {
    event: eventName,
    reference: data?.reference,
    providerEventId,
    amount: data?.amount,
  });

  if (eventName === 'dedicatedaccount.assign.success' || eventName === 'assigndedicatedaccount.success') {
    const customerCode = customerCodeFromEvent(data);
    if (customerCode) {
      const synced = await syncDedicatedAccountForCustomerCode(customerCode);
      console.info('[DVA SYNC] assignment success', { customerCode, synced: Boolean(synced?.accountNumber) });
    }
    return NextResponse.json({ received: true });
  }

  if (eventName === 'dedicatedaccount.assign.failed' || eventName === 'assigndedicatedaccount.failed') {
    const customerCode = customerCodeFromEvent(data);
    if (customerCode) {
      await markDedicatedAccountProvisioningFailure(customerCode, String(data?.reason ?? 'Paystack DVA assignment failed'));
    }
    return NextResponse.json({ received: true });
  }

  if (eventName === 'customeridentification.success') {
    const customerCode = customerCodeFromEvent(data);
    if (customerCode) await syncDedicatedAccountForCustomerCode(customerCode);
    return NextResponse.json({ received: true });
  }

  if (eventName === 'customeridentification.failed') {
    const customerCode = customerCodeFromEvent(data);
    if (customerCode) {
      await markDedicatedAccountProvisioningFailure(customerCode, String(data?.reason ?? 'Paystack customer identification failed'));
    }
    return NextResponse.json({ received: true });
  }

  if (eventName !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const reference = typeof data?.reference === 'string' ? data.reference : '';
  const amount = Number(data?.amount);

  if (!reference || !Number.isSafeInteger(amount) || amount <= 0) {
    console.warn('[PAYSTACK WEBHOOK] invalid charge.success payload', { reference, amount, providerEventId });
    return NextResponse.json({ received: true });
  }

  // First resolve the explicit TruxPylot checkout funding reference.
  const fundingResult = await applyWalletFunding(reference, amount, providerEventId);
  if (fundingResult.ok) {
    console.info('[WALLET FUNDING] processed', { reference, amount, already: fundingResult.already });
    return NextResponse.json({ received: true });
  }

  if (fundingResult.reason === 'amount_mismatch') {
    console.error('[WALLET FUNDING] amount mismatch', { reference, amount, providerEventId });
    // Acknowledge the webhook so Paystack does not retry forever. The funding
    // remains pending for admin reconciliation; it is never credited blindly.
    return NextResponse.json({ received: true, reviewRequired: true });
  }

  // Existing job payments must retain their current behavior.
  const paymentResult = await applySuccessfulPayment(reference, amount, providerEventId);
  if (paymentResult.ok) {
    return NextResponse.json({ received: true });
  }
  if (paymentResult.reason === 'amount_mismatch') {
    console.error('[PAYMENT] amount mismatch', { reference, amount, providerEventId });
    return NextResponse.json({ received: true, reviewRequired: true });
  }

  // DVA transfers are identified by Paystack's dedicated_nuban channel or the
  // receiver bank account field. They do not have a WalletFunding reference.
  const receiverAccount = data?.authorization?.receiver_bank_account_number;
  const isDvaTransfer = data?.authorization?.channel === 'dedicated_nuban' || /^\d{10}$/.test(String(receiverAccount ?? ''));
  if (isDvaTransfer) {
    const result = await applyDedicatedAccountTransfer(event);
    console.info('[DVA TRANSFER] processed', { reference, providerEventId, matched: result.matched, duplicate: result.duplicate });
  }

  return NextResponse.json({ received: true });
}
