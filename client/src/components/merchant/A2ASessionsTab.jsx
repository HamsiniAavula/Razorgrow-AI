// client/src/components/merchant/A2ASessionsTab.jsx
// AI Buyers (Agent-to-Agent Commerce) Dashboard Tab
// Demonstrates merchant transactability by autonomous AI buyers

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Play, CheckCircle, XCircle, Loader2, ChevronDown, ChevronRight, ShoppingCart, Zap, Globe, FileJson } from 'lucide-react';
// Use relative path so Vite proxy handles routing to local or Render backend
const API = '';

const INTENTS = [
  { label: 'Birthday gift for sister', intent: 'I want to buy a birthday gift for my sister', budget: 3000, prefs: ['Electronics', 'Accessories'] },
  { label: 'Sports gear under ₹2000', intent: 'Looking for sports and fitness gear', budget: 2000, prefs: ['Footwear', 'Apparel'] },
  { label: 'Skincare essentials', intent: 'I need skincare and beauty products', budget: 1500, prefs: ['Beauty'] },
  { label: 'Premium tech ₹5000', intent: 'I want the best electronics available', budget: 5000, prefs: ['Electronics', 'Audio'] },
];

export default function A2ASessionsTab({ onRefresh }) {
  const [sessions, setSessions] = useState([]);
  const [manifest, setManifest] = useState(null);
  const [liveSteps, setLiveSteps] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(null); // { status, order_id, total_inr }
  const [expandedSession, setExpandedSession] = useState(null);
  const [selectedIntent, setSelectedIntent] = useState(0);
  const [showManifest, setShowManifest] = useState(false);
  const [a2aRevenue, setA2aRevenue] = useState(0);
  const stepsRef = useRef(null);

  const phaseColors = {
    INIT: '#6366f1',
    MANIFEST: '#0ea5e9',
    REASONING: '#a855f7',
    DISCOVER: '#f59e0b',
    SELECT: '#14b8a6',
    NEGOTIATE: '#3b82f6',
    CHECKOUT: '#8b5cf6',
    PAYMENT: '#10b981',
    SUCCESS: '#22c55e',
    ERROR: '#ef4444',
    POLICY_BLOCK: '#ef4444',
  };

  const phaseIcon = (phase) => {
    switch (phase) {
      case 'SUCCESS': return '🎉';
      case 'ERROR': return '❌';
      case 'POLICY_BLOCK': return '🚫';
      case 'PAYMENT': return '🔐';
      case 'CHECKOUT': return '💳';
      case 'NEGOTIATE': return '📝';
      case 'SELECT': return '🎯';
      case 'DISCOVER': return '🔍';
      case 'REASONING': return '🧠';
      case 'MANIFEST': return '📋';
      default: return '🤖';
    }
  };

  const loadSessions = async () => {
    try {
      const r = await fetch(`${API}/api/a2a/sessions`);
      const d = await r.json();
      setSessions(d.sessions || []);
      const total = (d.sessions || []).reduce((s, sess) => s + (sess.total_inr || 0), 0);
      setA2aRevenue(total);
    } catch { /* ignore */ }
  };

  const loadManifest = async () => {
    try {
      const r = await fetch(`${API}/api/a2a/manifest`);
      setManifest(await r.json());
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadSessions();
    loadManifest();
  }, []);

  useEffect(() => {
    if (stepsRef.current) {
      stepsRef.current.scrollTop = stepsRef.current.scrollHeight;
    }
  }, [liveSteps]);

  const triggerBuyer = async () => {
    const chosen = INTENTS[selectedIntent];
    setLiveSteps([]);
    setDone(null);
    setRunning(true);

    try {
      const resp = await fetch(`${API}/api/a2a/simulate-buyer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: chosen.intent, budget_inr: chosen.budget, preferences: chosen.prefs })
      });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.trim()) continue;
          const lines = part.split('\n');
          let eventType = 'message';
          let dataLine = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            if (line.startsWith('data: ')) dataLine = line.slice(6).trim();
          }
          if (!dataLine) continue;
          try {
            const parsed = JSON.parse(dataLine);
            if (eventType === 'step') {
              setLiveSteps(prev => [...prev, parsed]);
            } else if (eventType === 'done') {
              setDone(parsed);
              // Immediately refresh all merchant dashboard tabs (Orders, Payments, Audit, Activity)
              setTimeout(() => {
                loadSessions();
                if (onRefresh) onRefresh();
              }, 500);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      setLiveSteps(prev => [...prev, { phase: 'ERROR', message: `Connection error: ${err.message}`, ts: new Date().toISOString() }]);
    }

    setRunning(false);
  };

  return (
    <div>
      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 50%, #4c1d95 100%)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(109, 40, 217, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            padding: '0.25rem 0.65rem', borderRadius: '9999px',
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: '0.75rem'
          }}>
            <Globe size={13} color="#c4b5fd" />
            RazorGrow-A2A/1.0 Protocol
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            AI Buyer Commerce
          </h2>
          <p style={{ color: '#ddd6fe', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: 550 }}>
            This merchant is fully transactable by autonomous AI buyers. No human involvement — discover, negotiate, and checkout via machine-to-machine APIs.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>A2A Revenue</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa' }}>
              ₹{a2aRevenue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#c4b5fd' }}>{sessions.length} completed sessions</div>
          </div>
          <button
            type="button"
            style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: 'white', borderRadius: '8px', padding: '0.4rem 0.9rem',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)'
            }}
            onClick={() => setShowManifest(v => !v)}
          >
            <FileJson size={13} style={{ marginRight: 4 }} />
            {showManifest ? 'Hide' : 'View'} Manifest
          </button>
        </div>
      </div>

      {/* Manifest viewer */}
      {showManifest && manifest && (
        <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #1e3a5f' }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            GET /api/a2a/manifest — Machine-Readable Merchant Capability Card
          </div>
          <pre style={{ color: '#a5f3fc', fontSize: '0.75rem', lineHeight: 1.6, overflowX: 'auto', margin: 0 }}>
            {JSON.stringify(manifest, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Left: Buyer Simulator */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={18} color="#7c3aed" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Trigger AI Buyer Agent</span>
          </div>

          <div style={{ padding: '1.25rem' }}>
            {/* Intent selector */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Buyer Intent
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {INTENTS.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedIntent(i)}
                    style={{
                      textAlign: 'left', padding: '0.6rem 0.9rem', borderRadius: '8px',
                      border: selectedIntent === i ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                      background: selectedIntent === i ? '#f5f3ff' : 'white',
                      cursor: 'pointer', fontSize: '0.82rem',
                      color: selectedIntent === i ? '#5b21b6' : '#475569', fontWeight: selectedIntent === i ? 700 : 400
                    }}
                  >
                    {item.label} <span style={{ color: '#94a3b8', fontWeight: 400 }}>· ₹{item.budget.toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              id="trigger-a2a-buyer-btn"
              disabled={running}
              onClick={triggerBuyer}
              style={{
                width: '100%', padding: '0.75rem',
                background: running ? '#94a3b8' : 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                color: 'white', border: 'none', borderRadius: '10px',
                fontWeight: 700, fontSize: '0.9rem', cursor: running ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: running ? 'none' : '0 4px 14px rgba(109,40,217,0.4)'
              }}
            >
              {running ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={16} />}
              {running ? 'AI Buyer Running...' : 'Trigger AI Buyer Agent'}
            </button>

            {/* Protocol flow diagram */}
            <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                A2A Protocol Flow
              </div>
              {['GET /manifest', 'POST /discover', 'POST /negotiate', 'POST /checkout'].map((ep, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: i < 3 ? '0.15rem' : 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#475569' }}>{ep}</span>
                  {i < 3 && <div style={{ width: 1, height: 12, background: '#cbd5e1', marginLeft: 2, marginTop: 4 }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Stream */}
        <div style={{ background: '#0f172a', borderRadius: '14px', border: '1px solid #1e3a5f', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1e3a5f', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} color="#a78bfa" />
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e2e8f0' }}>Live Agent Stream</span>
            {running && (
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#a78bfa' }}>
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                LIVE
              </span>
            )}
          </div>

          <div
            ref={stepsRef}
            style={{ height: 380, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {liveSteps.length === 0 && (
              <div style={{ color: '#475569', fontSize: '0.82rem', textAlign: 'center', marginTop: '4rem' }}>
                <Bot size={32} color="#334155" style={{ marginBottom: '0.5rem' }} />
                <div>Trigger an AI buyer to see the real-time agent trace</div>
              </div>
            )}

            {liveSteps.map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
                padding: '0.5rem 0.75rem', borderLeft: `3px solid ${phaseColors[s.phase] || '#64748b'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem' }}>{phaseIcon(s.phase)}</span>
                  <span style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.45, flex: 1 }}>{s.message}</span>
                </div>
                {s.payload && Object.keys(s.payload).length > 0 && s.phase !== 'INIT' && (
                  <details style={{ marginTop: '0.3rem' }}>
                    <summary style={{ fontSize: '0.68rem', color: '#64748b', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ChevronRight size={10} /> payload
                    </summary>
                    <pre style={{ fontSize: '0.65rem', color: '#7dd3fc', margin: '0.3rem 0 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', maxHeight: 120 }}>
                      {JSON.stringify(s.payload, null, 2).slice(0, 400)}{JSON.stringify(s.payload).length > 400 ? '...' : ''}
                    </pre>
                  </details>
                )}
                <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: '0.15rem' }}>
                  {new Date(s.ts).toLocaleTimeString()}
                </div>
              </div>
            ))}

            {done && (
              <div style={{
                borderRadius: '10px', padding: '0.75rem',
                background: done.status === 'SUCCESS' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${done.status === 'SUCCESS' ? '#16a34a' : '#dc2626'}`
              }}>
                {done.status === 'SUCCESS' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle size={16} color="#22c55e" />
                    <div>
                      <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.82rem' }}>
                        ₹{(done.total_inr || 0).toLocaleString('en-IN')} captured. Zero humans involved.
                      </div>
                      <div style={{ color: '#86efac', fontSize: '0.7rem' }}>Order: {done.order_id} · Payment: {done.payment_id}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <XCircle size={16} color="#ef4444" />
                    <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.82rem' }}>
                      {done.reason || done.status}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '1.5rem' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={16} color="#7c3aed" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Completed A2A Sessions</span>
            {sessions.length > 0 && (
              <span style={{ background: '#f5f3ff', color: '#7c3aed', fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                {sessions.length}
              </span>
            )}
          </div>
          <button type="button" onClick={loadSessions} style={{ fontSize: '0.75rem', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Refresh
          </button>
        </div>

        {sessions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <Bot size={36} color="#e2e8f0" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No A2A sessions yet</div>
            <div style={{ fontSize: '0.82rem' }}>Trigger an AI buyer above to see sessions appear here</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Buyer Agent', 'Products', 'Total', 'Coupon', 'Payment ID', 'Status', 'Time', ''].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setExpandedSession(expandedSession === i ? null : i)}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <code style={{ fontSize: '0.72rem', background: '#f5f3ff', color: '#6d28d9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                          {s.buyer_agent_id ? s.buyer_agent_id.replace('gemini_buyer_', 'buyer_') : '—'}
                        </code>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>
                        {(s.line_items || []).map(li => li.name).join(', ').slice(0, 35) || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#7c3aed' }}>
                        ₹{(s.total_inr || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {s.coupon ? (
                          <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            {s.coupon.code}
                          </span>
                        ) : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <code style={{ fontSize: '0.68rem', color: '#64748b' }}>{s.razorpay_payment_id || '—'}</code>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700,
                          padding: '0.15rem 0.5rem', borderRadius: '9999px',
                          background: s.status === 'COMPLETED' ? '#f0fdf4' : '#fef2f2',
                          color: s.status === 'COMPLETED' ? '#16a34a' : '#dc2626'
                        }}>
                          {s.status === 'COMPLETED' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.72rem' }}>
                        {s.created_at ? new Date(s.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {expandedSession === i ? <ChevronDown size={14} color="#7c3aed" /> : <ChevronRight size={14} color="#94a3b8" />}
                      </td>
                    </tr>
                    {expandedSession === i && (
                      <tr>
                        <td colSpan={8} style={{ padding: 0, background: '#f8fafc' }}>
                          <div style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Line Items</div>
                                {(s.line_items || []).map(li => (
                                  <div key={li.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#374151', marginBottom: '0.2rem' }}>
                                    <span>{li.name} {li.tag === 'upsell' ? <span style={{ color: '#7c3aed', fontSize: '0.65rem' }}>↑ UPSELL</span> : ''}</span>
                                    <span style={{ fontWeight: 600 }}>₹{li.price_inr?.toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                                {s.coupon && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#16a34a', borderTop: '1px dashed #e2e8f0', paddingTop: '0.3rem', marginTop: '0.3rem' }}>
                                    <span>Coupon {s.coupon.code}</span>
                                    <span>−₹{s.coupon.discount_amount}</span>
                                  </div>
                                )}
                              </div>
                              {s.gemini_reasoning && (
                                <div>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Gemini Buyer Reasoning</div>
                                  <div style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', lineHeight: 1.5 }}>"{s.gemini_reasoning}"</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
