'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '../../lib/api';

type ScriptProviderLog = {
  id: string;
  providerName: string;
  status: string;
  fallbackUsed: boolean;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  script?: {
    id: string;
    title: string;
    hook: string;
    qualityScore: number;
    factScore: number;
    trend?: {
      id: string;
      topic: string;
      category: string;
      region?: string;
      country?: string;
    };
  };
  trend?: {
    id: string;
    topic: string;
    category: string;
    region?: string;
    country?: string;
  };
};

type ScriptSummary = {
  total: number;
  success: number;
  failed: number;
  fallback: number;
  running: number;
};

export default function ScriptProviderLogsPage() {
  const [logs, setLogs] = useState<ScriptProviderLog[]>([]);
  const [summary, setSummary] = useState<ScriptSummary>({
    total: 0,
    success: 0,
    failed: 0,
    fallback: 0,
    running: 0,
  });
  const [loading, setLoading] = useState(true);

  const [providerName, setProviderName] = useState('');
  const [status, setStatus] = useState('');
  const [fallbackUsed, setFallbackUsed] = useState('');

  async function fetchData() {
    setLoading(true);
    const query = new URLSearchParams();
    if (providerName) query.set('providerName', providerName);
    if (status) query.set('status', status);
    if (fallbackUsed) query.set('fallbackUsed', fallbackUsed);
    query.set('take', '100');

    try {
      const [logsRes, summaryRes] = await Promise.all([
        apiGet<{ data: ScriptProviderLog[] }>(`/script-provider-logs?${query.toString()}`),
        apiGet<{ data: ScriptSummary }>('/script-provider-logs/summary'),
      ]);
      setLogs(logsRes.data || []);
      setSummary(summaryRes.data || { total: 0, success: 0, failed: 0, fallback: 0, running: 0 });
    } catch {
      setLogs([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [providerName, status, fallbackUsed]);

  if (loading) {
    return (
      <section className="header">
        <h1>Script Provider Logs</h1>
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <>
      <section className="header">
        <h1>Script Provider Logs</h1>
        <p>Audit trail for LLM script generation calls, provider status, and fallback usage.</p>
      </section>

      <section className="grid cols-4">
        <div className="card">
          <h3>Total Scripts</h3>
          <div className="statValue">{summary.total}</div>
        </div>
        <div className="card">
          <h3>Success</h3>
          <div className="statValue">{summary.success}</div>
        </div>
        <div className="card">
          <h3>Failed</h3>
          <div className="statValue">{summary.failed}</div>
        </div>
        <div className="card">
          <h3>Fallback</h3>
          <div className="statValue">{summary.fallback}</div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h3>Filters</h3>
        <div className="actions">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="RUNNING">Running</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="FALLBACK_USED">Fallback Used</option>
          </select>
          <select value={fallbackUsed} onChange={(e) => setFallbackUsed(e.target.value)}>
            <option value="">Fallback any</option>
            <option value="true">Fallback only</option>
            <option value="false">No fallback</option>
          </select>
          <input
            placeholder="Provider name"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
          />
          <button onClick={() => {
            setProviderName('');
            setStatus('');
            setFallbackUsed('');
          }}>
            Clear Filters
          </button>
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Started</th>
              <th>Provider</th>
              <th>Status</th>
              <th>Fallback</th>
              <th>Trend</th>
              <th>Script Title</th>
              <th>Quality</th>
              <th>Fact</th>
              <th>Error</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.startedAt).toLocaleString()}</td>
                <td>{log.providerName}</td>
                <td>{log.status}</td>
                <td>{log.fallbackUsed ? 'Yes' : 'No'}</td>
                <td>
                  <span className="badge">{log.trend?.category || log.script?.trend?.category || '-'}</span>
                  <br />
                  {log.trend?.topic || log.script?.trend?.topic || '-'}
                </td>
                <td>{log.script?.title || '-'}</td>
                <td>{log.script?.qualityScore ?? '-'}</td>
                <td>{log.script?.factScore ?? '-'}</td>
                <td>{log.errorMessage || '-'}</td>
                <td>
                  <Link href={`/script-provider-logs/${log.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
