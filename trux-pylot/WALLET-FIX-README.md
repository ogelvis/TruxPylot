# TruxPylot Wallet / Paystack Fix

This build fixes the existing PylotWallet funding pipeline without replacing the wallet architecture.

## Fixed

- Paystack DVA `charge.success` now maps the receiving account using `authorization.receiver_bank_account_number`.
- DVA transfers can also map by Paystack customer code.
- DVA incoming transfers are idempotent and cannot credit the same wallet twice.
- Existing unmatched DVA transfers can be matched and credited when the account mapping becomes available.
- Paystack DVA assignment success/failure and customer identification webhooks are handled.
- Existing Paystack customers are synchronized with TruxPylot name/phone data.
- Existing customer DVA details are retrieved before attempting to create another DVA.
- DVA status is synchronized from Paystack instead of assuming a local record means the account is active.
- The wallet "I've made a transfer — check status" action now triggers Paystack DVA requery and refreshes the wallet view.
- Existing Paystack Checkout wallet funding remains intact and server-side verified.
- Wallet credits remain atomic and ledger-backed.

## Deployment

Keep the existing Render environment variables. In particular, keep the existing `PAYSTACK_SECRET_KEY` and database configuration.

Optional:

`PAYSTACK_DVA_PREFERRED_BANK=wema-bank`

or another supported Paystack provider slug if desired. If omitted, Paystack chooses the provider.

The uploaded `.env` file is intentionally excluded from the fixed ZIP. Keep secrets in Render/environment configuration rather than committing them to the project archive.
