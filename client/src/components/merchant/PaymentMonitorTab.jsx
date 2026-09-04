import React, { useState } from 'react';
import { CreditCard, CheckCircle2, Clock, XCircle, ShieldAlert, RefreshCw } from 'lucide-react';

export default function PaymentMonitorTab({ payments = [], orders = [] }) {
  const [filter, setFilter] = useState('ALL');

  // Merge payment events and orders to provide a unified payment monitoring view
  const combinedPayments = orders.map(order => {
    const matchingPevt = payments.find(p => p.order_id === order.id || p.order_id === order.razorpay_order_id);
    return {
      order_id: order.id,
      razorpay_order_id: order.razorpay_order_id || 'N/A',
      razorpay_payment_id: order.razorpay_payment_id || 'N/A',
      amount: order.total,
      status: order.status,
      timestamp: order.created_at,
      failure_reason: order.failure_reason || matchingPevt?.error || null,
      event_type: matchingPevt?.event_type || (order.status === 'PAID' ? 'payment.captured' : order.status === 'PAYMENT_FAILED' ? 'payment.failed' : 'order.created')
    };
  });

  const filtered = combinedPayments.filter(p => {
    if (filter === 'PAID') return p.status === 'PAID';
    if (filter === 'FAILED') return p.status === 'PAYMENT_FAILED';
    if (filter === 'PENDING') return p.status === 'PAYMENT_PENDING' || p.status === 'CREATED';
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CreditCard size={24} color="#0c2340" />
            <span>Payment Monitor</span>
          </h1>
          <p className="page-subtitle">
            Direct server-side verification trace of Razorpay transactions, webhooks, and payment failures.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'ALL', label: 'All Transactions' },
            { id: 'PAID', label: 'Captured (Paid)' },
            { id: 'FAILED', label: 'Failed' },
            { id: 'PENDING', label: 'Pending' }
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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Razorpay Order ID</th>
                <th>Payment ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Webhook Event</th>
                <th>Timestamp</th>
                <th>Diagnostics / Failure Reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const dateStr = new Date(item.timestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        {item.order_id}
                      </td>

                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#0284c7' }}>
                        {item.razorpay_order_id}
                      </td>

                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: item.status === 'PAID' ? '#059669' : '#dc2626' }}>
                        {item.razorpay_payment_id}
                      </td>

                      <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        ₹{item.amount?.toLocaleString('en-IN')}
                      </td>

                      <td>
                        {item.status === 'PAID' && (
                          <span className="badge badge-paid"><CheckCircle2 size={12} /> PAID</span>
                        )}
                        {item.status === 'PAYMENT_FAILED' && (
                          <span className="badge badge-failed"><XCircle size={12} /> FAILED</span>
                        )}
                        {(item.status === 'PAYMENT_PENDING' || item.status === 'CREATED') && (
                          <span className="badge badge-pending"><Clock size={12} /> PENDING</span>
                        )}
                      </td>

                      <td>
                        <span className="badge-tag" style={{ background: '#f1f5f9', color: '#334155', fontFamily: 'var(--font-mono)' }}>
                          {item.event_type}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {dateStr}
                      </td>

                      <td>
                        {item.failure_reason ? (
                          <div style={{
                            color: '#b91c1c',
                            background: '#fef2f2',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            border: '1px solid #fecaca',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}>
                            <ShieldAlert size={13} />
                            <span>{item.failure_reason}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#059669', fontSize: '0.75rem', fontWeight: 600 }}>
                            Captured & Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
