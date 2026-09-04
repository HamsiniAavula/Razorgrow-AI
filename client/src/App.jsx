import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/common/Navbar';
import MerchantDashboard from './components/merchant/MerchantDashboard';
import CustomerAssistant from './components/customer/CustomerAssistant';

export default function App() {
  const [currentRole, setCurrentRole] = useState('merchant'); // 'merchant' | 'customer'
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isUpdatingPolicies, setIsUpdatingPolicies] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Application Data States
  const [stats, setStats] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [activity, setActivity] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [policies, setPolicies] = useState(null);
  const [auditLedger, setAuditLedger] = useState([]);
  const [products, setProducts] = useState([]);

  // Customer Cart State
  const [cartItems, setCartItems] = useState([
    {
      id: 'prod_watch_01',
      name: 'Classic Watch',
      price: 2499,
      category: 'Watches',
      is_upsell: false,
      quantity: 1
    }
  ]);
  const [cartCalculation, setCartCalculation] = useState({
    subtotal: 2499,
    discount: 0,
    total: 2499,
    coupon: null,
    coupon_evaluation: [],
    policy_checks: []
  });

  // Fetch all live backend state
  const fetchData = useCallback(async () => {
    try {
      const [
        statsRes,
        oppsRes,
        actRes,
        ordersRes,
        paymentsRes,
        couponsRes,
        policiesRes,
        auditRes,
        productsRes
      ] = await Promise.all([
        fetch('/api/merchant/overview').then(r => r.json()),
        fetch('/api/merchant/opportunities').then(r => r.json()),
        fetch('/api/merchant/activity').then(r => r.json()),
        fetch('/api/merchant/orders').then(r => r.json()),
        fetch('/api/merchant/payments').then(r => r.json()),
        fetch('/api/merchant/coupons').then(r => r.json()),
        fetch('/api/merchant/policies').then(r => r.json()),
        fetch('/api/merchant/audit-ledger').then(r => r.json()),
        fetch('/api/products').then(r => r.json())
      ]);

      setStats(statsRes);
      setOpportunities(oppsRes);
      setActivity(actRes);
      setOrders(ordersRes);
      setPayments(paymentsRes);
      setCoupons(couponsRes);
      setPolicies(policiesRes);
      setAuditLedger(auditRes);
      setProducts(productsRes);
    } catch (err) {
      console.error('Error fetching backend data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recalculate cart deterministically on the server whenever items change
  const recalculateCart = useCallback(async (items) => {
    if (!items || items.length === 0) {
      setCartCalculation({
        subtotal: 0,
        discount: 0,
        total: 0,
        coupon: null,
        coupon_evaluation: [],
        policy_checks: []
      });
      return;
    }

    try {
      const res = await fetch('/api/cart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      const data = await res.json();
      setCartCalculation(data);
    } catch (err) {
      console.error('Error calculating cart', err);
    }
  }, []);

  // Recalculate whenever cart items array changes
  useEffect(() => {
    recalculateCart(cartItems);
  }, [cartItems, recalculateCart]);

  const handleAddToCart = (item) => {
    setCartItems(prev => {
      // Avoid duplicate upsell
      if (item.is_upsell && prev.some(i => i.is_upsell)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setCartItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    fetchData();
  };

  // Opportunity Activation
  const handleActivateOpportunity = async (oppId) => {
    setIsActivating(true);
    try {
      const res = await fetch(`/api/merchant/opportunities/${oppId}/activate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to activate opportunity', err);
    } finally {
      setIsActivating(false);
    }
  };

  // Policy Updates
  const handleUpdatePolicies = async (updated) => {
    setIsUpdatingPolicies(true);
    try {
      const res = await fetch('/api/merchant/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to update policies', err);
    } finally {
      setIsUpdatingPolicies(false);
    }
  };

  // Reset Demo
  const handleResetDemo = async () => {
    if (!window.confirm('Reset RazorGrow AI database to clean initial demonstration state?')) {
      return;
    }
    setIsResetting(true);
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
      setCartItems([]);
      recalculateCart([]);
      await fetchData();
    } catch (err) {
      console.error('Failed to reset demo', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSwitchToMerchantAudit = () => {
    setCurrentRole('merchant');
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f8fafc',
        gap: '1rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '4px solid #e2e8f0',
          borderTopColor: '#0284c7',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ fontWeight: 800, color: '#0c2340', fontSize: '1.1rem' }}>
          Loading RazorGrow AI...
        </div>
      </div>
    );
  }

  const combinedCart = {
    ...cartCalculation,
    items: (cartItems && cartItems.length > 0) ? cartItems : (cartCalculation?.items || [])
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navbar with Role Switcher */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Main Experience View */}
      {currentRole === 'merchant' ? (
        <MerchantDashboard
          stats={stats}
          opportunities={opportunities}
          activity={activity}
          orders={orders}
          payments={payments}
          coupons={coupons}
          policies={policies}
          auditLedger={auditLedger}
          onActivateOpportunity={handleActivateOpportunity}
          onUpdatePolicies={handleUpdatePolicies}
          isActivating={isActivating}
          isUpdating={isUpdatingPolicies}
        />
      ) : (
        <CustomerAssistant
          products={products}
          orders={orders}
          cart={combinedCart}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onSwitchToMerchantAudit={handleSwitchToMerchantAudit}
          isCartOpen={isCartOpen}
          setIsCartOpen={setIsCartOpen}
        />
      )}
    </div>
  );
}
