// Vanigam Commerce - System Health & Platform Telemetry Server Page

import React from 'react';
import db from '@/lib/db';
import { requireAdminScope } from '@/lib/adminScope';
import { SystemHealthClient } from './SystemHealthClient';

export const revalidate = 0;

export default async function AdminSystemHealthPage() {
  const { businessId } = await requireAdminScope();

  const startTime = Date.now();
  let dbStatus = 'healthy';

  const [
    businessCount,
    userCount,
    productCount,
    orderCount,
    invoiceCount,
    reviewCount,
    auditLogCount,
  ] = await Promise.all([
    db.business.count({ where: { id: businessId } }).catch(() => {
      dbStatus = 'unreachable';
      return 0;
    }),
    db.user.count({ where: { businessId } }),
    db.product.count({ where: { businessId } }),
    db.order.count({ where: { businessId } }),
    db.invoice.count({ where: { order: { businessId } } }),
    db.productReview.count({ where: { product: { businessId } } }),
    db.auditLog.count({ where: { businessId } }),
  ]);

  const dbPingMs = Date.now() - startTime;
  const memory = process.memoryUsage();

  const healthData = {
    status: dbStatus === 'healthy' ? 'OPTIMAL' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV || 'development',
    dbPingMs,
    dbStatus,
    memory: {
      heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      rssMB: Math.round(memory.rss / 1024 / 1024),
    },
    counts: {
      businesses: businessCount,
      users: userCount,
      products: productCount,
      orders: orderCount,
      invoices: invoiceCount,
      reviews: reviewCount,
      auditLogs: auditLogCount,
    },
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl min-w-0">
      <SystemHealthClient initialHealth={healthData} />
    </div>
  );
}
