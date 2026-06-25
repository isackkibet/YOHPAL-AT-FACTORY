'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';

type ModerationLog = {
  id: string;
  action: string;
  reason?: string;
  score: number;
  providerName?: string;
  fallbackUsed?: boolean;
  createdAt: string;
  video?: {
    id: string;
    title: string;
    category: string;
    status: string;
  };
};

export default function ModerationPage() {
  const [queue, setQueue] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchQueue() {
    setLoading(true);
    try {
      const response = await apiGet<{ data: ModerationLog[] }>('/moderation/queue?take=50');
      setQueue(response.data || []);
    } catch {
      setQueue([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchQueue();
  }, []);

  async function handleModerate() {
    await apiPost('/moderation/videos/moderate-pending?take=20');
    await fetchQueue();
  }

  async function handlePublish() {
    await apiPost('/moderation/videos/publish-approved?take=20');
    await fetchQueue();
  }

  async function handleApprove(videoId: string) {
    await apiPost(`/moderation/videos/${videoId}/approve`);
    await fetchQueue();
  }

  async function handleReject(videoId: string) {
    await apiPost(`/moderation/videos/${videoId}/reject`);
    await fetchQueue();
  }

  if (loading) {
    return (
      <section className="header">
        <h1>Moderation Center</h1>
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <>
      <section className="header">
        <h1>Moderation Center</h1>
        <p>Review content safety, approve safe videos, and publish approved seed videos.</p>
      </section>

      <div className="actions">
        <button onClick={handleModerate}>Run Automated Moderation</button>
        <button onClick={handlePublish} className="secondary">Publish All Approved</button>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Video</th>
              <th>Category</th>
              <th>Action</th>
              <th>Provider</th>
              <th>Fallback</th>
              <th>Score</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Manual Action</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((log) => (
              <tr key={log.id}>
                <td>{log.video?.title || 'Unknown video'}</td>
                <td><span className="badge">{log.video?.category || 'unknown'}</span></td>
                <td>{log.action}</td>
                <td>{log.providerName || '-'}</td>
                <td>{log.fallbackUsed ? 'Yes' : 'No'}</td>
                <td>{log.score}</td>
                <td>{log.reason || '-'}</td>
                <td>{log.video?.status || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleApprove(log.video?.id || '')}
                      style={{ background: '#22c55e' }}
                      disabled={!log.video?.id}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(log.video?.id || '')}
                      style={{ background: '#ef4444' }}
                      disabled={!log.video?.id}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
