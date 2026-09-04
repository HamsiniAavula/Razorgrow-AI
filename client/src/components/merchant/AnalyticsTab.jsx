import React from 'react';
import { BarChart3, TrendingUp, Sparkles, Filter, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AnalyticsTab({ stats }) {
  const funnel = stats?.upsell_funnel || {
    recommendations_shown: 1420,
    upsells_proposed: 860,
    upsells_accepted: 395,
    successful_payments: 368
  };

  const performance = stats?.upsell_performance || [
    {
      product: 'Running Shoes',
      upsell: 'Performance Socks',
      proposed: 310,
      accepted: 142,
      conversion: '45.8%',
      revenue: 56658
    },
    {
      product: 'Classic Watch',
      upsell: 'Gift Packaging',
      proposed: 245,
      accepted: 118,
      conversion: '48.1%',
      revenue: 23482
    },
    {
      product: 'Wireless Earbuds',
      upsell: 'Gift Packaging',
      proposed: 180,
      accepted: 76,
      conversion: '42.2%',
      revenue: 15124
    },
    {
      product: 'Laptop',
      upsell: 'Wireless Mouse',
      proposed: 125,
      accepted: 59,
      conversion: '47.2%',
      revenue: 47141
    }
  ];

  const totalRev = stats?.total_revenue || 842350;
  const aiRev = stats?.ai_attributed_revenue || 126400;
  const aiPercent = ((aiRev / totalRev) * 100).toFixed(1);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BarChart3 size={24} color="#7c3aed" />
            <span>AI Revenue & Upsell Analytics</span>
          </h1>
          <p className="page-subtitle">
            Conversion funnel dynamics and SKU attachment performance synthesized across AI sales sessions.
          </p>
        </div>

        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          color: '#92400e',
          fontSize: '0.78rem',
          padding: '0.4rem 0.75rem',
          borderRadius: '8px',
          fontWeight: 600
        }}>
          Synthetic baseline + Live captured additions
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <span className="kpi-label">Total Platform Revenue</span>
          <div className="kpi-value" style={{ marginTop: '0.5rem' }}>
            ₹{totalRev.toLocaleString('en-IN')}
          </div>
          <div className="kpi-footer">
            <span style={{ color: '#64748b' }}>Includes all channels</span>
          </div>
        </div>

        <div className="kpi-card ai-highlight">
          <span className="kpi-label">AI-Attributed Revenue</span>
          <div className="kpi-value" style={{ color: '#7c3aed', marginTop: '0.5rem' }}>
            ₹{aiRev.toLocaleString('en-IN')}
          </div>
          <div className="kpi-footer">
            <span className="badge-tag" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              Captured payment verified
            </span>
          </div>
        </div>

        <div className="kpi-card highlight">
          <span className="kpi-label">AI Contribution %</span>
          <div className="kpi-value" style={{ color: '#059669', marginTop: '0.5rem' }}>
            {aiPercent}%
          </div>
          <div className="kpi-footer">
            <span style={{ color: '#64748b' }}>Of total monthly GMV</span>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Filter size={18} color="#0284c7" />
            <span>AI Upsell Conversion Funnel</span>
          </div>
          <span className="badge badge-neutral">Autonomous Journey</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
          {[
            { stage: 'Recommendations', value: funnel.recommendations_shown, drop: '100%', bg: '#eff6ff', color: '#1d4ed8' },
            { stage: 'Upsells Proposed', value: funnel.upsells_proposed, drop: `${((funnel.upsells_proposed / funnel.recommendations_shown) * 100).toFixed(0)}%`, bg: '#f5f3ff', color: '#7c3aed' },
            { stage: 'Upsells Accepted', value: funnel.upsells_accepted, drop: `${((funnel.upsells_accepted / funnel.upsells_proposed) * 100).toFixed(0)}%`, bg: '#ecfdf5', color: '#059669' },
            { stage: 'Successful Payments', value: funnel.successful_payments, drop: `${((funnel.successful_payments / funnel.upsells_accepted) * 100).toFixed(0)}%`, bg: '#f0fdf4', color: '#15803d' }
          ].map((step, idx) => (
            <div
              key={idx}
              style={{
                background: step.bg,
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '12px',
                padding: '1.25rem',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: step.color }}>
                Stage {idx + 1}
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0', fontFamily: 'var(--font-mono)' }}>
                {step.value.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                {step.stage}
              </div>
              <div style={{ fontSize: '0.75rem', color: step.color, fontWeight: 700, marginTop: '0.5rem' }}>
                {step.drop} conversion
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upsell Performance Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <div className="card-title">
            <Sparkles size={18} color="#059669" />
            <span>SKU Pairing Upsell Performance</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Primary Product</th>
                <th>Upsell Product</th>
                <th>Proposed Count</th>
                <th>Accepted Count</th>
                <th>Conversion Rate</th>
                <th>Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{row.product}</td>
                  <td>
                    <span className="badge-tag" style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>
                      + {row.upsell}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{row.proposed}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 600 }}>{row.accepted}</td>
                  <td>
                    <span className="badge badge-paid" style={{ fontSize: '0.75rem' }}>
                      {row.conversion}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0f172a' }}>
                    ₹{row.revenue.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
