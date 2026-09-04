import React, { useState } from 'react';
import { ArrowRight, Sparkles, CheckCircle2, TrendingUp, AlertCircle, ShieldCheck } from 'lucide-react';

export default function OpportunitiesTab({ opportunities = [], onActivateOpportunity, isActivating }) {
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, PENDING

  const filtered = opportunities.filter(o => {
    if (activeTab === 'ACTIVE') return o.status === 'ACTIVE';
    if (activeTab === 'PENDING') return o.status !== 'ACTIVE';
    return true;
  });

  const totalPotential = opportunities.reduce((sum, o) => sum + (o.estimated_monthly_revenue || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Sparkles size={24} color="#7c3aed" />
            <span>AI Revenue Opportunities</span>
          </h1>
          <p className="page-subtitle">
            Catalog basket affinity analysis comparing historical co-purchase attachment against fintech category benchmarks.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '0.5rem 1rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Identified Pipeline
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)' }}>
              ₹{totalPotential.toLocaleString('en-IN')}<span style={{ fontSize: '0.8rem', color: '#64748b' }}>/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Constraint Banner */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '10px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.85rem',
        color: '#1e40af'
      }}>
        <ShieldCheck size={20} color="#2563eb" />
        <div>
          <strong>Autonomous Safeguard:</strong> Opportunities remain dormant until authorized by merchant. Once activated, every upsell is strictly bounded by your ₹500 price policy and requires explicit customer approval.
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'ALL', label: `All Opportunities (${opportunities.length})` },
          { key: 'ACTIVE', label: `Active (${opportunities.filter(o => o.status === 'ACTIVE').length})` },
          { key: 'PENDING', label: `Pending Activation (${opportunities.filter(o => o.status !== 'ACTIVE').length})` }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`btn-outline ${activeTab === tab.key ? 'active' : ''}`}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.82rem',
              background: activeTab === tab.key ? '#0c2340' : '#ffffff',
              color: activeTab === tab.key ? '#ffffff' : '#475569',
              borderColor: activeTab === tab.key ? '#0c2340' : '#e2e8f0',
              fontWeight: 700
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Opportunities Grid */}
      <div className="opp-grid">
        {filtered.map(opp => {
          const isActive = opp.status === 'ACTIVE';
          return (
            <div key={opp.id} className={`opp-card ${isActive ? 'active-opp' : ''}`}>
              <div>
                <div className="opp-badge-row">
                  <span className={`badge ${isActive ? 'badge-paid' : 'badge-pending'}`}>
                    {isActive ? 'Active in Assistant' : 'Pending Activation'}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                    Upsell Price: ₹{opp.upsell_price}
                  </span>
                </div>

                <div className="opp-pair">
                  <span>{opp.product_name}</span>
                  <ArrowRight size={16} color="#94a3b8" />
                  <span style={{ color: '#2563eb' }}>{opp.recommended_product_name}</span>
                </div>

                <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5, marginTop: '0.5rem' }}>
                  {opp.reason}
                </p>

                {/* Stat Comparison */}
                <div className="opp-stats-row">
                  <div className="opp-stat-item">
                    <span className="opp-stat-label">Current Rate</span>
                    <span className="opp-stat-value" style={{ color: '#64748b' }}>
                      {opp.current_attachment_rate}%
                    </span>
                  </div>

                  <div className="opp-stat-item">
                    <span className="opp-stat-label">Benchmark</span>
                    <span className="opp-stat-value" style={{ color: '#2563eb' }}>
                      {opp.benchmark_attachment_rate}%
                    </span>
                  </div>

                  <div className="opp-stat-item">
                    <span className="opp-stat-label">Est. Uplift</span>
                    <span className="opp-stat-value" style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>
                      ₹{opp.estimated_monthly_revenue.toLocaleString('en-IN')}<span style={{ fontSize: '0.65rem' }}>/mo</span>
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                {isActive ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontSize: '0.82rem', fontWeight: 700 }}>
                    <CheckCircle2 size={16} />
                    <span>AI Upsell Enabled in Customer Assistant</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => onActivateOpportunity(opp.id)}
                    disabled={isActivating}
                  >
                    <Sparkles size={15} />
                    <span>Activate AI Upsell</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
