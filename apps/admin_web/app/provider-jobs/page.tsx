'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';

type ProviderJob = {
  id: string;
  videoId?: string;
  jobType: string;
  providerName: string;
  status: string;
  errorMessage?: string;
  fallbackUsed: boolean;
  startedAt: string;
  completedAt?: string;
  video?: {
    id: string;
    title: string;
    category: string;
    status: string;
  };
};

type ProviderSummary = {
  total: number;
  success: number;
  failed: number;
  fallback: number;
  running: number;
};

export default function ProviderJobsPage() {
  const [jobs, setJobs] = useState<ProviderJob[]>([]);
  const [summary, setSummary] = useState<ProviderSummary>({
    total: 0,
    success: 0,
    failed: 0,
    fallback: 0,
    running: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter states
  const [jobType, setJobType] = useState('');
  const [status, setStatus] = useState('');
  const [fallbackUsed, setFallbackUsed] = useState('');
  const [providerName, setProviderName] = useState('');

  async function fetchData() {
    setLoading(true);
    const query = new URLSearchParams();
    if (jobType) query.set('jobType', jobType);
    if (status) query.set('status', status);
    if (fallbackUsed) query.set('fallbackUsed', fallbackUsed);
    if (providerName) query.set('providerName', providerName);
    query.set('take', '100');

    try {
      const [jobsRes, summaryRes] = await Promise.all([
        apiGet<{ data: ProviderJob[] }>(`/provider-jobs?${query.toString()}`),
        apiGet<{ data: ProviderSummary }>('/provider-jobs/summary'),
      ]);
      setJobs(jobsRes.data || []);
      setSummary(summaryRes.data || { total: 0, success: 0, failed: 0, fallback: 0, running: 0 });
    } catch {
      setJobs([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [jobType, status, fallbackUsed, providerName]);

  if (loading) {
    return (
      <section className="header">
        <h1>Provider Job Audit Trail</h1>
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <>
      <section className="header">
        <h1>Provider Job Audit Trail</h1>
        <p>Inspect AI provider calls, failures, fallback usage, and render/moderation audit history.</p>
      </section>

      <section className="grid cols-4">
        <div className="card">
          <h3>Total Jobs</h3>
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
          <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
            <option value="">All job types</option>
            <option value="LLM_SCRIPT">LLM Script</option>
            <option value="TTS">TTS</option>
            <option value="AVATAR_VIDEO">Avatar Video</option>
            <option value="VIDEO_COMPOSITE">Video Composite</option>
            <option value="MODERATION">Moderation</option>
          </select>
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
            setJobType('');
            setStatus('');
            setFallbackUsed('');
            setProviderName('');
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
              <th>Job Type</th>
              <th>Provider</th>
              <th>Status</th>
              <th>Fallback</th>
              <th>Video</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{new Date(job.startedAt).toLocaleString()}</td>
                <td><span className="badge">{job.jobType}</span></td>
                <td>{job.providerName}</td>
                <td>{job.status}</td>
                <td>{job.fallbackUsed ? 'Yes' : 'No'}</td>
                <td>{job.video?.title || '-'}</td>
                <td>{job.errorMessage || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
