// server/db.js
// Persistent JSON database for RazorGrow AI
const fs = require('fs');
const path = require('path');
const {
  seedProducts,
  seedCoupons,
  seedPolicies,
  seedOpportunities,
  seedCustomer,
  seedOrders,
  seedAiActions,
  seedPaymentEvents,
  seedStats
} = require('./seed');

const DB_FILE = path.join(__dirname, 'database.json');

class Database {
  constructor() {
    this.data = {
      products: [],
      coupons: [],
      policies: {},
      opportunities: [],
      customer: {},
      orders: [],
      ai_actions: [],
      payment_events: [],
      stats: {},
      a2a_sessions: []
    };
    this.init();
  }

  init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log(`[Database] Loaded existing database from ${DB_FILE}`);
        // Ensure all keys exist
        if (!this.data.products || this.data.products.length === 0) {
          this.resetToSeed();
        }
      } catch (err) {
        console.error('[Database] Failed parsing database.json, resetting to seed data', err);
        this.resetToSeed();
      }
    } else {
      this.resetToSeed();
    }
  }

  resetToSeed() {
    console.log('[Database] Initializing with fresh seed data');
    this.data = {
      products: JSON.parse(JSON.stringify(seedProducts)),
      coupons: JSON.parse(JSON.stringify(seedCoupons)),
      policies: JSON.parse(JSON.stringify(seedPolicies)),
      opportunities: JSON.parse(JSON.stringify(seedOpportunities)),
      customer: JSON.parse(JSON.stringify(seedCustomer)),
      orders: JSON.parse(JSON.stringify(seedOrders)),
      ai_actions: JSON.parse(JSON.stringify(seedAiActions)),
      payment_events: JSON.parse(JSON.stringify(seedPaymentEvents)),
      stats: JSON.parse(JSON.stringify(seedStats)),
      a2a_sessions: []
    };
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Error persisting database.json:', err);
    }
  }

  // Products
  getProducts() {
    return this.data.products.filter(p => p.active);
  }

  getProductById(id) {
    if (!id) return null;
    let targetId = id;
    if (targetId === 'prod_packaging') targetId = 'prod_giftbox_04';
    if (targetId === 'prod_watch') targetId = 'prod_watch_01';
    return this.data.products.find(p => p.id === targetId);
  }

  // Policies
  getPolicies() {
    return this.data.policies;
  }

  updatePolicies(updates) {
    this.data.policies = {
      ...this.data.policies,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data.policies;
  }

  // Coupons
  getCoupons() {
    return this.data.coupons.filter(c => c.active);
  }

  getCouponByCode(code) {
    return this.data.coupons.find(c => c.code.toUpperCase() === (code || '').toUpperCase());
  }

  // Opportunities
  getOpportunities() {
    return this.data.opportunities;
  }

  activateOpportunity(id) {
    const opp = this.data.opportunities.find(o => o.id === id);
    if (opp) {
      opp.status = 'ACTIVE';
      opp.activated_at = new Date().toISOString();
      this.save();

      // Log AI Action for activation
      this.addAiAction({
        order_id: null,
        session_id: 'merchant_ops',
        action_type: 'POLICY_CHECKED',
        status: 'SUCCESS',
        reason: `Merchant activated AI Upsell: ${opp.product_name} → ${opp.recommended_product_name}`,
        confidence: 1.0,
        input_summary: `Opportunity ID: ${id}`,
        output_summary: `AI Upsell Active. Potential: ₹${opp.estimated_monthly_revenue.toLocaleString('en-IN')}/mo`,
        evidence: `Attachment gap: ${opp.current_attachment_rate}% vs benchmark ${opp.benchmark_attachment_rate}%.`,
        policy_checks: { merchant_approved: true }
      });
      return opp;
    }
    return null;
  }

  // Orders
  getOrders() {
    return this.data.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getOrderById(id) {
    return this.data.orders.find(o => o.id === id || o.razorpay_order_id === id);
  }

  createOrder(orderData) {
    const newOrder = {
      id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      ...orderData
    };
    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  updateOrderStatus(orderId, status, paymentId = null, failureReason = null) {
    const order = this.data.orders.find(o => o.id === orderId || o.razorpay_order_id === orderId);
    if (order) {
      order.status = status;
      if (paymentId) order.razorpay_payment_id = paymentId;
      if (failureReason) order.failure_reason = failureReason;

      // Rule: ai_attributed_revenue must ONLY become successfully captured payment amount.
      // If payment fails: ai_attributed_revenue = 0
      if (status === 'PAID') {
        order.ai_attributed_revenue = order.ai_influenced ? order.total : 0;
        this.data.stats.total_revenue += order.total;
        this.data.stats.ai_attributed_revenue += order.ai_attributed_revenue;
        this.data.stats.successful_orders += 1;
      } else if (status === 'PAYMENT_FAILED') {
        order.ai_attributed_revenue = 0;
      }

      this.save();
      return order;
    }
    return null;
  }

  // AI Actions Ledger (Append-Only)
  getAiActions(limit = 100) {
    return this.data.ai_actions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  addAiAction(action) {
    const newAction = {
      id: `act_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      confidence: 1.0,
      ...action
    };
    this.data.ai_actions.unshift(newAction);
    this.save();
    return newAction;
  }

  // Payment Events (Webhook & Signature tracking)
  getPaymentEvents() {
    return this.data.payment_events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  hasPaymentEvent(razorpayEventId) {
    if (!razorpayEventId) return false;
    return this.data.payment_events.some(e => e.razorpay_event_id === razorpayEventId);
  }

  addPaymentEvent(event) {
    const newEvent = {
      id: `pevt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    this.data.payment_events.unshift(newEvent);
    this.save();
    return newEvent;
  }

  // Analytics & Stats
  getStats() {
    // Dynamically calculate live metrics on top of seeded foundation
    const paidOrders = this.data.orders.filter(o => o.status === 'PAID');
    const totalRev = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const aiRev = paidOrders.reduce((sum, o) => sum + (o.ai_attributed_revenue || 0), 0);
    const activeOpps = this.data.opportunities.filter(o => o.status === 'ACTIVE').length;

    return {
      ...this.data.stats,
      current_orders_count: this.data.orders.length,
      paid_orders_count: paidOrders.length,
      active_opportunities_count: this.data.opportunities.length,
      calculated_total_revenue: this.data.stats.total_revenue,
      calculated_ai_revenue: this.data.stats.ai_attributed_revenue,
      ai_upsell_rate: this.data.stats.ai_upsell_rate
    };
  }

  getCustomer() {
    return this.data.customer;
  }

  // A2A Sessions (Agent-to-Agent Commerce)
  getA2ASessions() {
    if (!this.data.a2a_sessions) this.data.a2a_sessions = [];
    return this.data.a2a_sessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  addA2ASession(session) {
    if (!this.data.a2a_sessions) this.data.a2a_sessions = [];
    const newSession = {
      id: `a2a_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      created_at: new Date().toISOString(),
      ...session
    };
    this.data.a2a_sessions.unshift(newSession);
    // Also increment A2A revenue stats
    if (!this.data.stats.a2a_revenue) this.data.stats.a2a_revenue = 0;
    if (!this.data.stats.a2a_sessions_count) this.data.stats.a2a_sessions_count = 0;
    if (session.status === 'COMPLETED' && session.total_inr) {
      this.data.stats.a2a_revenue += session.total_inr;
      this.data.stats.a2a_sessions_count += 1;
    }
    this.save();
    return newSession;
  }
}

const db = new Database();
module.exports = db;
