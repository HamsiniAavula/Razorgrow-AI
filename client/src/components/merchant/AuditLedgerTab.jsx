import React, { useState } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  FileText,
  Lock,
  Layers,
  ShoppingBag,
  CreditCard
} from 'lucide-react';

export default function AuditLedgerTab({ auditLedger = [] }) {
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filtered = auditLedger.filter(item => {
    const matchesSearch =
      item.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.order_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.input_summary || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = actionFilter === 'ALL' || item.action_type === actionFilter;
    return matchesSearch && matchesFilter;
  });

  const getActionBadge = (status) => {
    if (status === 'SUCCESS') return <span className="badge badge-paid"><CheckCircle2 size={12} /> SUCCESS</span>;
    if (status === 'BLOCKED') return <span className="badge badge-failed"><Lock size={12} /> BLOCKED</span>;
    if (status === 'FAILED') return <span className="badge badge-failed"><XCircle size={12} /> FAILED</span>;
    return <span className="badge badge-neutral">{status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShieldCheck size={24} color="#0c2340" />
            <span>AI Action Ledger & Audit Trail</span>
          </h1>
          <p className="page-subtitle">
            Append-only cryptographic timeline of autonomous agent actions, evidence constraints, and policy evaluations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search actions, evidence, order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem 0.45rem 2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                width: '280px'
              }}
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff'
            }}
          >
            <option value="ALL">All Action Types</option>
            <option value="INTENT_DETECTED">INTENT_DETECTED</option>
            <option value="PRODUCT_RECOMMENDED">PRODUCT_RECOMMENDED</option>
            <option value="UPSELL_PROPOSED">UPSELL_PROPOSED</option>
            <option value="UPSELL_BLOCKED">UPSELL_BLOCKED</option>
            <option value="CUSTOMER_APPROVED">CUSTOMER_APPROVED</option>
            <option value="CART_UPDATED">CART_UPDATED</option>
            <option value="COUPON_EVALUATED">COUPON_EVALUATED</option>
            <option value="COUPON_SELECTED">COUPON_SELECTED</option>
            <option value="RAZORPAY_ORDER_CREATED">RAZORPAY_ORDER_CREATED</option>
            <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
            <option value="PAYMENT_FAILED">PAYMENT_FAILED</option>
            <option value="REVENUE_ATTRIBUTED">REVENUE_ATTRIBUTED</option>
          </select>
        </div>
      </div>

      <div className="timeline-container">
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No audit ledger entries match your filter.
          </div>
        ) : (
          filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const dateObj = new Date(item.timestamp);
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

            return (
              <div key={item.id} className="timeline-item">
                <div className="timeline-header" onClick={() => toggleExpand(item.id)}>
                  <div className="timeline-left">
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center' }}
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <div className="timeline-time">
                      {dateStr} {timeStr}
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                      {item.action_type}
                    </div>

                    {getActionBadge(item.status)}

                    {item.order_id && (
                      <span className="badge-tag" style={{ background: '#eff6ff', color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                        {item.order_id}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#475569', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.reason}
                  </div>
                </div>

                {isExpanded && (
                  <div className="timeline-content">
                    <div className="timeline-grid">
                      <div className="timeline-box">
                        <div className="timeline-box-title">Input Summary</div>
                        <div style={{ color: '#0f172a', fontWeight: 600 }}>{item.input_summary || 'N/A'}</div>
                      </div>

                      <div className="timeline-box">
                        <div className="timeline-box-title">Output Summary</div>
                        <div style={{ color: '#0f172a', fontWeight: 600 }}>{item.output_summary || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="timeline-box">
                      <div className="timeline-box-title">Structured Reasoning & Decision Justification</div>
                      <div style={{ color: '#334155', lineHeight: 1.5 }}>{item.reason}</div>
                    </div>

                    <div className="timeline-box">
                      <div className="timeline-box-title">Verifiable Evidence & Deterministic Logs</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#475569', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px' }}>
                        {item.evidence || 'None logged'}
                      </div>
                    </div>

                    {item.policy_checks && (
                      <div className="timeline-box">
                        <div className="timeline-box-title">Policy Safeguard Checks</div>
                        <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto' }}>
                          {JSON.stringify(item.policy_checks, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
