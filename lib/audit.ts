/**
 * Audit Logging — NIST 800-53r5 AU-2, AU-3, AU-12
 *
 * Comprehensive audit trail for all security-relevant events.
 * All simulation actions, data access, and administrative operations
 * are logged with timestamps, user identity, and action details.
 */

import { prisma } from './prisma'

export type AuditAction =
  | 'scenario.create'
  | 'scenario.update'
  | 'scenario.delete'
  | 'scenario.start'
  | 'scenario.pause'
  | 'scenario.complete'
  | 'unit.create'
  | 'unit.update'
  | 'unit.delete'
  | 'unit.move'
  | 'unit.order'
  | 'simulation.launch'
  | 'simulation.inject'
  | 'simulation.complete'
  | 'simulation.fail'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.login_failed'
  | 'data.export'
  | 'data.import'
  | 'admin.config_change'

interface AuditEntry {
  userId?: string
  action: AuditAction
  resource: string
  details?: Record<string, unknown>
  ipAddress?: string
  scenarioId?: string
}

/**
 * Record an audit log entry
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? 'system',
        action: entry.action,
        resource: entry.resource,
        details: entry.details ? JSON.parse(JSON.stringify(entry.details)) : undefined,
        ipAddress: entry.ipAddress,
        scenarioId: entry.scenarioId,
      },
    })
  } catch (error) {
    // Audit logging must never crash the application
    // but we log to stderr for operational visibility
    console.error('[AUDIT_FAILURE]', entry.action, entry.resource, error)
  }
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  userId?: string
  action?: string
  scenarioId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  return prisma.auditLog.findMany({
    where: {
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.action && { action: filters.action }),
      ...(filters.scenarioId && { scenarioId: filters.scenarioId }),
      ...(filters.startDate || filters.endDate
        ? {
            createdAt: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit ?? 100,
    skip: filters.offset ?? 0,
  })
}
