import React from 'react';
import { Bot, ShoppingBag, Store, User, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

export default function Navbar({
  currentRole,
  onSelectRole,
  cartCount,
  onOpenCart,
  onResetDemo,
  isResetting
}) {
  return (
    <header className="app-navbar">
      {/* Brand */}
      <div className="brand-section">
        <div className="brand-logo">
          <Bot size={22} />
        </div>
        <div>
          <div className="brand-title">
            RazorGrow AI
            <span className="brand-tag">Test Mode</span>
          </div>
        </div>
      </div>

      {/* Role Switcher Pill */}
      <div className="role-switcher-container">
        <button
          type="button"
          className={`role-switcher-btn ${currentRole === 'merchant' ? 'active' : ''}`}
          onClick={() => onSelectRole('merchant')}
        >
          <Store size={15} />
          <span>Merchant Command Center</span>
        </button>

        <button
          type="button"
          className={`role-switcher-btn ${currentRole === 'customer' ? 'active' : ''}`}
          onClick={() => onSelectRole('customer')}
        >
          <User size={15} />
          <span>Customer AI Shopping</span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="nav-actions">
        {currentRole === 'merchant' ? (
          <div className="user-badge">
            <div className="user-avatar" style={{ background: '#0c2340' }}>AC</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>Acme Commerce</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Merchant Admin</div>
            </div>
          </div>
        ) : (
          <>
            <div className="user-badge">
              <div className="user-avatar">AV</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>Arjun Verma</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Verified Shopper</div>
              </div>
            </div>

            <button
              type="button"
              className="cart-button"
              onClick={onOpenCart}
              title="View Cart & AI Purchase Explanation"
            >
              <ShoppingBag size={17} />
              <span>Cart</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </>
        )}

        <button
          type="button"
          className="btn-secondary-sm"
          onClick={onResetDemo}
          disabled={isResetting}
          title="Reset database to initial demo state"
        >
          <RefreshCw size={13} className={isResetting ? 'spin' : ''} />
          <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
        </button>
      </div>
    </header>
  );
}
