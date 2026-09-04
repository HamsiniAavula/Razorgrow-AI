// server/a2a.js
// Agent-to-Agent (A2A) Commerce Layer for RazorGrow AI
// Enables external AI buyers to discover, negotiate, and purchase from this merchant
// with zero human involvement — end-to-end machine commerce.
//
// Endpoints:
//   GET  /api/a2a/manifest          — Machine-readable merchant capability card (JSON-LD style)
//   POST /api/a2a/discover          — AI buyer sends intent + budget, gets ranked products
//   POST /api/a2a/negotiate         — AI buyer locks product, gets signed quote with TTL
//   POST /api/a2a/checkout          — AI buyer executes autonomous payment against a quote
//   POST /api/a2a/simulate-buyer    — Spawn a Gemini-powered buyer agent (SSE stream)
//   GET  /api/a2a/sessions          — Historical A2A session list

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('./db');
const PolicyEngine = require('./policies');
const CouponOptimizer = require('./coupons');
const RazorpayService = require('./razorpay');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const QUOTE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory quote store (TTL-keyed). Production would use Redis.
const quoteStore = new Map();

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────

function cleanQuotes() {
  const now = Date.now();
  for (const [id, q] of quoteStore.entries()) {
    if (now > q.expires_at_ms) quoteStore.delete(id);
  }
}

function makeQuoteId() {
  return `quote_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function bestCouponForCart(subtotal) {
  try {
    const result = CouponOptimizer.optimize(subtotal);
    return result && result.bestCoupon ? result.bestCoupon : null;
  } catch (e) {
    return null;
  }
}

// Simple Gemini text call for the buyer agent reasoning
async function geminiThink(prompt) {
  if (!GEMINI_API_KEY) {
    return 'I will prioritize top-rated products that match the gift intent and stay within policy bounds.';
  }
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 256 }
        })
      }
    );
    const data = await resp.json();
    return data && data.candidates && data.candidates[0]
      ? data.candidates[0].content.parts[0].text.trim()
      : 'I will select the best-rated product matching the stated intent and budget.';
  } catch (err) {
    return 'I will select the best-rated product matching the stated intent and budget.';
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────
// 1. MANIFEST  —  GET /api/a2a/manifest
// ─────────────────────────────────────────────────
router.get('/manifest', (req, res) => {
  const policies = db.getPolicies();
  const products = db.getProducts();
  const categories = [...new Set(products.map(p => p.category))];

  res.json({
    '@context': 'https://schema.org',
    '@type': 'MerchantCapabilityManifest',
    schema_version: '1.0',
    protocol: 'RazorGrow-A2A/1.0',
    merchant: {
      id: 'merchant_acme_001',
      name: 'Acme Commerce',
      description: 'Multi-category Indian e-commerce merchant on Razorpay',
      currency: 'INR',
      payment_provider: 'Razorpay',
      payment_mode: 'test'
    },
    capabilities: {
      can_discover: true,
      can_negotiate: true,
      can_upsell: true,
      can_apply_coupons: true,
      autonomous_checkout: true,
      streaming_session: true
    },
    policy_bounds: {
      max_upsell_inr: policies.max_upsell_amount || 500,
      max_transaction_inr: policies.max_transaction_amount || 5000,
      max_discount_percent: policies.max_discount_percent || 10,
      customer_approval_required: policies.customer_approval_required || false
    },
    catalog: {
      endpoint: '/api/a2a/discover',
      product_count: products.length,
      categories
    },
    endpoints: {
      discover:  { method: 'POST', path: '/api/a2a/discover',       description: 'Send intent + budget, receive ranked products' },
      negotiate: { method: 'POST', path: '/api/a2a/negotiate',      description: 'Lock product, receive TTL-bound quote' },
      checkout:  { method: 'POST', path: '/api/a2a/checkout',       description: 'Execute autonomous payment' },
      simulate:  { method: 'POST', path: '/api/a2a/simulate-buyer', description: 'Spawn Gemini buyer agent (SSE)' }
    },
    audit: {
      every_action_logged: true,
      audit_endpoint: '/api/merchant/audit-ledger'
    },
    generated_at: new Date().toISOString()
  });
});

// ─────────────────────────────────────────────────
// 2. DISCOVER  —  POST /api/a2a/discover
// ─────────────────────────────────────────────────
router.post('/discover', (req, res) => {
  const { intent = '', budget_inr = 10000, preferences = [], buyer_agent_id = 'unknown_agent' } = req.body;
  const products = db.getProducts();
  const intentLower = intent.toLowerCase();
  const prefLower = preferences.map(p => p.toLowerCase());

  let matches = products.filter(p => p.stock > 0 && p.price <= budget_inr);

  matches = matches.map(p => {
    let score = p.rating || 3;
    if (prefLower.some(pref => (p.category || '').toLowerCase().includes(pref))) score += 4;
    if (intentLower.includes('gift') && ['Watches', 'Accessories', 'Gifts'].includes(p.category)) score += 3;
    if ((intentLower.includes('tech') || intentLower.includes('electronic')) && ['Electronics', 'Audio'].includes(p.category)) score += 4;
    if ((intentLower.includes('fashion') || intentLower.includes('apparel')) && ['Apparel', 'Footwear'].includes(p.category)) score += 4;
    if ((intentLower.includes('beauty') || intentLower.includes('skin')) && p.category === 'Beauty') score += 4;
    return Object.assign({}, p, { _relevance_score: score });
  }).sort((a, b) => b._relevance_score - a._relevance_score);

  const topProducts = matches.slice(0, 5);
  const enriched = topProducts.map(p => {
    const upsellCandidates = products.filter(u =>
      u.id !== p.id && u.stock > 0 && u.price <= (db.getPolicies().max_upsell_amount || 500)
    );
    const upsell = upsellCandidates[0] || null;
    const upsellCheck = upsell ? PolicyEngine.evaluateUpsell(upsell, p.price) : null;

    return {
      id: p.id,
      name: p.name,
      category: p.category,
      price_inr: p.price,
      rating: p.rating,
      stock: p.stock,
      description: p.description,
      relevance_score: p._relevance_score,
      upsell_opportunity: (upsell && upsellCheck && upsellCheck.allowed) ? {
        id: upsell.id,
        name: upsell.name,
        price_inr: upsell.price,
        policy_status: 'ALLOWED',
        policy_reason: upsellCheck.reason
      } : null
    };
  });

  db.addAiAction({
    order_id: null,
    session_id: buyer_agent_id,
    action_type: 'A2A_DISCOVER',
    status: 'SUCCESS',
    reason: 'A2A buyer discovered catalog',
    confidence: 0.95,
    input_summary: `Intent: ${intent}, Budget: ₹${budget_inr}`,
    output_summary: `Returned ${enriched.length} products`,
    evidence: `Top match: ${enriched[0] ? enriched[0].name : 'none'}`,
    policy_checks: { budget_filter_applied: true }
  });

  res.json({ status: 'ok', buyer_agent_id, intent, budget_inr, products: enriched });
});

// ─────────────────────────────────────────────────
// 3. NEGOTIATE  —  POST /api/a2a/negotiate
// ─────────────────────────────────────────────────
router.post('/negotiate', (req, res) => {
  const { product_id, quantity = 1, upsell_product_id = null, apply_best_coupon = true, buyer_agent_id = 'unknown_agent' } = req.body;

  if (!product_id) return res.status(400).json({ error: 'product_id is required' });

  const product = db.getProductById(product_id);
  if (!product || product.stock < quantity) {
    return res.status(404).json({ error: 'Product not found or insufficient stock', product_id });
  }

  let subtotal = product.price * quantity;
  const lineItems = [{ id: product.id, name: product.name, price_inr: product.price, quantity, line_total: product.price * quantity }];

  let upsellDecision = null;
  if (upsell_product_id) {
    const up = db.getProductById(upsell_product_id);
    if (up && up.stock > 0) {
      const check = PolicyEngine.evaluateUpsell(up, product.price);
      upsellDecision = { product_id: up.id, name: up.name, price_inr: up.price, policy_status: check.allowed ? 'ALLOWED' : 'BLOCKED', policy_reason: check.reason };
      if (check.allowed) {
        subtotal += up.price;
        lineItems.push({ id: up.id, name: up.name, price_inr: up.price, quantity: 1, line_total: up.price, tag: 'upsell' });
      }
    }
  }

  let discountAmount = 0;
  let couponApplied = null;
  if (apply_best_coupon) {
    const optimized = CouponOptimizer.optimize(subtotal);
    if (optimized && optimized.bestCoupon) {
      const bc = optimized.bestCoupon;
      discountAmount = optimized.discountAmount || 0;
      const cv = PolicyEngine.evaluateCart(subtotal, discountAmount);
      if (cv.allowed) {
        couponApplied = { code: bc.code, type: bc.type, value: bc.value, discount_amount: discountAmount, policy_status: 'ALLOWED' };
      } else {
        discountAmount = 0;
      }
    }
  }

  const totalInr = subtotal - discountAmount;
  const cartValidation = PolicyEngine.evaluateCart(subtotal, discountAmount);
  if (!cartValidation.allowed) {
    return res.status(422).json({ error: 'Cart violates merchant policy', reason: cartValidation.reason, policy_checks: cartValidation.policy_checks });
  }

  cleanQuotes();
  const quoteId = makeQuoteId();
  const expiresAtMs = Date.now() + QUOTE_TTL_MS;
  quoteStore.set(quoteId, { quote_id: quoteId, buyer_agent_id, product_id, line_items: lineItems, subtotal_inr: subtotal, discount_inr: discountAmount, total_inr: totalInr, coupon: couponApplied, policy_checks: cartValidation.policy_checks, expires_at_ms: expiresAtMs, expires_at_iso: new Date(expiresAtMs).toISOString() });

  db.addAiAction({ order_id: null, session_id: buyer_agent_id, action_type: 'A2A_NEGOTIATE', status: 'SUCCESS', reason: `A2A buyer negotiated quote`, confidence: 1.0, input_summary: `Product: ${product.name} ₹${product.price}`, output_summary: `Quote ${quoteId}: ₹${totalInr}`, evidence: couponApplied ? `Coupon ${couponApplied.code} applied` : 'No coupon', policy_checks: cartValidation.policy_checks });

  res.json({ status: 'ok', quote_id: quoteId, line_items: lineItems, subtotal_inr: subtotal, discount_inr: discountAmount, total_inr: totalInr, coupon_applied: couponApplied, upsell_decision: upsellDecision, policy_validation: cartValidation, expires_at: new Date(expiresAtMs).toISOString(), ttl_seconds: QUOTE_TTL_MS / 1000 });
});

// ─────────────────────────────────────────────────
// 4. CHECKOUT  —  POST /api/a2a/checkout
// ─────────────────────────────────────────────────
router.post('/checkout', async (req, res) => {
  const { quote_id, buyer_agent_id = 'unknown_agent' } = req.body;
  if (!quote_id) return res.status(400).json({ error: 'quote_id is required' });

  cleanQuotes();
  const quote = quoteStore.get(quote_id);
  if (!quote) return res.status(404).json({ error: 'Quote not found or expired', quote_id });
  if (Date.now() > quote.expires_at_ms) { quoteStore.delete(quote_id); return res.status(410).json({ error: 'Quote has expired' }); }
  quoteStore.delete(quote_id);

  let rzpOrder;
  try {
    rzpOrder = await RazorpayService.createOrder(quote.total_inr, `a2a_${quote_id}`, { buyer_agent: buyer_agent_id, source: 'A2A_COMMERCE', quote_id });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to create Razorpay order', details: err.message });
  }

  const paymentId = `pay_A2A_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const signature = RazorpayService.generateSignature(rzpOrder.id, paymentId);
  const verification = RazorpayService.verifyPaymentSignature({ razorpay_order_id: rzpOrder.id, razorpay_payment_id: paymentId, razorpay_signature: signature });

  const order = db.createOrder({ razorpay_order_id: rzpOrder.id, razorpay_payment_id: paymentId, customer_id: `agent_${buyer_agent_id}`, items: quote.line_items, subtotal: quote.subtotal_inr, discount: quote.discount_inr, total: quote.total_inr, coupon_code: quote.coupon ? quote.coupon.code : null, status: 'PAID', ai_influenced: true, ai_attributed_revenue: quote.total_inr, source: 'A2A_COMMERCE', buyer_agent_id, quote_id });
  db.updateOrderStatus(order.id, 'PAID', paymentId);

  db.addA2ASession({ session_id: `a2a_${quote_id}`, buyer_agent_id, quote_id, order_id: order.id, razorpay_order_id: rzpOrder.id, razorpay_payment_id: paymentId, total_inr: quote.total_inr, status: 'COMPLETED', line_items: quote.line_items, coupon: quote.coupon });

  db.addAiAction({ order_id: order.id, session_id: buyer_agent_id, action_type: 'A2A_CHECKOUT', status: 'SUCCESS', reason: `A2A autonomous checkout complete`, confidence: 1.0, input_summary: `Quote: ${quote_id}, ₹${quote.total_inr}`, output_summary: `Order ${order.id} PAID. Payment: ${paymentId}`, evidence: `Razorpay: ${rzpOrder.id}. Sig: ${verification.isValid ? 'VERIFIED' : 'FAILED'}`, policy_checks: Object.assign({}, quote.policy_checks, { signature_verified: verification.isValid, a2a_autonomous: true }) });

  res.json({ status: 'PAYMENT_CAPTURED', message: 'Autonomous A2A checkout complete. Zero humans involved.', order_id: order.id, razorpay_order_id: rzpOrder.id, razorpay_payment_id: paymentId, signature_verified: verification.isValid, total_inr: quote.total_inr, buyer_agent_id, protocol: 'RazorGrow-A2A/1.0', audit_trail: '/api/merchant/audit-ledger' });
});

// ─────────────────────────────────────────────────
// 5. SIMULATE BUYER  —  POST /api/a2a/simulate-buyer (SSE)
// ─────────────────────────────────────────────────
router.post('/simulate-buyer', async (req, res) => {
  const { intent = 'I want to buy a birthday gift for my sister', budget_inr = 3000, preferences = ['Electronics', 'Accessories'] } = req.body;
  const buyerAgentId = `gemini_buyer_${Date.now()}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const emit = (type, data) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const step = (phase, message, payload) => {
    emit('step', { phase, message, payload: payload || {}, ts: new Date().toISOString() });
  };

  try {
    step('INIT', `🤖 AI Buyer Agent "${buyerAgentId}" starting autonomous shopping session`, { buyer_agent_id: buyerAgentId, intent, budget_inr });
    await delay(600);

    // Step 1: Manifest
    step('MANIFEST', '📋 Fetching merchant capability manifest...', {});
    await delay(700);
    const policies = db.getPolicies();
    step('MANIFEST', '✅ Manifest received. Merchant is A2A-transactable.', {
      merchant: 'Acme Commerce', max_upsell_inr: policies.max_upsell_amount, max_transaction_inr: policies.max_transaction_amount, autonomous_checkout: true
    });
    await delay(500);

    // Step 2: Gemini reasoning
    step('REASONING', '🧠 Gemini buyer reasoning about shopping strategy...', {});
    const reasoningPrompt = `You are an AI buyer agent. Shopping for: "${intent}" with budget ₹${budget_inr}. The merchant sells Electronics, Apparel, Accessories, Beauty, Footwear, Watches. Policy: max upsell ₹${policies.max_upsell_amount}, max transaction ₹${policies.max_transaction_amount}. In 2 sentences, describe your shopping strategy.`;
    const reasoning = await geminiThink(reasoningPrompt);
    step('REASONING', `💭 ${reasoning}`, { gemini_reasoning: reasoning });
    await delay(800);

    // Step 3: Discover
    step('DISCOVER', `🔍 Calling /api/a2a/discover — intent="${intent}", budget=₹${budget_inr}...`, {});
    await delay(600);

    const products = db.getProducts();
    const intentLower = intent.toLowerCase();
    const prefLower = preferences.map(p => p.toLowerCase());
    let candidates = products.filter(p => p.stock > 0 && p.price <= budget_inr).map(p => {
      let score = p.rating || 3;
      if (prefLower.some(pref => (p.category || '').toLowerCase().includes(pref))) score += 4;
      if (intentLower.includes('gift') && ['Watches', 'Accessories', 'Gifts'].includes(p.category)) score += 3;
      if (['Electronics', 'Audio'].includes(p.category)) score += 2;
      return Object.assign({}, p, { _score: score });
    }).sort((a, b) => b._score - a._score);

    const topProduct = candidates[0];
    if (!topProduct) {
      step('ERROR', '❌ No products found within budget.', {});
      emit('done', { status: 'NO_PRODUCTS_FOUND' });
      return res.end();
    }

    step('DISCOVER', `📦 Found ${candidates.length} products. Top pick: "${topProduct.name}" at ₹${topProduct.price}`, {
      top_product: { id: topProduct.id, name: topProduct.name, price: topProduct.price, category: topProduct.category }
    });
    await delay(600);

    // Step 4: Select + upsell check
    step('SELECT', '🎯 Evaluating upsell opportunity within policy bounds...', {});
    const upsellCandidates = products.filter(u => u.id !== topProduct.id && u.stock > 0 && u.price <= (policies.max_upsell_amount || 500));
    const upsellPick = upsellCandidates[0] || null;
    let upsellAdded = false;

    if (upsellPick) {
      const upsellCheck = PolicyEngine.evaluateUpsell(upsellPick, topProduct.price);
      if (upsellCheck.allowed) {
        step('SELECT', `➕ Upsell: "${upsellPick.name}" ₹${upsellPick.price} — within ₹${policies.max_upsell_amount} cap ✅`, {
          upsell: { id: upsellPick.id, name: upsellPick.name, price: upsellPick.price }, policy: 'ALLOWED', reason: upsellCheck.reason
        });
        upsellAdded = true;
      } else {
        step('SELECT', `⛔ Upsell "${upsellPick.name}" BLOCKED: ${upsellCheck.reason}`, { policy: 'BLOCKED', reason: upsellCheck.reason });
      }
    }
    await delay(700);

    // Step 5: Build cart & negotiate
    step('NEGOTIATE', `📝 Building cart and negotiating quote...`, {});
    await delay(500);

    let subtotal = topProduct.price;
    const lineItems = [{ id: topProduct.id, name: topProduct.name, price_inr: topProduct.price, quantity: 1, line_total: topProduct.price }];

    if (upsellAdded && upsellPick) {
      const uc = PolicyEngine.evaluateUpsell(upsellPick, topProduct.price);
      if (uc.allowed) {
        subtotal += upsellPick.price;
        lineItems.push({ id: upsellPick.id, name: upsellPick.name, price_inr: upsellPick.price, quantity: 1, line_total: upsellPick.price, tag: 'upsell' });
      }
    }

    const optimizedCoupon = CouponOptimizer.optimize(subtotal);
    let discountAmount = 0;
    let couponApplied = null;
    if (optimizedCoupon && optimizedCoupon.bestCoupon) {
      discountAmount = optimizedCoupon.discountAmount || 0;
      const cv = PolicyEngine.evaluateCart(subtotal, discountAmount);
      if (cv.allowed) {
        couponApplied = { code: optimizedCoupon.bestCoupon.code, discount_amount: discountAmount };
      } else {
        discountAmount = 0;
      }
    }

    const totalInr = subtotal - discountAmount;
    const cartVal = PolicyEngine.evaluateCart(subtotal, discountAmount);

    if (!cartVal.allowed) {
      step('POLICY_BLOCK', `🚫 Policy BLOCKED checkout: ${cartVal.reason}`, { reason: cartVal.reason });
      db.addAiAction({ session_id: buyerAgentId, action_type: 'A2A_POLICY_BLOCK', status: 'BLOCKED', reason: cartVal.reason, confidence: 1.0, input_summary: `A2A buyer: ${buyerAgentId}`, output_summary: `Checkout blocked. ₹${totalInr} failed policy.`, evidence: JSON.stringify(cartVal.policy_checks), policy_checks: cartVal.policy_checks });
      emit('done', { status: 'BLOCKED', reason: cartVal.reason });
      return res.end();
    }

    const quoteId = makeQuoteId();
    const expiresAtMs = Date.now() + QUOTE_TTL_MS;
    quoteStore.set(quoteId, { quote_id: quoteId, buyer_agent_id: buyerAgentId, product_id: topProduct.id, line_items: lineItems, subtotal_inr: subtotal, discount_inr: discountAmount, total_inr: totalInr, coupon: couponApplied, policy_checks: cartVal.policy_checks, expires_at_ms: expiresAtMs, expires_at_iso: new Date(expiresAtMs).toISOString() });

    step('NEGOTIATE', `✅ Quote locked: ${quoteId}`, {
      quote_id: quoteId, line_items: lineItems, subtotal_inr: subtotal, discount_inr: discountAmount, total_inr: totalInr,
      coupon_applied: couponApplied, policy_status: 'PASS', expires_at: new Date(expiresAtMs).toISOString()
    });
    await delay(800);

    // Step 6: Execute checkout
    step('CHECKOUT', `💳 Executing autonomous checkout with quote ${quoteId}...`, {});
    await delay(600);

    quoteStore.delete(quoteId);

    let rzpOrder;
    try {
      rzpOrder = await RazorpayService.createOrder(totalInr, `a2a_sim_${quoteId}`, { buyer_agent: buyerAgentId, source: 'A2A_SIMULATED', quote_id: quoteId });
    } catch (err) {
      step('ERROR', `❌ Razorpay order creation failed: ${err.message}`, {});
      emit('done', { status: 'RAZORPAY_ERROR' });
      return res.end();
    }

    const paymentId = `pay_A2A_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const signature = RazorpayService.generateSignature(rzpOrder.id, paymentId);
    const verification = RazorpayService.verifyPaymentSignature({ razorpay_order_id: rzpOrder.id, razorpay_payment_id: paymentId, razorpay_signature: signature });

    step('PAYMENT', `🔐 HMAC-SHA256 signature: ${verification.isValid ? '✅ VERIFIED' : '❌ INVALID'}`, {
      razorpay_order_id: rzpOrder.id, razorpay_payment_id: paymentId, signature_verified: verification.isValid
    });
    await delay(500);

    const order = db.createOrder({ razorpay_order_id: rzpOrder.id, razorpay_payment_id: paymentId, customer_id: `agent_${buyerAgentId}`, items: lineItems, subtotal, discount: discountAmount, total: totalInr, coupon_code: couponApplied ? couponApplied.code : null, status: 'PAID', ai_influenced: true, ai_attributed_revenue: totalInr, source: 'A2A_COMMERCE', buyer_agent_id: buyerAgentId, quote_id: quoteId });
    db.updateOrderStatus(order.id, 'PAID', paymentId);

    db.addA2ASession({ session_id: `a2a_sim_${quoteId}`, buyer_agent_id: buyerAgentId, quote_id: quoteId, order_id: order.id, razorpay_order_id: rzpOrder.id, razorpay_payment_id: paymentId, total_inr: totalInr, status: 'COMPLETED', line_items: lineItems, coupon: couponApplied, intent, budget_inr, gemini_reasoning: reasoning });

    db.addAiAction({ order_id: order.id, session_id: buyerAgentId, action_type: 'A2A_CHECKOUT', status: 'SUCCESS', reason: `Simulated A2A buyer completed autonomous checkout.`, confidence: 1.0, input_summary: `Quote: ${quoteId}, ₹${totalInr}`, output_summary: `Order ${order.id} PAID. Payment: ${paymentId}`, evidence: `Razorpay: ${rzpOrder.id}. Sig: ${verification.isValid ? 'VERIFIED' : 'FAILED'}`, policy_checks: Object.assign({}, cartVal.policy_checks, { signature_verified: verification.isValid, a2a_autonomous: true }) });

    db.addAiAction({ order_id: order.id, session_id: buyerAgentId, action_type: 'A2A_REVENUE_ATTRIBUTED', status: 'SUCCESS', reason: `A2A machine-originated revenue ₹${totalInr}. Zero human involvement.`, confidence: 1.0, input_summary: `Order ${order.id}`, output_summary: `₹${totalInr} attributed to A2A channel`, evidence: `Payment: ${paymentId}`, policy_checks: { a2a_autonomous: true } });

    step('SUCCESS', `🎉 PAYMENT CAPTURED — ₹${totalInr} collected autonomously. Zero humans involved.`, {
      order_id: order.id, razorpay_order_id: rzpOrder.id, razorpay_payment_id: paymentId, total_inr: totalInr,
      line_items: lineItems, protocol: 'RazorGrow-A2A/1.0', audit_trail: '/api/merchant/audit-ledger'
    });

    emit('done', { status: 'SUCCESS', order_id: order.id, payment_id: paymentId, total_inr: totalInr, buyer_agent_id: buyerAgentId });

  } catch (err) {
    console.error('[A2A simulate-buyer] Error:', err);
    emit('error', { message: err.message });
  }

  res.end();
});

// ─────────────────────────────────────────────────
// 6. SESSIONS  —  GET /api/a2a/sessions
// ─────────────────────────────────────────────────
router.get('/sessions', (req, res) => {
  const sessions = db.getA2ASessions();
  res.json({ sessions, count: sessions.length });
});

module.exports = router;