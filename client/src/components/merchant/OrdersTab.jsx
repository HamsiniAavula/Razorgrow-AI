import React, { useState } from 'react';
import { ShoppingBag, CheckCircle2, Clock, XCircle, Search, Sparkles, ExternalLink } from 'lucide-react';

export default function OrdersTab({ orders = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = orders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.razorpay_order_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="badge badge-paid"><CheckCircle2 size={12} /> PAID</span>;
      case 'PAYMENT_PENDING':
      case 'CREATED':
        return <span className="badge badge-pending"><Clock size={12} /> PENDING</span>;
      case 'PAYMENT_FAILED':
        return <span className="badge badge-failed"><XCircle size={12} /> FAILED</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShoppingBag size={24} color="#0284c7" />
            <span>Orders Management</span>
          </h1>
          <p className="page-subtitle">
            Every transaction with deterministic subtotal, coupon savings, Razorpay order IDs, and AI revenue attribution.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search order ID, customer, Razorpay ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem 0.45rem 2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                width: '260px'
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid Only</option>
            <option value="PAYMENT_PENDING">Pending</option>
            <option value="PAYMENT_FAILED">Failed Only</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID & Date</th>
                <th>Customer</th>
                <th>Items & Bundles</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Status</th>
                <th>Razorpay IDs</th>
                <th>AI Attributed Rev</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filtered.map(order => {
                  const dateStr = new Date(order.created_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={order.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                          {order.id}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {dateStr}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {order.customer_name || 'Guest Shopper'}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                              <span style={{ color: '#0f172a', fontWeight: 500 }}>{item.name}</span>
                              {item.is_upsell && (
                                <span className="badge-tag" style={{ background: '#f5f3ff', color: '#7c3aed', fontSize: '0.65rem' }}>
                                  AI Upsell
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        ₹{order.subtotal?.toLocaleString('en-IN')}
                      </td>

                      <td style={{ fontFamily: 'var(--font-mono)', color: order.discount > 0 ? '#059669' : '#64748b' }}>
                        {order.discount > 0 ? `-₹${order.discount}` : '₹0'}
                        {order.coupon_code && (
                          <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>
                            {order.coupon_code}
                          </div>
                        )}
                      </td>

                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                        ₹{order.total?.toLocaleString('en-IN')}
                      </td>

                      <td>
                        {getStatusBadge(order.status)}
                      </td>

                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#475569' }}>
                          <div>Ord: {order.razorpay_order_id ? order.razorpay_order_id.substring(0, 18) + '...' : 'None'}</div>
                          {order.razorpay_payment_id && (
                            <div style={{ color: '#059669' }}>Pay: {order.razorpay_payment_id}</div>
                          )}
                          {order.failure_reason && (
                            <div style={{ color: '#dc2626', fontSize: '0.68rem' }}>{order.failure_reason}</div>
                          )}
                        </div>
                      </td>

                      <td>
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          color: order.status === 'PAID' && order.ai_attributed_revenue > 0 ? '#7c3aed' : '#94a3b8',
                          fontSize: '0.9rem'
                        }}>
                          ₹{(order.ai_attributed_revenue || 0).toLocaleString('en-IN')}
                        </div>
                        {order.status === 'PAYMENT_FAILED' && (
                          <div style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 600 }}>
                            ₹0 (Failed captured)
                          </div>
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
