// client/src/components/customer/AIBuyerMode.jsx
// Customer-facing AI Buyer mode with Buyer Agent ↔ Merchant Agent timeline
// Shows structured message exchange, policy blocks, replanning, and customer approval gate

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Store, ShieldCheck, Send, CheckCircle2, XCircle,
  ArrowRight, Loader2, Sparkles, AlertTriangle, ChevronDown,
  ChevronRight, ShoppingCart, Zap, User
} from 'lucide-react';

const API = 'http://localhost:5000';

const SAMPLE_INTENTS = [
  { label: 'Tech gift for brother under ₹3000', intent: 'Find me a tech gift under ₹3000 for my brother', budget: 3000, prefs: ['tech', 'Electronics'] },
  { label: 'Running gear under ₹3500', intent: 'I need running shoes and gear for training', budget: 3500, prefs: ['Footwear', 'fitness'] },
  { label: 'Skincare essentials under ₹2000', intent: 'I need a skincare routine kit', budget: 2000, prefs: ['Beauty', 'skincare'] },
  { label: 'Premium accessories under ₹5000', intent: 'I want premium accessories — watches or leather goods', budget: 5000, prefs: ['Watches', 'Accessories'] },
];

// Agent icons and colors
const AGENT_CONFIG = {
  BUYER_AGENT: { icon: Bot, color: '#6d28d9', bg: '#f5f3ff', label: 'Buyer Agent', emoji: '🤖' },
  MERCHANT_AGENT: { icon: Store, color: '#0369a1', bg: '#f0f9ff', label: 'Merchant Agent', emoji: '🏪' },
  POLICY_ENGINE: { icon: ShieldCheck, color: '#dc2626', bg: '#fef2f2', label: 'Policy Engine', emoji: '🛡️' },
  CUSTOMER: { icon: User, color: '#059669', bg: '#f0fdf4', label: 'Customer', emoji: '👤' }
};

function AgentBadge({ agent }) {
  const cfg = AGENT_CONFIG[agent] || AGENT_CONFIG.BUYER_AGENT;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      background: cfg.bg, color: cfg.color, padding: '0.2rem 0.55rem',
      borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700,
      border: `1px solid ${cfg.color}22`
    }}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

function MessageCard({ msg, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const agent = msg.from_agent || 'MERCHANT_AGENT';
  const cfg = AGENT_CONFIG[agent] || AGENT_CONFIG.MERCHANT_AGENT;

  const isBlocked = msg.result === 'BLOCKED' || msg.type === 'POLICY_RESULT' && msg.result === 'BLOCKED';
  const isAllowed = msg.result === 'ALLOWED';
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
    <div style={{
      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
      opacity: 1, animation: 'fadeInUp 0.3s ease-out'
    }}>
      {/* Timeline dot + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 32 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: isBlocked ? '#fef2f2' : isAllowed ? '#f0fdf4' : isReplan ? '#fffbeb' : cfg.bg,
          border: `2px solid ${isBlocked ? '#ef4444' : isAllowed ? '#22c55e' : isReplan ? '#f59e0b' : cfg.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
          flexShrink: 0
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
        borderLeft: `3px solid ${isBlocked ? '#ef4444' : isAllowed ? '#22c55e' : isReplan ? '#f59e0b' : cfg.color}`,
        padding: '0.75rem 1rem', marginBottom: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <AgentBadge agent={agent} />
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
            {msg.type?.replace(/_/g, ' ')}
          </span>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.55 }}>
          {msg.reasoning || msg.reason || ''}
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
            {msg.product.stock && (
              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                ({msg.product.stock} in stock)
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

        {/* Coupon info */}
        {msg.coupon && msg.coupon.code && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#f0fdf4', padding: '0.4rem 0.65rem', borderRadius: '8px',
            marginTop: '0.35rem', border: '1px solid #bbf7d0'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
              🎟️ {msg.coupon.code} — saves ₹{msg.coupon.discount_amount}
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
            {isBlocked ? 'BLOCKED' : 'ALLOWED'}
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
            {isAccept ? 'ACCEPTED — Ready for customer approval' : 'REJECTED — Over budget'}
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
            evidence
          </button>
        )}
        {expanded && msg.evidence && (
          <pre style={{
            fontSize: '0.68rem', color: '#475569', background: '#f8fafc',
            padding: '0.4rem', borderRadius: '4px', margin: '0.2rem 0 0',
            lineHeight: 1.4, overflow: 'hidden'
          }}>
            {JSON.stringify(msg.evidence, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function AIBuyerMode({ onAddToCart, cart, setIsCartOpen, setIsCheckoutOpen }) {
  const [intent, setIntent] = useState('');
  const [budget, setBudget] = useState(3000);
  const [preferences, setPreferences] = useState([]);
  const [messages, setMessages] = useState([]);
  const [finalOffer, setFinalOffer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState(null);
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
        setMessages(data.messages || []);
        setFinalOffer(data.final_offer || null);
      }
    } catch (err) {
      setError(`Connection error: ${err.message}`);
    }

    setLoading(false);
  };

  const handleApprove = () => {
    if (!finalOffer) return;

    // Add main product to cart
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

    // Add upsell to cart if present
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

    setApproved(true);

    // Open checkout after a brief delay for visual feedback
    setTimeout(() => {
      setIsCartOpen(false);
      setIsCheckoutOpen(true);
    }, 800);
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
            <span>AI Buyer Agent</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Your personal buyer agent negotiates with the merchant agent on your behalf. You approve before any payment.
          </p>
        </div>
        <div style={{
          display: 'flex', gap: '0.4rem',
          background: '#f5f3ff', padding: '0.3rem', borderRadius: '8px', border: '1px solid #e9d5ff'
        }}>
          <AgentBadge agent="BUYER_AGENT" />
          <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'flex', alignItems: 'center' }}>⟷</span>
          <AgentBadge agent="MERCHANT_AGENT" />
        </div>
      </div>

      {/* Input Section */}
      <div style={{
        background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0',
        padding: '1.25rem', marginBottom: '1rem'
      }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          What are you looking for?
        </label>
        <form onSubmit={(e) => { e.preventDefault(); runBuyer(); }} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="e.g., Find me a tech gift under ₹3000 for my brother"
            disabled={loading}
            style={{
              flex: 1, padding: '0.7rem 1rem', borderRadius: '10px',
              border: '1px solid #e2e8f0', fontSize: '0.9rem',
              outline: 'none', background: '#f8fafc'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>₹</span>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              min={100}
              max={10000}
              style={{
                width: 80, padding: '0.7rem 0.5rem', borderRadius: '10px',
                border: '1px solid #e2e8f0', fontSize: '0.9rem',
                outline: 'none', background: '#f8fafc', textAlign: 'center'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !intent.trim()}
            style={{
              padding: '0.7rem 1.25rem',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #6d28d9, #7c3aed)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(109,40,217,0.3)'
            }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
            {loading ? 'Running...' : 'Find'}
          </button>
        </form>

        {/* Quick intents */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {SAMPLE_INTENTS.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickIntent(item)}
              disabled={loading}
              style={{
                padding: '0.35rem 0.7rem', borderRadius: '9999px',
                border: '1px solid #e9d5ff', background: '#faf5ff',
                color: '#6d28d9', fontSize: '0.75rem', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Timeline */}
      {(messages.length > 0 || loading) && (
        <div style={{
          background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={16} color="#6d28d9" />
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                Agent-to-Agent Commerce Timeline
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {messages.length} messages
            </span>
          </div>

          <div
            ref={timelineRef}
            style={{ padding: '1rem 1.25rem', maxHeight: 480, overflowY: 'auto' }}
          >
            {messages.map((msg, i) => (
              <MessageCard key={i} msg={msg} isLast={i === messages.length - 1 && !loading} />
            ))}

            {loading && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem', color: '#6d28d9', fontSize: '0.85rem'
              }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Agents negotiating...
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Customer Approval Gate */}
      {finalOffer && !approved && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #f5f3ff 100%)',
          borderRadius: '14px', border: '2px solid #22c55e',
          padding: '1.5rem', marginTop: '1rem',
          boxShadow: '0 8px 25px -5px rgba(34,197,94,0.15)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#15803d' }}>
              Purchase Proposal — Customer Approval Required
            </span>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: finalOffer.upsell ? '1fr 1fr' : '1fr',
            gap: '0.75rem', marginBottom: '1rem'
          }}>
            {/* Main product */}
            <div style={{
              background: 'white', borderRadius: '10px', padding: '0.75rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Main Product
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                {finalOffer.product.name}
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0369a1' }}>
                ₹{finalOffer.product.price.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {finalOffer.product.rating}★ · {finalOffer.product.stock} in stock
              </div>
            </div>

            {/* Upsell */}
            {finalOffer.upsell && (
              <div style={{
                background: 'white', borderRadius: '10px', padding: '0.75rem',
                border: '1px solid #fde68a'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Complementary Add-on
                  {finalOffer.replanning_occurred && (
                    <span style={{
                      marginLeft: '0.3rem', background: '#fffbeb', color: '#b45309',
                      padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.6rem'
                    }}>REPLANNED</span>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  {finalOffer.upsell.name}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#d97706' }}>
                  ₹{finalOffer.upsell.price.toLocaleString('en-IN')}
                </div>
              </div>
            )}
          </div>

          {/* Blocked upsell info */}
          {finalOffer.blocked_upsell && (
            <div style={{
              background: '#fef2f2', borderRadius: '8px', padding: '0.5rem 0.75rem',
              marginBottom: '0.75rem', border: '1px solid #fecaca', fontSize: '0.78rem'
            }}>
              <span style={{ color: '#dc2626', fontWeight: 700 }}>
                ⚠ Initially proposed "{finalOffer.blocked_upsell.name}" (₹{finalOffer.blocked_upsell.price}) was blocked:
              </span>{' '}
              <span style={{ color: '#7f1d1d' }}>{finalOffer.blocked_upsell.block_reason}</span>
            </div>
          )}

          {/* Price breakdown */}
          <div style={{
            background: 'white', borderRadius: '10px', padding: '0.75rem 1rem',
            border: '1px solid #e2e8f0', marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>
              <span>Subtotal</span>
              <span>₹{finalOffer.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {finalOffer.coupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#16a34a', marginBottom: '0.25rem' }}>
                <span>Coupon {finalOffer.coupon.code}</span>
                <span>−₹{finalOffer.coupon.discount_amount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem', marginTop: '0.3rem' }}>
              <span>Total</span>
              <span>₹{finalOffer.final_total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Approve button */}
          <button
            type="button"
            id="a2a-approve-btn"
            onClick={handleApprove}
            style={{
              width: '100%', padding: '0.85rem',
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(34,197,94,0.4)',
              transition: 'transform 0.15s ease'
            }}
          >
            <CheckCircle2 size={18} />
            Approve & Continue to Razorpay — ₹{finalOffer.final_total.toLocaleString('en-IN')}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#64748b', marginTop: '0.5rem' }}>
            Neither Buyer Agent nor Merchant Agent can execute payment without your explicit approval.
          </div>
        </div>
      )}

      {/* Approved confirmation */}
      {approved && (
        <div style={{
          background: '#f0fdf4', borderRadius: '14px', border: '2px solid #22c55e',
          padding: '1.5rem', marginTop: '1rem', textAlign: 'center'
        }}>
          <CheckCircle2 size={32} color="#22c55e" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#16a34a' }}>
            Approved! Opening Razorpay Checkout...
          </div>
          <div style={{ fontSize: '0.82rem', color: '#15803d', marginTop: '0.3rem' }}>
            Cart updated with your approved items. Razorpay Test Mode checkout is loading.
          </div>
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
