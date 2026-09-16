-- A Paystack transfer recipient code identifies a provider-side recipient and may
-- be returned for the same bank account across multiple TruxPylot users.
-- It must therefore not be globally unique in PayoutAccount.
DROP INDEX IF EXISTS "PayoutAccount_paystackRecipientCode_key";
