import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  ShoppingBag,
  Bot,
  User,
  ArrowRight,
  CheckCircle2,
  X,
  Package,
  Layers,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

import CatalogView from './CatalogView';
import CustomerOrdersView from './CustomerOrdersView';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import ReplanningModal from './ReplanningModal';

export default function CustomerAssistant({
  products = [],
  orders = [],
  cart,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onSwitchToMerchantAudit,
  isCartOpen,
  setIsCartOpen
}) {
  const [activeTab, setActiveTab] = useState('chat'); // chat, catalog, orders
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Hello Arjun! I am your AI Shopping Assistant for Acme Commerce. I can help find the perfect products from our verified catalog, search available inventory, and help you check out with Razorpay Test Mode.',
      recommendations: [],
      upsell_proposal: null
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeUpsell, setActiveUpsell] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReplanningOpen, setIsReplanningOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeUpsell]);

  // Handle user sending chat query
  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || isSending) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          history: messages.map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      const data = await res.json();

      const assistantMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: data.reply || "I found products that match your request:",
        recommendations: data.recommendations || []
      };

      setMessages(prev => [...prev, assistantMsg]);

      // If there's an immediate recommendation with a high-affinity upsell, set candidate
      if (data.recommendations && data.recommendations.length > 0) {
        const topProduct = data.recommendations[0];
        // Automatically check upsell for top product
        triggerUpsellCheck(topProduct);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: "I experienced an error analyzing catalog inventory. Please try again."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Evaluate and propose bounded upsell
  const triggerUpsellCheck = async (product) => {
    try {
      const res = await fetch(`/api/upsell/propose/${product.id}`);
      const data = await res.json();
      if (data.success && data.upsell_product) {
        setActiveUpsell({
          primaryProduct: product,
          upsellProduct: data.upsell_product,
          reason: data.reason,
          opportunity: data.opportunity
        });
      }
    } catch (err) {
      console.error('Failed to check upsell', err);
    }
  };

  // User selects product directly
  const handleSelectProduct = (product) => {
    onAddToCart(product);
    triggerUpsellCheck(product);
    setActiveTab('chat');
  };

  // User accepts upsell
  const handleApproveUpsell = async (upsellItem) => {
    const itemToAdd = upsellItem || activeUpsell?.upsellProduct;
    if (!itemToAdd) return;

    try {
      // Record authorization on backend audit ledger
      await fetch('/api/upsell/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upsell_product_id: itemToAdd.id,
          customer_name: 'Arjun Verma'
        })
      });

      onAddToCart({ ...itemToAdd, is_upsell: true });
      setActiveUpsell(null);
      setIsCartOpen(true);
    } catch (err) {
      console.error('Failed to approve upsell', err);
      onAddToCart({ ...itemToAdd, is_upsell: true });
      setActiveUpsell(null);
      setIsCartOpen(true);
    }
  };

  // User declines upsell
  const handleDeclineUpsell = () => {
    setActiveUpsell(null);
    setIsCartOpen(true);
  };

  const quickPrompts = [
    "I need a birthday gift for my brother under ₹3000.",
    "Looking for running shoes",
    "Find me a good laptop",
    "Skincare kit for daily routine"
  ];

  return (
    <div className="app-shell">
      {/* Sidebar for Customer Experience */}
      <aside className="app-sidebar" style={{ width: '220px' }}>
        <div className="sidebar-header">
          <div className="sidebar-label">AI Concierge</div>
          <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem' }}>
            Shopping Portal
          </div>
        </div>

        <nav className="sidebar-menu">
          <button
            type="button"
            className={`sidebar-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <Bot size={18} />
            <span>AI Shopping</span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <ShoppingBag size={18} />
            <span>Products</span>
          </button>

          <button
            type="button"
            className="sidebar-item"
            onClick={() => setIsCartOpen(true)}
          >
            <Package size={18} />
            <span style={{ flex: 1 }}>Cart</span>
            {cart.items.length > 0 && (
              <span style={{
                background: '#0284c7',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px'
              }}>
                {cart.items.length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`sidebar-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <CheckCircle2 size={18} />
            <span>Orders</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator">
            <span className="status-dot" />
            <span>Razorpay Sandbox</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-content" style={{ padding: '1.5rem 2rem' }}>
        {activeTab === 'chat' && (
          <div className="customer-container">
            {/* Top Agent Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} color="#2563eb" />
                  <span>Customer AI Shopping Assistant</span>
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  AI recommendations with policy constraints, deterministic coupon discounts, and customer authorization.
                </p>
              </div>

              {/* Replanning Demo Trigger Button */}
              <button
                type="button"
                className="btn-outline"
                style={{
                  background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)',
                  borderColor: '#c7d2fe',
                  color: '#4338ca',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                onClick={() => setIsReplanningOpen(true)}
              >
                <ShieldCheck size={16} color="#4f46e5" />
                <span>Agentic Re-planning Demo</span>
              </button>
            </div>

            {/* Chat Box Card */}
            <div className="chat-card">
              <div className="chat-header">
                <div className="chat-header-title">
                  <Bot size={20} />
                  <span>RazorGrow AI Shopping Concierge</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                  <span>Gemini Model Active</span>
                </div>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="chat-messages">
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className={`chat-bubble ${msg.sender}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 700, opacity: 0.8 }}>
                        {msg.sender === 'assistant' ? <Bot size={13} /> : <User size={13} />}
                        <span>{msg.sender === 'assistant' ? 'RazorGrow Assistant' : 'You'}</span>
                      </div>
                      <div style={{ lineHeight: 1.5 }}>{msg.text}</div>
                    </div>

                    {/* Recommendations rendered directly under assistant message */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="rec-cards-grid">
                        {msg.recommendations.map(product => (
                          <div key={product.id} className="rec-card">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="rec-card-img"
                            />
                            <div className="rec-card-body">
                              <div>
                                <div className="rec-title">{product.name}</div>
                                <div className="rec-price">₹{product.price.toLocaleString('en-IN')}</div>
                                {product.reason && (
                                  <div className="rec-reason">
                                    {product.reason}
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center', padding: '0.55rem', fontSize: '0.825rem', marginTop: '0.75rem' }}
                                onClick={() => {
                                  onAddToCart(product);
                                  triggerUpsellCheck(product);
                                }}
                              >
                                <span>Select Product</span>
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Bounded Upsell Proposal Alert Box (Section 10 Golden Path) */}
                {activeUpsell && (
                  <div className="upsell-alert-box">
                    <div className="upsell-header-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sparkles size={18} color="#166534" />
                        <span className="upsell-title">
                          Bounded Complementary Upsell Proposal
                        </span>
                      </div>
                      <span className="badge badge-paid" style={{ fontSize: '0.7rem' }}>
                        Policy Checked (&le; ₹500)
                      </span>
                    </div>

                    <div className="upsell-body-row">
                      <img
                        src={activeUpsell.upsellProduct.image}
                        alt={activeUpsell.upsellProduct.name}
                        className="upsell-img"
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                          Add {activeUpsell.upsellProduct.name} for only ₹{activeUpsell.upsellProduct.price}?
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#166534', marginTop: '0.2rem', lineHeight: 1.4 }}>
                          {activeUpsell.reason || "42% of customers purchasing this item add gift packaging."}
                        </div>
                      </div>
                    </div>

                    <div className="upsell-actions-row">
                      <button
                        type="button"
                        className="btn-success"
                        style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}
                        onClick={() => handleApproveUpsell()}
                      >
                        <CheckCircle2 size={16} />
                        <span>Yes, add it (+₹{activeUpsell.upsellProduct.price})</span>
                      </button>

                      <button
                        type="button"
                        className="btn-outline"
                        style={{ padding: '0.6rem 1rem', fontSize: '0.875rem', background: '#ffffff' }}
                        onClick={handleDeclineUpsell}
                      >
                        No thanks
                      </button>
                    </div>
                  </div>
                )}

                {isSending && (
                  <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                    <Sparkles size={16} className="spin" color="#2563eb" />
                    <span>Analyzing catalog and verifying merchant policies...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Starter Quick Prompts */}
              <div className="quick-prompts">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="prompt-chip"
                    onClick={() => handleSendMessage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Input Row */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="chat-input-row"
              >
                <input
                  type="text"
                  placeholder="Ask for recommendations, e.g., 'I need a birthday gift for my brother under ₹3000'..."
                  className="chat-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isSending}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSending || !inputText.trim()}
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
          <CatalogView
            products={products}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {activeTab === 'orders' && (
          <CustomerOrdersView orders={orders} />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={onRemoveFromCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Razorpay Test Mode Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onPaymentSuccess={() => {
          onClearCart();
        }}
        onSwitchToMerchantAudit={() => {
          onClearCart();
          onSwitchToMerchantAudit();
        }}
      />

      {/* Agentic Re-planning Demo Modal */}
      <ReplanningModal
        isOpen={isReplanningOpen}
        onClose={() => setIsReplanningOpen(false)}
        onApproveUpsell={handleApproveUpsell}
      />
    </div>
  );
}
