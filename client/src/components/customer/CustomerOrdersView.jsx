import React from 'react';
import { ShoppingBag, CheckCircle2, Clock, XCircle, Package } from 'lucide-react';

export default function CustomerOrdersView({ orders = [] }) {
  const customerOrders = orders.filter(o => o.customer_name === 'Arjun Verma' || !o.customer_name);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Package size={24} color="#0c2340" />
            <span>My Orders</span>
          </h1>
          <p className="page-subtitle">
            Your purchases with verified Razorpay payment receipts and autonomous coupon applications.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {customerOrders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            You haven't placed any orders yet. Ask the AI Assistant to recommend products!
          </div>
        ) : (
          customerOrders.map(order => {
            const dateStr = new Date(order.created_at).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={order.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0f172a' }}>
                      Order #{order.id}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '0.75rem' }}>
                      {dateStr}
                    </span>
                  </div>

                  <div>
                    {order.status === 'PAID' && (
                      <span className="badge badge-paid"><CheckCircle2 size={12} /> Payment Verified</span>
                    )}
                    {order.status === 'PAYMENT_FAILED' && (
                      <span className="badge badge-failed"><XCircle size={12} /> Payment Failed</span>
                    )}
                    {(order.status === 'PAYMENT_PENDING' || order.status === 'CREATED') && (
                      <span className="badge badge-pending"><Clock size={12} /> Pending</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</span>
                        {item.is_upsell && (
                          <span className="badge-tag" style={{ background: '#f5f3ff', color: '#7c3aed', fontSize: '0.68rem' }}>
                            AI Upsell
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{item.price}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {order.razorpay_payment_id && (
                      <span>Razorpay ID: <code style={{ color: '#059669' }}>{order.razorpay_payment_id}</code></span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#64748b', marginRight: '0.5rem' }}>Total Paid:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                      ₹{order.total?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
