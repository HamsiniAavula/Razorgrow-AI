import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Save, CheckCircle2, Lock } from 'lucide-react';

export default function PoliciesTab({ policies, onUpdatePolicies, isUpdating }) {
  const [form, setForm] = useState({
    max_transaction_amount: policies?.max_transaction_amount || 5000,
    max_upsell_amount: policies?.max_upsell_amount || 500,
    max_discount_percent: policies?.max_discount_percent || 10,
    customer_approval_required: policies?.customer_approval_required ?? true,
    allow_out_of_stock: policies?.allow_out_of_stock ?? false,
    allow_auto_refund: policies?.allow_auto_refund ?? false
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdatePolicies(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShieldCheck size={24} color="#2563eb" />
            <span>AI Commerce Policy Controls</span>
          </h1>
          <p className="page-subtitle">
            Deterministic rule boundary that constrains all AI agent proposals, cart additions, and discounts.
          </p>
        </div>
      </div>

      {/* Critical Security Alert Warning */}
      <div style={{
        background: '#fffbeb',
        border: '1.5px solid #fde68a',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem'
      }}>
        <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.95rem' }}>
            Merchant Security Guarantee
          </div>
          <div style={{ color: '#b45309', fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: 1.5 }}>
            "These controls constrain AI actions. The AI cannot modify merchant policies."
            Every recommendation, upsell, and discount is checked by the server-side Policy Engine before reaching the customer.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-header">
          <div className="card-title">
            <Lock size={18} color="#0c2340" />
            <span>Operational Thresholds</span>
          </div>
          <span className="badge badge-neutral">Strictly Enforced</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Max Transaction Amount */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '0.35rem' }}>
              Maximum Transaction Amount (₹)
            </label>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem' }}>
              AI will reject orders whose subtotal exceeds this risk threshold (Default: ₹5,000).
            </div>
            <input
              type="number"
              value={form.max_transaction_amount}
              onChange={(e) => setForm({ ...form, max_transaction_amount: e.target.value })}
              style={{
                width: '100%',
                maxWidth: '300px',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-mono)'
              }}
              required
            />
          </div>

          {/* Max Upsell Amount */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '0.35rem' }}>
              Maximum Upsell Amount (₹)
            </label>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem' }}>
              Maximum price for an AI-proposed complementary product. Upsells above this limit are blocked and trigger re-planning (Default: ₹500).
            </div>
            <input
              type="number"
              value={form.max_upsell_amount}
              onChange={(e) => setForm({ ...form, max_upsell_amount: e.target.value })}
              style={{
                width: '100%',
                maxWidth: '300px',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-mono)'
              }}
              required
            />
          </div>

          {/* Max Discount Percent */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '0.35rem' }}>
              Maximum Discount Percentage (%)
            </label>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem' }}>
              Ceiling on promotional discounts. Coupons like WELCOME15 (15%) are rejected if they exceed this rate (Default: 10%).
            </div>
            <input
              type="number"
              value={form.max_discount_percent}
              onChange={(e) => setForm({ ...form, max_discount_percent: e.target.value })}
              style={{
                width: '100%',
                maxWidth: '300px',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-mono)'
              }}
              required
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9' }} />

          {/* Customer Approval Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                Customer Approval Required
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Forbids silent cart modifications. Customer must explicitly click "Yes, add it" for AI upsells.
              </div>
            </div>
            <input
              type="checkbox"
              checked={form.customer_approval_required}
              onChange={(e) => setForm({ ...form, customer_approval_required: e.target.checked })}
              style={{ width: '20px', height: '20px', accentColor: '#2563eb', cursor: 'pointer' }}
            />
          </div>

          {/* Out of Stock Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                Allow Out-of-Stock Recommendations
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                If disabled, items with 0 inventory are immediately filtered out by the catalog tool.
              </div>
            </div>
            <input
              type="checkbox"
              checked={form.allow_out_of_stock}
              onChange={(e) => setForm({ ...form, allow_out_of_stock: e.target.checked })}
              style={{ width: '20px', height: '20px', accentColor: '#2563eb', cursor: 'pointer' }}
            />
          </div>

          {/* Auto Refund Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                Automatic Refunds
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Requires merchant confirmation before executing any Razorpay refund.
              </div>
            </div>
            <input
              type="checkbox"
              checked={form.allow_auto_refund}
              onChange={(e) => setForm({ ...form, allow_auto_refund: e.target.checked })}
              style={{ width: '20px', height: '20px', accentColor: '#2563eb', cursor: 'pointer' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={isUpdating}
          >
            <Save size={16} />
            <span>{isUpdating ? 'Saving Policies...' : 'Confirm & Save Policies'}</span>
          </button>

          {savedSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontSize: '0.85rem', fontWeight: 700 }}>
              <CheckCircle2 size={18} />
              <span>Policies successfully updated and logged in Audit Ledger!</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
