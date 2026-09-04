import React from 'react';
import {
  TrendingUp,
  Sparkles,
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  Activity,
  AlertTriangle
} from 'lucide-react';

export default function OverviewTab({ stats, activity = [], onNavigateTab }) {
  const totalRev = stats?.total_revenue || 842350;
  const aiRev = stats?.ai_attributed_revenue || 126400;
  const aov = stats?.aov || 2174;
  const upsellRate = stats?.ai_upsell_rate || 18.6;
  const ordersCount = stats?.successful_orders || 428;
  const oppsCount = stats?.active_opportunities || 7;
  const aiPercentage = ((aiRev / totalRev) * 100).toFixed(1);

  return (
    <div>
      {/* AI Revenue Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0c2340 0%, #1e3a8a 50%, #0284c7 100%)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem'
          }}>
            <Sparkles size={13} color="#38bdf8" />
            AI Revenue Agent Active
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            "I found 7 revenue opportunities in your catalog."
          </h2>
          <p style={{ color: '#bae6fd', fontSize: '0.9rem', lineHeight: 1.5 }}>
            RazorGrow AI autonomously detects basket affinity gaps, applies merchant-defined policy safeguards, and captures customer-authorized upsells via Razorpay Test Mode.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-primary"
            style={{ background: '#ffffff', color: '#0c2340', fontWeight: 800 }}
            onClick={() => onNavigateTab('opportunities')}
          >
            <span>Review 7 Opportunities</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {/* Total Revenue */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Revenue</span>
            <div className="kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">₹{totalRev.toLocaleString('en-IN')}</div>
          <div className="kpi-footer">
            <span className="badge-tag" style={{ background: '#ecfdf5', color: '#059669' }}>
              <ArrowUpRight size={12} /> +14.2%
            </span>
            <span style={{ color: '#64748b' }}>vs last month</span>
          </div>
        </div>

        {/* AI-Attributed Revenue */}
        <div className="kpi-card ai-highlight">
          <div className="kpi-header">
            <span className="kpi-label">AI-Attributed Revenue</span>
            <div className="kpi-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#7c3aed' }}>
            ₹{aiRev.toLocaleString('en-IN')}
          </div>
          <div className="kpi-footer">
            <span className="badge-tag" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              {aiPercentage}% of total
            </span>
            <span style={{ color: '#64748b' }}>captured only</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Average Order Value</span>
            <div className="kpi-icon" style={{ background: '#f0fdf4', color: '#059669' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value">₹{aov.toLocaleString('en-IN')}</div>
          <div className="kpi-footer">
            <span className="badge-tag" style={{ background: '#ecfdf5', color: '#059669' }}>
              +₹340 with AI upsell
            </span>
          </div>
        </div>

        {/* AI Upsell Rate */}
        <div className="kpi-card highlight">
          <div className="kpi-header">
            <span className="kpi-label">AI Upsell Rate</span>
            <div className="kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#059669' }}>{upsellRate}%</div>
          <div className="kpi-footer">
            <span style={{ color: '#64748b' }}>Benchmark avg: 14.1%</span>
          </div>
        </div>

        {/* Successful Orders */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Captured Orders</span>
            <div className="kpi-icon" style={{ background: '#f1f5f9', color: '#475569' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value">{ordersCount}</div>
          <div className="kpi-footer">
            <span style={{ color: '#64748b' }}>Verified on Razorpay</span>
          </div>
        </div>

        {/* Active Opportunities */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Active Opportunities</span>
            <div className="kpi-icon" style={{ background: '#eff6ff', color: '#0284c7' }}>
              <Layers size={18} />
            </div>
          </div>
          <div className="kpi-value">{oppsCount}</div>
          <div className="kpi-footer">
            <span className="badge-tag" style={{ background: '#eff6ff', color: '#0284c7' }}>
              Policy Constrained
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Revenue Trajectory & Live Activity Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Revenue Trajectory Chart */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                <TrendingUp size={18} color="#2563eb" />
                <span>Revenue Growth & AI Contribution</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                Total Merchant Revenue vs RazorGrow AI Attributed Captured Revenue
              </div>
            </div>
            <span className="badge badge-neutral">Monthly (₹ INR)</span>
          </div>

          {/* Simple Visual Bar Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
            {(stats?.monthly_trend || [
              { month: 'Mar', total: 610000, ai: 72000 },
              { month: 'Apr', total: 680000, ai: 89000 },
              { month: 'May', total: 725000, ai: 98000 },
              { month: 'Jun', total: 760000, ai: 106000 },
              { month: 'Jul', total: 795000, ai: 115000 },
              { month: 'Aug', total: totalRev, ai: aiRev }
            ]).map((item) => {
              const maxVal = 900000;
              const totalPct = (item.total / maxVal) * 100;
              const aiPct = (item.ai / maxVal) * 100;
              return (
                <div key={item.month} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                  <span style={{ width: '36px', fontWeight: 700, color: '#475569' }}>{item.month}</span>
                  <div style={{ flex: 1, height: '22px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                    <div
                      style={{
                        width: `${totalPct - aiPct}%`,
                        background: '#93c5fd',
                        height: '100%',
                        transition: 'width 0.3s ease'
                      }}
                      title={`Organic: ₹${(item.total - item.ai).toLocaleString('en-IN')}`}
                    />
                    <div
                      style={{
                        width: `${aiPct}%`,
                        background: '#7c3aed',
                        height: '100%',
                        transition: 'width 0.3s ease'
                      }}
                      title={`AI Attributed: ₹${item.ai.toLocaleString('en-IN')}`}
                    />
                  </div>
                  <span style={{ width: '85px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                    ₹{(item.total / 1000).toFixed(0)}k
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#93c5fd', borderRadius: '3px' }} />
              <span style={{ color: '#475569' }}>Organic Revenue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#7c3aed', borderRadius: '3px' }} />
              <span style={{ color: '#475569', fontWeight: 600 }}>AI Attributed (Captured)</span>
            </div>
          </div>
        </div>

        {/* Live AI Activity Preview */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <Activity size={18} color="#059669" />
              <span>Real-time AI Activity Feed</span>
            </div>
            <button
              type="button"
              style={{ background: 'none', color: '#2563eb', fontSize: '0.8rem', fontWeight: 700 }}
              onClick={() => onNavigateTab('activity')}
            >
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activity.slice(0, 4).map((act) => {
              const timeStr = new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={act.id}
                  style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, minWidth: '42px' }}>
                    {timeStr}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                        {act.action_type.replace(/_/g, ' ')}
                      </span>
                      <span className={`badge ${act.status === 'SUCCESS' ? 'badge-paid' : act.status === 'BLOCKED' ? 'badge-blocked' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                        {act.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.2rem', lineHeight: 1.4 }}>
                      {act.reason}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
