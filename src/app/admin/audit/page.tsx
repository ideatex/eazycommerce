import React from 'react';
import { ShieldAlert, User, Clock, Globe } from 'lucide-react';
import db from '@/lib/db';
import { requireAdminScope } from '@/lib/adminScope';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  const { businessId } = await requireAdminScope();
  const logs = await db.auditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: {
        select: { fullName: true, email: true, role: true },
      },
    },
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 min-w-0 max-w-7xl">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Audit Logs
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Immutable log of account, order, and configuration events.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded overflow-hidden shadow-xs min-w-0">
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium text-[11px]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Timestamp</th>
                <th className="py-2.5 px-4 font-medium">Action</th>
                <th className="py-2.5 px-4 font-medium">Entity</th>
                <th className="py-2.5 px-4 font-medium">Actor</th>
                <th className="py-2.5 px-4 font-medium">IP / Origin</th>
                <th className="py-2.5 px-4 font-medium">Event Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-neutral-50/50">
                  <td className="py-2.5 px-4 text-neutral-500 font-sans text-xs">
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-neutral-900">
                    <span className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-neutral-700 font-semibold">
                    {log.entity}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-xs text-neutral-800">
                    {log.user ? (
                      <div>
                        <span className="font-semibold block">{log.user.fullName}</span>
                        <span className="text-[10px] text-neutral-400">{log.user.email}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-400">Anonymous / System</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-[10px] text-neutral-500">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="py-2.5 px-4 text-[10px] text-neutral-600 max-w-xs truncate">
                    {log.detailsJson || '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
