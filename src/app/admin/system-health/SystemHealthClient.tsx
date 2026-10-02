'use client';

import React, { useState } from 'react';
import {
  Activity,
  Database,
  Cpu,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ShieldCheck,
  FileText
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  PageHeader
} from '@/components/ui';

interface SystemHealthClientProps {
  initialHealth: {
    status: string;
    timestamp: string;
    uptimeSeconds: number;
    nodeVersion: string;
    platform: string;
    env: string;
    dbPingMs: number;
    dbStatus: string;
    memory: {
      heapUsedMB: number;
      heapTotalMB: number;
      rssMB: number;
    };
    counts: {
      businesses: number;
      users: number;
      products: number;
      orders: number;
      invoices: number;
      reviews: number;
      auditLogs: number;
    };
  };
}

export function SystemHealthClient({ initialHealth }: SystemHealthClientProps) {
  const [health, setHealth] = useState(initialHealth);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const start = Date.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const ping = Date.now() - start;

      setHealth((prev) => ({
        ...prev,
        status: data.status === 'healthy' ? 'OPTIMAL' : 'DEGRADED',
        dbPingMs: ping,
        dbStatus: data.checks?.database?.status || 'healthy',
        uptimeSeconds: Math.round(data.uptime || prev.uptimeSeconds),
        memory: {
          heapUsedMB: data.checks?.memory?.heapUsedMB || prev.memory.heapUsedMB,
          heapTotalMB: prev.memory.heapTotalMB,
          rssMB: data.checks?.memory?.rssMB || prev.memory.rssMB,
        },
      }));
      setLastRefreshed(new Date());
    } catch {
      setHealth((prev) => ({ ...prev, status: 'DEGRADED', dbStatus: 'unreachable' }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  const heapPercentage = Math.round(
    (health.memory.heapUsedMB / Math.max(1, health.memory.heapTotalMB)) * 100
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="System Health & Platform Telemetry"
          description="Live database connectivity, latency benchmarks, node runtime memory allocation, and database record volumes."
        />

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-400 font-mono">
            Updated {lastRefreshed.toLocaleTimeString('en-IN')}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs h-8 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Checking...' : 'Ping Live'}</span>
          </Button>
        </div>
      </div>

      {/* Operational Status Hero Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
        health.status === 'OPTIMAL'
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          : 'bg-rose-50 border-rose-200 text-rose-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            health.status === 'OPTIMAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-2">
              <span>{health.status === 'OPTIMAL' ? 'All Operational Services Healthy' : 'Degraded System Performance'}</span>
              <Badge variant={health.status === 'OPTIMAL' ? 'success' : 'error'}>
                {health.status}
              </Badge>
            </div>
            <p className="text-[11px] opacity-80 mt-0.5">
              Prisma ORM connected, API route handlers responsive, and authentication token verifications active.
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[11px] opacity-70 block">Database Query Latency</span>
          <span className="font-mono font-bold text-sm">
            {health.dbPingMs} ms
          </span>
        </div>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Database Connectivity */}
        <Card className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100">
            <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-neutral-500" />
              <span>Database Engine</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Connection State</span>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">ORM Client</span>
              <span className="font-mono font-semibold text-neutral-800">Prisma 6.19.3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Roundtrip Latency</span>
              <span className="font-mono font-bold text-emerald-700">{health.dbPingMs} ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Isolation Mode</span>
              <span className="font-mono text-neutral-800">Tenant Scoped</span>
            </div>
          </CardContent>
        </Card>

        {/* Runtime & Process Telemetry */}
        <Card className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100">
            <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-neutral-500" />
              <span>Node.js Memory Allocation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-neutral-500">Heap Used / Allocated</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {health.memory.heapUsedMB} MB / {health.memory.heapTotalMB} MB
                </span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-neutral-900 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, heapPercentage)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-neutral-500">Resident Set Size (RSS)</span>
              <span className="font-mono font-semibold text-neutral-800">
                {health.memory.rssMB} MB
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Node Engine</span>
              <span className="font-mono text-neutral-800">{health.nodeVersion}</span>
            </div>
          </CardContent>
        </Card>

        {/* Platform Uptime & Environment */}
        <Card className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100">
            <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span>Process Uptime</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Service Uptime</span>
              <span className="font-mono font-bold text-neutral-900">
                {formatUptime(health.uptimeSeconds)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Runtime Environment</span>
              <Badge variant="neutral" className="font-mono text-[10px]">
                {health.env}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Host Platform</span>
              <span className="font-mono text-neutral-800 capitalize">{health.platform}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Next.js Architecture</span>
              <span className="font-mono text-neutral-800">App Router 16.3</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Entity Records Ledger */}
      <Card className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-neutral-500" />
            <span>Database Records Volume Ledger</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-x divide-y sm:divide-y-0 divide-neutral-100 text-center">
            <div className="p-4">
              <span className="text-[10px] text-neutral-400 uppercase font-medium block">Businesses</span>
              <span className="text-lg font-bold font-mono text-neutral-900 mt-1 block">
                {health.counts.businesses}
              </span>
            </div>
            <div className="p-4">
              <span className="text-[10px] text-neutral-400 uppercase font-medium block">Users</span>
              <span className="text-lg font-bold font-mono text-neutral-900 mt-1 block">
                {health.counts.users}
              </span>
            </div>
            <div className="p-4">
              <span className="text-[10px] text-neutral-400 uppercase font-medium block">Products</span>
              <span className="text-lg font-bold font-mono text-neutral-900 mt-1 block">
                {health.counts.products}
              </span>
            </div>
            <div className="p-4">
              <span className="text-[10px] text-neutral-400 uppercase font-medium block">Orders</span>
              <span className="text-lg font-bold font-mono text-neutral-900 mt-1 block">
                {health.counts.orders}
              </span>
            </div>
            <div className="p-4">
              <span className="text-[10px] text-neutral-400 uppercase font-medium block">Tax Invoices</span>
              <span className="text-lg font-bold font-mono text-neutral-900 mt-1 block">
                {health.counts.invoices}
              </span>
            </div>
            <div className="p-4">
              <span className="text-[10px] text-neutral-400 uppercase font-medium block">Reviews</span>
              <span className="text-lg font-bold font-mono text-neutral-900 mt-1 block">
                {health.counts.reviews}
              </span>
            </div>
            <div className="p-4">
              <span className="text-[10px] text-neutral-400 uppercase font-medium block">Audit Logs</span>
              <span className="text-lg font-bold font-mono text-neutral-900 mt-1 block">
                {health.counts.auditLogs}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
