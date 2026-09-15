import { JobStatus } from '@prisma/client';
const allowed: Record<JobStatus, JobStatus[]> = { REQUESTED:['QUOTED','REJECTED','CANCELLED'], QUOTED:['ACCEPTED','CANCELLED'], ACCEPTED:['PAYMENT_PENDING','CANCELLED'], PAYMENT_PENDING:['PAID','CANCELLED'], PAID:['IN_PROGRESS','DISPUTED','REFUNDED'], IN_PROGRESS:['COMPLETED','DISPUTED'], COMPLETED:['CUSTOMER_CONFIRMED','DISPUTED'], CUSTOMER_CONFIRMED:['SETTLED','DISPUTED'], SETTLED:[], CANCELLED:[], DISPUTED:['REFUNDED','SETTLED'], REFUNDED:[], REJECTED:[] };
export function canTransition(from: JobStatus, to: JobStatus) { return allowed[from].includes(to); }
export function commissionFor(amount: number) { const pct = Number(process.env.PLATFORM_COMMISSION_PERCENT ?? 10); return Math.round(amount * pct / 100); }
