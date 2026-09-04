import React from 'react';
import { Tag, ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function CouponsTab({ coupons = [], policy }) {
  const maxDiscountAllowed = policy?.max_discount_percent || 10;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Tag size={24} color="#d97706" />
            <span>Coupons & Discount Safeguards</span>
          </h1>
          <p className="page-subtitle">
            Autonomous coupon evaluation strictly governed by your merchant policy ceiling of {maxDiscountAllowed}% maximum discount.
          </p>
        </div>

        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '0.45rem 0.9rem',
          fontSize: '0.8rem',
          color: '#1e40af',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <ShieldCheck size={16} />
          <span>Deterministic Policy Ceiling: {maxDiscountAllowed}%</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {coupons.map(coupon => {
          const isOverPolicy = (coupon.type === 'percentage' && coupon.value > maxDiscountAllowed);

          return (
            <div
              key={coupon.id}
              className="card"
              style={{
                borderColor: isOverPolicy ? '#fca5a5' : '#e2e8f0',
                background: isOverPolicy ? 'linear-gradient(180deg, #ffffff 0%, #fff1f2 100%)' : '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: isOverPolicy ? '#dc2626' : '#0284c7',
                  background: '#f1f5f9',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px'
                }}>
                  {coupon.code}
                </span>

                {isOverPolicy ? (
                  <span className="badge badge-failed">
                    <ShieldAlert size={12} /> Exceeds Policy
                  </span>
                ) : (
                  <span className="badge badge-paid">
                    <CheckCircle2 size={12} /> Validated
                  </span>
                )}
              </div>

              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} FLAT OFF`}
              </div>

              <p style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '1rem', minHeight: '36px' }}>
                {coupon.description}
              </p>

              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.78rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Minimum Order:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{coupon.minimum_order}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Max Discount Cap:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{coupon.max_discount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Policy Evaluation:</span>
                  <span style={{ fontWeight: 700, color: isOverPolicy ? '#dc2626' : '#059669' }}>
                    {isOverPolicy ? `Blocked (${coupon.value}% > ${maxDiscountAllowed}%)` : `Permitted (<= ${maxDiscountAllowed}%)`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
