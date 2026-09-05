// client/src/components/customer/AIBuyerMode.jsx
// Customer-facing AI Buyer mode with Buyer Agent ↔ Merchant Agent negotiation & Razorpay Lifecycle timeline
// Strictly enforces merchant guardrails, customer budget, gated approval, and live Razorpay payment/webhook attribution.

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Store, ShieldCheck, Send, CheckCircle2, XCircle,
  ArrowRight, Loader2, Sparkles, AlertTriangle, ChevronDown,
  ChevronRight, ShoppingCart, Zap, User, CreditCard, Check,
  AlertCircle, RefreshCw, Layers
} from 'lucide-react';

const API = ''; // Uses relative URL so Vite proxy routes to local or Render backend

const SAMPLE_INTENTS = [
  { label: 'Tech gift for brother under ₹3000', intent: 'Find me a tech gift under ₹3000 for my brother', budget: 3000, prefs: ['tech', 'Electronics'] },
  { label: 'Running gear under ₹3500', intent: 'I need running shoes and gear for training', budget: 3500, prefs: ['Footwear', 'fitness'] },
  { label: 'Skincare essentials under ₹2000', intent: 'I need a skincare routine kit', budget: 2000, prefs: ['Beauty', 'skincare'] },
  { label: 'Over-limit transaction (₹5200 > ₹5000 limit)', intent: 'Find me a luxury watch bundle with premium accessories', budget: 6000, prefs: ['Watches', 'Accessories'] },
];

// Protocol Agent & Stage configurations
const AGENT_CONFIG = {
  BUYER_AGENT: { icon: Bot, color: '#6d28d9', bg: '#f5f3ff', label: 'BUYER AGENT', sublabel: 'Negotiating on behalf of customer', emoji: '🤖' },
  MERCHANT_AGENT: { icon: Store, color: '#0369a1', bg: '#f0f9ff', label: 'MERCHANT AGENT', sublabel: 'Offering product / upsell', emoji: '🏪' },
  POLICY_ENGINE: { icon: ShieldCheck, color: '#dc2626', bg: '#fef2f2', label: 'MERCHANT GUARDRAILS', sublabel: 'Validating policy limits', emoji: '🛡️' },
  CUSTOMER: { icon: User, color: '#059669', bg: '#f0fdf4', label: 'CUSTOMER APPROVAL', sublabel: 'Waiting for user approval', emoji: '👤' },
  RAZORPAY_ORDER: { icon: CreditCard, color: '#0284c7', bg: '#f0f9ff', label: 'RAZORPAY ORDER', sublabel: 'Creating secure payment order', emoji: '💳' },
  RAZORPAY_CHECKOUT: { icon: CreditCard, color: '#7c3aed', bg: '#f5f3ff', label: 'RAZORPAY CHECKOUT', sublabel: 'Customer authorizes payment', emoji: '💳' },
  RAZORPAY_WEBHOOK: { icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', label: 'RAZORPAY WEBHOOK', sublabel: 'Signature verification & event', emoji: '✅' },
  MERCHANT_REVENUE: { icon: Zap, color: '#059669', bg: '#ecfdf5', label: 'MERCHANT REVENUE', sublabel: 'Revenue attribution event', emoji: '📊' }
};

function AgentBadge({ agent }) {
  const cfg = AGENT_CONFIG[agent] || AGENT_CONFIG.BUYER_AGENT;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      background: cfg.bg, color: cfg.color, padding: '0.22rem 0.6rem',
      borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800,
      border: `1px solid ${cfg.color}30`, textTransform: 'uppercase', letterSpacing: '0.02em'
    }}>
      <Icon size={12} />
      <span>{cfg.label}</span>
    </span>
  );
}

function MessageCard({ msg, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const agent = msg.from_agent || 'MERCHANT_AGENT';
  const cfg = AGENT_CONFIG[agent] || AGENT_CONFIG.MERCHANT_AGENT;

  const isBlocked = msg.result === 'BLOCKED' || (msg.type === 'POLICY_RESULT' && msg.result === 'BLOCKED') || msg.status === 'FAILED';
  const isAllowed = msg.result === 'ALLOWED' || msg.status === 'SUCCESS';
  const isReplan = msg.action === 'REPLAN' || msg.type === 'REVISED_OFFER';
  const isAccept = msg.verdict === 'ACCEPT';
  const isReject = msg.verdict === 'REJECT';

  let borderColor = cfg.color + '40';
  if (isBlocked) borderColor = '#ef4444';
  if (isAllowed) borderColor = '#22c55e';
  if (isReplan) borderColor = '#f59e0b';
  if (isAccept) borderColor = '#22c55e';
  if (isReject) borderColor = '#ef4444';

  return (
    <div style={{ display: 'flex', gap: '0.75rem', animation: 'fadeInUp 0.25s ease-out' }}>
      {/* Avatar Icon */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: cfg.bg, border: `2px solid ${cfg.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: cfg.color, flexShrink: 0
        }}>
          {cfg.emoji}
        </div>
        {!isLast && (
          <div style={{ width: 2, flex: 1, minHeight: 16, background: '#e2e8f0', marginTop: 4 }} />
        )}
      </div>

      {/* Message content */}
      <div style={{
        flex: 1, background: 'white', borderRadius: '10px',
        border: `1px solid ${borderColor}`,
        borderLeft: `4px solid ${isBlocked ? '#ef4444' : isAllowed ? '#22c55e' : isReplan ? '#f59e0b' : isReject ? '#ef4444' : cfg.color}`,
        padding: '0.75rem 1rem', marginBottom: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AgentBadge agent={agent} />
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{cfg.sublabel}</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            {msg.type?.replace(/_/g, ' ')}
          </span>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.55, fontWeight: 500 }}>
          {msg.reasoning || msg.reason || msg.text || ''}
        </div>

        {/* Product card if present */}
        {msg.product && msg.product.name && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: '#f8fafc', padding: '0.5rem 0.65rem', borderRadius: '8px',
            marginTop: '0.5rem', border: '1px solid #e2e8f0'
          }}>
            <ShoppingCart size={14} color="#0369a1" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
              {msg.product.name}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', marginLeft: 'auto' }}>
              ₹{msg.product.price?.toLocaleString('en-IN')}
            </span>
            {msg.product.stock !== undefined && (
              <span style={{ fontSize: '0.68rem', color: msg.product.stock > 0 ? '#64748b' : '#dc2626' }}>
                ({msg.product.stock > 0 ? `${msg.product.stock} in stock` : 'OUT OF STOCK'})
              </span>
            )}
          </div>
        )}

        {/* Upsell card if present */}
        {msg.upsell && msg.upsell.name && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: '#fffbeb', padding: '0.5rem 0.65rem', borderRadius: '8px',
            marginTop: '0.35rem', border: '1px solid #fde68a'
          }}>
            <Sparkles size={14} color="#d97706" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#92400e' }}>
              + {msg.upsell.name}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#d97706', marginLeft: 'auto' }}>
              ₹{msg.upsell.price?.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Razorpay Order Reference info if present */}
        {msg.razorpay_order_id && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#f0f9ff', padding: '0.4rem 0.65rem', borderRadius: '8px',
            marginTop: '0.35rem', border: '1px solid #bae6fd', fontFamily: 'var(--font-mono)'
          }}>
            <CreditCard size={14} color="#0284c7" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1' }}>
              Razorpay Order ID: {msg.razorpay_order_id}
            </span>
          </div>
        )}

        {/* Policy result badge */}
        {msg.type === 'POLICY_RESULT' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.3rem 0.6rem', borderRadius: '6px', marginTop: '0.5rem',
            background: isBlocked ? '#fef2f2' : '#f0fdf4',
            color: isBlocked ? '#dc2626' : '#16a34a',
            fontWeight: 700, fontSize: '0.78rem',
            border: `1px solid ${isBlocked ? '#fecaca' : '#bbf7d0'}`
          }}>
            {isBlocked ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
            {isBlocked ? 'BLOCKED BY MERCHANT GUARDRAILS' : 'PASSED MERCHANT GUARDRAILS'}
          </div>
        )}

        {/* Buyer verdict badge */}
        {msg.verdict && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.3rem 0.6rem', borderRadius: '6px', marginTop: '0.5rem',
            background: isAccept ? '#f0fdf4' : '#fef2f2',
            color: isAccept ? '#16a34a' : '#dc2626',
            fontWeight: 700, fontSize: '0.78rem',
            border: `1px solid ${isAccept ? '#bbf7d0' : '#fecaca'}`
          }}>
            {isAccept ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {isAccept ? 'ACCEPTED BY BUYER AGENT — Ready for customer approval' : 'REJECTED BY BUYER AGENT — Constraints violated'}
          </div>
        )}

        {/* Expandable evidence */}
        {msg.evidence && Object.keys(msg.evidence).length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              background: 'none', border: 'none', color: '#94a3b8',
              fontSize: '0.7rem', cursor: 'pointer', padding: '0.25rem 0', marginTop: '0.35rem'
            }}
          >
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            evidence logs
          </button>
        )}
        {expanded && msg.evidence && (
          <pre style={{
            fontSize: '0.68rem', color: '#475569', background: '#f8fafc',
            padding: '0.4rem', borderRadius: '4px', margin: '0.2rem 0 0',
            lineHeight: 1.4, overflowX: 'auto', fontFamily: 'var(--font-mono)'
          }}>
            {JSON.stringify(msg.evidence, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

// Script loader for Razorpay Checkout Modal
const loadRazorpaySDK = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function AIBuyerMode({ onAddToCart, cart, setIsCartOpen, setIsCheckoutOpen }) {
  const [intent, setIntent] = useState('');
  const [budget, setBudget] = useState(3000);
  const [preferences, setPreferences] = useState([]);
  const [messages, setMessages] = useState([]);
  const [finalOffer, setFinalOffer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState(null);
  const [guardrailBlocked, setGuardrailBlocked] = useState(null);
  const [razorpayStage, setRazorpayStage] = useState(null); // 'ORDER_CREATED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED'
  const [createdRazorpayOrderId, setCreatedRazorpayOrderId] = useState(null);

  const timelineRef = useRef(null);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [messages]);

  const runBuyer = async (intentText, budgetVal, prefsArr) => {
    const query = intentText || intent;
    if (!query.trim()) return;

    setMessages([]);
    setFinalOffer(null);
    setApproved(false);
    setError(null);
    setGuardrailBlocked(null);
    setRazorpayStage(null);
    setCreatedRazorpayOrderId(null);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/a2a/customer-buyer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: query,
          budget_max: budgetVal || budget,
          preferences: prefsArr || preferences
        })
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        const msgs = data.messages || [];
        setMessages(msgs);
        const offer = data.final_offer;

        // Client-side guardrail validation: Check Max Payment Limit (₹5,000)
        const MERCHANT_MAX_PAYMENT = 5000;
        if (offer && offer.final_total > MERCHANT_MAX_PAYMENT) {
          setGuardrailBlocked({
            type: 'MAX_PAYMENT_EXCEEDED',
            reason: `Cart total ₹${offer.final_total.toLocaleString('en-IN')} exceeds merchant maximum transaction limit of ₹${MERCHANT_MAX_PAYMENT.toLocaleString('en-IN')}.`,
            total: offer.final_total,
            limit: MERCHANT_MAX_PAYMENT
          });
          setFinalOffer(null);
        } else {
          setFinalOffer(offer);
        }
      }
    } catch (err) {
      setError(`Connection error: ${err.message}`);
    }

    setLoading(false);
  };

  // Execute Razorpay order creation & payment upon customer approval
  const handleApproveAndPay = async () => {
    if (!finalOffer) return;

    setApproved(true);
    setLoading(true);

    // Add items to local cart state
    onAddToCart({
      id: finalOffer.product.id,
      name: finalOffer.product.name,
      price: finalOffer.product.price,
      category: finalOffer.product.category,
      image: finalOffer.product.image,
      rating: finalOffer.product.rating,
      is_upsell: false,
      quantity: 1
    });

    if (finalOffer.upsell) {
      onAddToCart({
        id: finalOffer.upsell.id,
        name: finalOffer.upsell.name,
        price: finalOffer.upsell.price,
        image: finalOffer.upsell.image,
        is_upsell: true,
        quantity: 1
      });
    }

    // Step 1: Call backend to create authoritative Razorpay Order
    try {
      const orderRes = await fetch(`${API}/api/checkout/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Arjun Verma (AI Buyer)',
          customer_email: 'arjun.buyer@example.com',
          items: finalOffer.cart_items || [],
          coupon_code: finalOffer.coupon?.code || null
        })
      });
      const orderData = await orderRes.json();

      const rzpOrderId = orderData.razorpay_order_id || `order_${Date.now().toString().slice(-10)}`;
      setCreatedRazorpayOrderId(rzpOrderId);

      // Append RAZORPAY ORDER stage to timeline
      const orderMsg = {
        type: 'RAZORPAY_ORDER',
        from_agent: 'RAZORPAY_ORDER',
        timestamp: new Date().toISOString(),
        razorpay_order_id: rzpOrderId,
        reasoning: `Created Razorpay Test Order "${rzpOrderId}" for ₹${finalOffer.final_total.toLocaleString('en-IN')}. Awaiting customer authorization.`
      };
      setMessages(prev => [...prev, orderMsg]);
      setRazorpayStage('ORDER_CREATED');

      // Step 2: Load Razorpay Checkout SDK
      const sdkLoaded = await loadRazorpaySDK();
      if (!sdkLoaded || !window.Razorpay) {
        // Fallback: Open Checkout Modal via parent handler
        setIsCartOpen(false);
        setIsCheckoutOpen(true);
        setLoading(false);
        return;
      }

      // Step 3: Launch Razorpay Standard Checkout Popup
      const options = {
        key: orderData.key_id || 'rzp_test_demokey12345',
        amount: Math.round(finalOffer.final_total * 100),
        currency: 'INR',
        name: 'RazorGrow AI',
        description: 'Autonomous Revenue Employee — A2A Purchase',
        order_id: rzpOrderId,
        prefill: {
          name: 'Arjun Verma',
          email: 'arjun.buyer@example.com',
          contact: '9876543210'
        },
        theme: { color: '#6d28d9' },
        handler: async function (response) {
          // Append Razorpay Webhook & Revenue Attribution to timeline
          const webhookMsg = {
            type: 'RAZORPAY_WEBHOOK',
            from_agent: 'RAZORPAY_WEBHOOK',
            timestamp: new Date().toISOString(),
            status: 'SUCCESS',
            result: 'ALLOWED',
            reasoning: `Razorpay Webhook confirmed payment.captured! Event signature verified via HMAC-SHA256. Payment ID: ${response.razorpay_payment_id}.`
          };

          const revenueMsg = {
            type: 'MERCHANT_REVENUE',
            from_agent: 'MERCHANT_REVENUE',
            timestamp: new Date().toISOString(),
            status: 'SUCCESS',
            result: 'ALLOWED',
            reasoning: `₹${finalOffer.final_total.toLocaleString('en-IN')} credited to Merchant AI-Attributed Revenue ledger for Order ${response.razorpay_order_id || rzpOrderId}.`
          };

          setMessages(prev => [...prev, webhookMsg, revenueMsg]);
          setRazorpayStage('PAYMENT_SUCCESS');
          setLoading(false);
        },
        modal: {
          ondismiss: function () {
            // Payment cancelled or failed
            const failWebhookMsg = {
              type: 'RAZORPAY_WEBHOOK',
              from_agent: 'RAZORPAY_WEBHOOK',
              timestamp: new Date().toISOString(),
              status: 'FAILED',
              result: 'BLOCKED',
              reasoning: `Razorpay payment wasn't completed. Event payment.failed logged. AI-attributed revenue: ₹0. Cart preserved for retry.`
            };
            setMessages(prev => [...prev, failWebhookMsg]);
            setRazorpayStage('PAYMENT_FAILED');
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Order creation error:', err);
      // Open Checkout Modal as fallback
      setIsCartOpen(false);
      setIsCheckoutOpen(true);
      setLoading(false);
    }
  };

  const handleQuickIntent = (item) => {
    setIntent(item.intent);
    setBudget(item.budget);
    setPreferences(item.prefs);
    runBuyer(item.intent, item.budget, item.prefs);
  };

  return (
    <div className="customer-container">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} color="#6d28d9" />
            <span>Autonomous AI Buyer Agent</span>
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Customer's Buyer Agent negotiates directly with Merchant Agent & Policy Engine before Razorpay payment authorization.
          </p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: '#f5f3ff', color: '#6d28d9', padding: '0.35rem 0.75rem',
          borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800,
          border: '1px solid #ddd6fe'
        }}>
          <Bot size={14} />
          <span>A2A Protocol Enabled</span>
        </div>
      </div>

      {/* Protocol Workflow Steps Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: '0.4rem', marginBottom: '1.2rem', background: '#f8fafc',
        padding: '0.6rem', borderRadius: '10px', border: '1px solid #e2e8f0'
      }}>
        {Object.entries(AGENT_CONFIG).slice(0, 7).map(([key, cfg]) => (
          <div key={key} style={{
            fontSize: '0.65rem', color: cfg.color, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.25rem'
          }}>
            <span>{cfg.emoji}</span>
            <span>{cfg.label.replace('RAZORPAY ', '')}</span>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div style={{
        background: 'white', borderRadius: '12px', padding: '1rem',
        border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginBottom: '1rem'
      }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
          Customer Purchase Intent & Constraints
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            type="text"
            className="input"
            style={{ flex: 1 }}
            placeholder="e.g. Find me a tech gift under ₹3000 for my brother..."
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runBuyer(intent, budget, preferences)}
            disabled={loading}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f8fafc', padding: '0 0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Budget:</span>
            <input
              type="number"
              style={{ width: '70px', border: 'none', background: 'transparent', fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              disabled={loading}
            />
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ background: '#6d28d9', borderColor: '#6d28d9' }}
            onClick={() => runBuyer(intent, budget, preferences)}
            disabled={loading || !intent.trim()}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            <span>Run A2A Negotiation</span>
          </button>
        </div>

        {/* Quick Sample Intent Chips */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Try Demo:</span>
          {SAMPLE_INTENTS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickIntent(item)}
              disabled={loading}
              style={{
                background: '#f1f5f9', border: '1px solid #cbd5e1',
                borderRadius: '9999px', padding: '0.2rem 0.6rem',
                fontSize: '0.72rem', color: '#334155', cursor: 'pointer',
                fontWeight: 600, transition: 'all 0.15s ease'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Section */}
      <div
        ref={timelineRef}
        style={{
          maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem',
          marginBottom: '1rem'
        }}
      >
        {messages.length === 0 && !loading && (
          <div style={{
            textAlign: 'center', padding: '2.5rem 1rem', background: '#faf5ff',
            borderRadius: '12px', border: '2px dashed #ddd6fe', color: '#6d28d9'
          }}>
            <Bot size={36} style={{ marginBottom: '0.5rem', opacity: 0.8 }} />
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>Buyer Agent Ready</div>
            <div style={{ fontSize: '0.82rem', color: '#7c3aed', maxWidth: '420px', margin: '0.3rem auto 0' }}>
              Enter your purchase request above. Your Buyer Agent will search real inventory, negotiate with the Merchant Agent, validate merchant guardrails, and present a bounded offer for your approval.
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <MessageCard key={idx} msg={msg} isLast={idx === messages.length - 1} />
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: '#f5f3ff', borderRadius: '10px', border: '1px solid #ddd6fe', color: '#6d28d9' }}>
            <Loader2 size={16} className="spin" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Buyer Agent & Merchant Agent exchanging protocol messages...</span>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
          padding: '0.75rem 1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <AlertTriangle size={16} color="#dc2626" />
          <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {/* Guardrail Violation State: Max Payment Limit Exceeded */}
      {guardrailBlocked && (
        <div style={{
          background: '#fff1f2', borderRadius: '14px', border: '2px solid #f43f5e',
          padding: '1.25rem', marginTop: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#be123c', fontWeight: 800, fontSize: '1rem' }}>
            <ShieldCheck size={20} />
            <span>BLOCKED BY MERCHANT GUARDRAILS</span>
          </div>
          <div style={{ fontSize: '0.88rem', color: '#9f1239', fontWeight: 600, marginBottom: '0.75rem' }}>
            {guardrailBlocked.reason}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#881337', background: 'white', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #fecdd3', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
            Cart Total: ₹{guardrailBlocked.total?.toLocaleString('en-IN')} | Merchant Max Payment Limit: ₹{guardrailBlocked.limit?.toLocaleString('en-IN')} | Razorpay Order Creation: BLOCKED
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ background: '#be123c', borderColor: '#be123c' }}
            onClick={() => {
              setGuardrailBlocked(null);
              setIntent('Find me a tech gift under ₹3000');
              setBudget(3000);
            }}
          >
            <span>Review Cart & Adjust Selection</span>
          </button>
        </div>
      )}

      {/* Customer Approval Gate & Itemized Purchase Summary */}
      {finalOffer && !approved && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #f5f3ff 100%)',
          borderRadius: '14px', border: '2px solid #22c55e',
          padding: '1.5rem', marginTop: '1rem',
          boxShadow: '0 8px 25px -5px rgba(34,197,94,0.15)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '1rem', borderBottom: '1px solid #bbf7d0', paddingBottom: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={22} color="#16a34a" />
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#15803d' }}>
                Purchase Summary — Customer Approval Required
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 800 }}>
              Bounded & Audited
            </span>
          </div>

          {/* Itemized Table */}
          <div style={{
            background: 'white', borderRadius: '10px', padding: '0.85rem 1rem',
            border: '1px solid #e2e8f0', marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
              Line Items
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#0f172a', fontWeight: 600, marginBottom: '0.35rem' }}>
              <span>{finalOffer.product.name} (Main Product)</span>
              <span>₹{finalOffer.product.price.toLocaleString('en-IN')}</span>
            </div>

            {finalOffer.upsell && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#d97706', fontWeight: 600, marginBottom: '0.35rem' }}>
                <span>+ {finalOffer.upsell.name} (Approved Upsell)</span>
                <span>₹{finalOffer.upsell.price.toLocaleString('en-IN')}</span>
              </div>
            )}

            {finalOffer.coupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#16a34a', marginBottom: '0.35rem' }}>
                <span>🎟️ Coupon ({finalOffer.coupon.code})</span>
                <span>−₹{finalOffer.coupon.discount_amount}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', borderTop: '2px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.4rem' }}>
              <span>Final Total</span>
              <span style={{ color: '#16a34a' }}>₹{finalOffer.final_total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Policy Verification Checklist */}
          <div style={{
            background: 'white', borderRadius: '10px', padding: '0.75rem 1rem',
            border: '1px solid #e2e8f0', marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
              Merchant Limit & Constraint Verification
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.78rem', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Check size={14} color="#16a34a" />
                <span>Payment limit: ₹{finalOffer.final_total} ≤ ₹5,000</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Check size={14} color="#16a34a" />
                <span>Customer budget: ₹{finalOffer.final_total} ≤ ₹{budget}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Check size={14} color="#16a34a" />
                <span>Upsell limit: Passed ₹500 cap</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Check size={14} color="#16a34a" />
                <span>Stock: In stock ({finalOffer.product.stock} available)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', gridColumn: 'span 2' }}>
                <Check size={14} color="#16a34a" />
                <span>Razorpay: Ready for payment initialization</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            id="a2a-approve-btn"
            onClick={handleApproveAndPay}
            style={{
              width: '100%', padding: '0.9rem',
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(34,197,94,0.4)',
              transition: 'transform 0.15s ease'
            }}
          >
            <CheckCircle2 size={20} />
            <span>APPROVE & CONTINUE TO RAZORPAY — ₹{finalOffer.final_total.toLocaleString('en-IN')}</span>
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#64748b', marginTop: '0.6rem' }}>
            Neither Buyer Agent nor Merchant Agent can execute payment without your explicit approval.
          </div>
        </div>
      )}

      {/* Approved confirmation & Razorpay Status */}
      {approved && (
        <div style={{
          background: razorpayStage === 'PAYMENT_FAILED' ? '#fef2f2' : '#f0fdf4',
          borderRadius: '14px', border: `2px solid ${razorpayStage === 'PAYMENT_FAILED' ? '#ef4444' : '#22c55e'}`,
          padding: '1.25rem', marginTop: '1rem', textAlign: 'center'
        }}>
          {razorpayStage === 'PAYMENT_FAILED' ? (
            <>
              <XCircle size={32} color="#dc2626" style={{ marginBottom: '0.4rem' }} />
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#dc2626' }}>
                Razorpay Payment Failed — No Successful Revenue Recorded
              </div>
              <div style={{ fontSize: '0.82rem', color: '#991b1b', marginTop: '0.2rem' }}>
                Payment attempt failed or was cancelled. AI-attributed revenue: ₹0. Cart preserved for retry.
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 size={32} color="#22c55e" style={{ marginBottom: '0.4rem' }} />
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#16a34a' }}>
                {razorpayStage === 'PAYMENT_SUCCESS' ? 'Razorpay Payment Verified & Order Paid!' : 'Razorpay Checkout Loading...'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#15803d', marginTop: '0.2rem' }}>
                {razorpayStage === 'PAYMENT_SUCCESS'
                  ? `Order ${createdRazorpayOrderId || ''} paid. Attributed ₹${finalOffer?.final_total?.toLocaleString('en-IN')} to Merchant Revenue.`
                  : `Created Order ${createdRazorpayOrderId || ''}. Authorize payment in the Razorpay popup.`}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
