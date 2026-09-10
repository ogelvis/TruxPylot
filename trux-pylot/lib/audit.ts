import { prisma } from '@/lib/prisma';

export async function writeAuditLog(input: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  data?: Record<string, unknown> | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        data: input.data ?? undefined,
      },
    });
  } catch (error) {
    console.error('[audit] failed:', error instanceof Error ? error.message : String(error));
  }
}
