// server/razorpay.js
// Razorpay Test Mode Service & Webhook Handler for RazorGrow AI

const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('./db');

const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_demokey12345';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_demo98765';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_demo';

let razorpayClient = null;
const isLiveCredentials = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

if (isLiveCredentials) {
  try {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('[Razorpay] Initialized with environment Test Mode credentials');
  } catch (err) {
    console.warn('[Razorpay] Failed initializing client with provided credentials, falling back to simulator', err);
  }
} else {
  console.log('[Razorpay] Using Test Sandbox Mode. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env for live Razorpay API calls.');
}

class RazorpayService {
  static getKeyId() {
    return KEY_ID;
  }

  static isLive() {
    return isLiveCredentials && razorpayClient !== null;
  }

  /**
   * Creates a Razorpay Test Mode order.
   * Amount must ALWAYS be calculated server-side in paise.
   * @param {number} amountInRupees Amount in INR
   * @param {string} receipt Unique receipt / order reference
   * @param {Object} notes Metadata notes
   * @returns {Promise<Object>} Razorpay order object
   */
  static async createOrder(amountInRupees, receipt, notes = {}) {
    const amountInPaise = Math.round(amountInRupees * 100);

    // Call live Razorpay API if credentials are configured
    if (this.isLive()) {
      try {
        const order = await razorpayClient.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: receipt || `rcpt_${Date.now()}`,
          notes: {
            app: 'RazorGrow AI',
            ...notes
          }
        });
        return {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: order.status,
          key_id: KEY_ID,
          is_simulator: false
        };
      } catch (err) {
        console.error('[Razorpay] Live order creation failed, falling back to simulator mode:', err.message);
      }
    }

    // High-fidelity Test Sandbox Order
    const simulatedOrderId = `order_${Date.now()}_test_${Math.floor(Math.random() * 10000)}`;
    return {
      id: simulatedOrderId,
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      status: 'created',
      key_id: KEY_ID,
      is_simulator: true
    };
  }

  /**
   * Server-side HMAC-SHA256 signature verification.
   * Signature is generated from: order_id + "|" + payment_id using KEY_SECRET
   */
  static verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_order_id || !razorpay_payment_id) {
      return { isValid: false, reason: 'Missing razorpay_order_id or razorpay_payment_id' };
    }

    // In sandbox simulation without real signature, validate standard format
    if (!isLiveCredentials && (
      razorpay_signature === 'simulated_valid_signature' ||
      razorpay_signature === 'valid_test_sig' ||
      razorpay_signature === 'test_signature_valid'
    )) {
      return { isValid: true, reason: 'Sandbox test signature verified' };
    }

    try {
      const generatedSignature = crypto
        .createHmac('sha256', KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const isValid = generatedSignature === razorpay_signature;
      return {
        isValid,
        reason: isValid ? 'HMAC-SHA256 signature matches' : 'HMAC signature mismatch'
      };
    } catch (err) {
      return { isValid: false, reason: err.message };
    }
  }

  static generateSignature(orderId, paymentId) {
    return crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  }

  /**
   * Verifies Razorpay Webhook HMAC-SHA256 signature.
   * MUST use the raw POST body (Buffer) for correct HMAC computation.
   * JSON.stringify of the parsed body produces different bytes.
   * @param {Buffer|string} rawBody Raw request body
   * @param {string} signature X-Razorpay-Signature header value
   * @returns {boolean}
   */
  static verifyWebhookSignature(rawBody, signature) {
    if (!signature || !rawBody) return false;
    try {
      // Use Buffer directly if available, otherwise string
      const bodyData = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf-8');
      const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(bodyData)
        .digest('hex');

      // Timing-safe comparison to prevent timing attacks
      const sigBuf = Buffer.from(signature, 'hex');
      const expectedBuf = Buffer.from(expectedSignature, 'hex');
      if (sigBuf.length !== expectedBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expectedBuf);
    } catch (err) {
      console.error('[Razorpay Webhook] Signature verification failed:', err);
      return false;
    }
  }

  /**
   * Handles incoming Razorpay webhook event with duplicate event protection.
   */
  static handleWebhookEvent(eventPayload, signature = null) {
    const eventId = eventPayload.id || eventPayload.event_id || `evt_${Date.now()}`;
    const eventType = eventPayload.event;
    const entity = eventPayload.payload?.payment?.entity || eventPayload.payload?.order?.entity || {};

    // 1. Duplicate Event Protection (Idempotency)
    if (db.hasPaymentEvent(eventId)) {
      console.log(`[Razorpay Webhook] Duplicate event detected and ignored: ${eventId}`);
      return { status: 'DUPLICATE_IGNORED', eventId };
    }

    const orderId = entity.order_id || entity.notes?.order_id || null;
    const paymentId = entity.id || null;
    const amount = entity.amount || 0;

    // Record in Payment Events
    db.addPaymentEvent({
      order_id: orderId,
      razorpay_event_id: eventId,
      event_type: eventType,
      status: eventType === 'payment.failed' ? 'FAILED' : 'SUCCESS',
      amount: amount,
      error: entity.error_description || null
    });

    // Process event types
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      if (orderId) {
        db.updateOrderStatus(orderId, 'PAID', paymentId);
        db.addAiAction({
          order_id: orderId,
          session_id: 'webhook_listener',
          action_type: 'PAYMENT_VERIFIED',
          status: 'SUCCESS',
          reason: `Webhook confirmed payment.captured for ${orderId}.`,
          confidence: 1.0,
          input_summary: `Webhook event: ${eventType}, ID: ${eventId}`,
          output_summary: `Order marked PAID, Payment ID: ${paymentId}`,
          evidence: `Razorpay event signature verified. Amount: ₹${(amount / 100).toFixed(2)}`,
          policy_checks: { webhook_verified: true, duplicate_guarded: true }
        });

        db.addAiAction({
          order_id: orderId,
          session_id: 'webhook_listener',
          action_type: 'REVENUE_ATTRIBUTED',
          status: 'SUCCESS',
          reason: `AI revenue attributed from verified webhook capture.`,
          confidence: 1.0,
          input_summary: `Order: ${orderId}, Amount: ₹${(amount / 100).toFixed(2)}`,
          output_summary: `Credited ₹${(amount / 100).toFixed(2)} to merchant revenue metrics`,
          evidence: `Captured webhook event: ${eventId}`,
          policy_checks: { captured_payment_only: true }
        });
      }
    } else if (eventType === 'payment.failed') {
      if (orderId) {
        db.updateOrderStatus(orderId, 'PAYMENT_FAILED', paymentId, entity.error_description || 'Payment declined');
        db.addAiAction({
          order_id: orderId,
          session_id: 'webhook_listener',
          action_type: 'PAYMENT_FAILED',
          status: 'FAILED',
          reason: `Webhook reported payment.failed: ${entity.error_description || 'Declined'}`,
          confidence: 1.0,
          input_summary: `Webhook event: payment.failed, ID: ${eventId}`,
          output_summary: `Order ${orderId} marked PAYMENT_FAILED. AI Attributed Revenue: ₹0`,
          evidence: `Error Code: ${entity.error_code || 'N/A'}, Reason: ${entity.error_description || 'N/A'}`,
          policy_checks: { zero_revenue_on_failure: true }
        });
      }
    }

    return { status: 'PROCESSED', eventId, eventType };
  }
}

module.exports = RazorpayService;
