import React, { useState } from 'react';
import { Activity, ShieldCheck, Sparkles, CheckCircle2, XCircle, ShoppingBag, CreditCard, Tag } from 'lucide-react';

export default function ActivityTab({ activities = [] }) {
  const [filter, setFilter] = useState('ALL');

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'UPSELL_PROPOSED':
      case 'PRODUCT_RECOMMENDED':
        return <Sparkles size={16} color="#7c3aed" />;
      case 'UPSELL_BLOCKED':
      case 'PAYMENT_FAILED':
        return <XCircle size={16} color="#dc2626" />;
      case 'CUSTOMER_APPROVED':
      case 'CART_UPDATED':
        return <ShoppingBag size={16} color="#0284c7" />;
      case 'COUPON_OPTIMIZED':
      case 'COUPON_SELECTED':
      case 'COUPON_EVALUATED':
        return <Tag size={16} color="#d97706" />;
      case 'RAZORPAY_ORDER_CREATED':
      case 'PAYMENT_VERIFIED':
      case 'REVENUE_ATTRIBUTED':
        return <CreditCard size={16} color="#059669" />;
      default:
        return <Activity size={16} color="#2563eb" />;
    }
  };

  const filtered = activities.filter(act => {
    if (filter === 'UPSELL') return act.action_type.includes('UPSELL');
    if (filter === 'COUPON') return act.action_type.includes('COUPON');
    if (filter === 'PAYMENT') return act.action_type.includes('PAYMENT') || act.action_type.includes('REVENUE');
    if (filter === 'BLOCKED') return act.status === 'BLOCKED' || act.status === 'FAILED';
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Activity size={24} color="#059669" />
            <span>AI Activity Stream</span>
          </h1>
          <p className="page-subtitle">
            Live chronological ledger of autonomous reasoning, constraints, customer authorizations, and Razorpay transactions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'UPSELL', label: 'Upsells' },
            { id: 'COUPON', label: 'Coupons' },
            { id: 'PAYMENT', label: 'Payments' },
            { id: 'BLOCKED', label: 'Safety Blocks' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              className={`btn-outline ${filter === f.id ? 'active' : ''}`}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                background: filter === f.id ? '#0c2340' : '#ffffff',
                color: filter === f.id ? '#ffffff' : '#475569',
                borderColor: filter === f.id ? '#0c2340' : '#e2e8f0',
                fontWeight: 600
              }}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              No activities found in this filter category.
            </div>
          ) : (
            filtered.map((act) => {
              const dateObj = new Date(act.timestamp);
              const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <div
                  key={act.id}
                  style={{
                    padding: '1rem 1.25rem',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getActionIcon(act.action_type)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                          {act.action_type.replace(/_/g, ' ')}
                        </span>
                        <span className={`badge ${
                          act.status === 'SUCCESS' ? 'badge-paid' :
                          act.status === 'BLOCKED' || act.status === 'FAILED' ? 'badge-failed' : 'badge-neutral'
                        }`}>
                          {act.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748b' }}>
                        <span>{dateStr}</span>
                        <span>{timeStr}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 500, marginBottom: '0.35rem' }}>
                      {act.reason}
                    </div>

                    {act.output_summary && (
                      <div style={{
                        background: '#f8fafc',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#475569',
                        fontFamily: 'var(--font-mono)',
                        border: '1px solid #f1f5f9'
                      }}>
                        {act.output_summary}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
