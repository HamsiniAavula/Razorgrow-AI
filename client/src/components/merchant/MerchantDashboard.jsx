import React, { useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Activity,
  ShoppingBag,
  CreditCard,
  BarChart3,
  Tag,
  ShieldCheck,
  FileText,
  Bot
} from 'lucide-react';

import OverviewTab from './OverviewTab';
import OpportunitiesTab from './OpportunitiesTab';
import ActivityTab from './ActivityTab';
import OrdersTab from './OrdersTab';
import PaymentMonitorTab from './PaymentMonitorTab';
import AnalyticsTab from './AnalyticsTab';
import CouponsTab from './CouponsTab';
import PoliciesTab from './PoliciesTab';
import AuditLedgerTab from './AuditLedgerTab';
import A2ASessionsTab from './A2ASessionsTab';

export default function MerchantDashboard({
  stats,
  opportunities,
  activity,
  orders,
  payments,
  coupons,
  policies,
  auditLedger,
  onActivateOpportunity,
  onUpdatePolicies,
  isActivating,
  isUpdating,
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'a2a', label: 'AI Buyers', icon: <Bot size={18} />, badge: 0, highlight: true },
    { id: 'opportunities', label: 'Revenue Opportunities', icon: <Sparkles size={18} />, badge: opportunities.filter(o => o.status !== 'ACTIVE').length },
    { id: 'activity', label: 'AI Activity', icon: <Activity size={18} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
    { id: 'coupons', label: 'Coupons', icon: <Tag size={18} /> },
    { id: 'policies', label: 'AI Policies', icon: <ShieldCheck size={18} /> },
    { id: 'audit', label: 'Audit Logs', icon: <FileText size={18} /> }
  ];

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-label">Merchant Command Center</div>
          <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem' }}>
            Acme Commerce
          </div>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              style={item.highlight && activeTab !== item.id ? { borderLeft: '3px solid #7c3aed', paddingLeft: 'calc(0.75rem - 3px)' } : {}}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{
                  background: '#0284c7',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px'
                }}>
                  {item.badge}
                </span>
              )}
              {item.highlight && (
                <span style={{ fontSize: '0.6rem', background: '#7c3aed', color: 'white', padding: '0.05rem 0.3rem', borderRadius: '4px', fontWeight: 700 }}>NEW</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator">
            <span className="status-dot" />
            <span>AI Guardrails Active</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>v1.0.0</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-content">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            activity={activity}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'a2a' && <A2ASessionsTab onRefresh={onRefresh} />}

        {activeTab === 'opportunities' && (
          <OpportunitiesTab
            opportunities={opportunities}
            onActivateOpportunity={onActivateOpportunity}
            isActivating={isActivating}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityTab activities={activity} />
        )}

        {activeTab === 'orders' && (
          <OrdersTab orders={orders} />
        )}

        {activeTab === 'payments' && (
          <PaymentMonitorTab payments={payments} orders={orders} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab stats={stats} />
        )}

        {activeTab === 'coupons' && (
          <CouponsTab coupons={coupons} policy={policies} />
        )}

        {activeTab === 'policies' && (
          <PoliciesTab
            policies={policies}
            onUpdatePolicies={onUpdatePolicies}
            isUpdating={isUpdating}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLedgerTab auditLedger={auditLedger} />
        )}
      </main>
    </div>
  );
}
