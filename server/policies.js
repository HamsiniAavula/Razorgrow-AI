// server/policies.js
// Deterministic Merchant Policy Engine for RazorGrow AI

const db = require('./db');

class PolicyEngine {
  /**
   * Validates an upsell proposal against merchant policy.
   * @param {Object} candidateProduct Product proposed for upsell
   * @param {number} baseProductPrice Price of primary item in cart
   * @param {Object} options Additional context like customer approval
   * @returns {Object} { allowed: boolean, reason: string, policy_checks: Object }
   */
  static evaluateUpsell(candidateProduct, baseProductPrice = 0, options = {}) {
    const policy = db.getPolicies();
    const policyChecks = {
      max_upsell_limit: policy.max_upsell_amount,
      proposed_price: candidateProduct.price,
      stock_available: candidateProduct.stock > 0,
      customer_approval_required: policy.customer_approval_required,
      customer_approved: Boolean(options.customerApproved)
    };

    // 1. Check Upsell Price Cap
    if (candidateProduct.price > policy.max_upsell_amount) {
      return {
        allowed: false,
        reason: `Upsell price (₹${candidateProduct.price}) exceeds merchant maximum limit of ₹${policy.max_upsell_amount}.`,
        code: 'EXCEEDS_MAX_UPSELL',
        policy_checks: {
          ...policyChecks,
          status: 'BLOCKED'
        }
      };
    }

    // 2. Check Stock Availability
    if (candidateProduct.stock <= 0 && !policy.allow_out_of_stock) {
      return {
        allowed: false,
        reason: `Upsell product "${candidateProduct.name}" is out of stock and merchant policy forbids backorders.`,
        code: 'OUT_OF_STOCK',
        policy_checks: {
          ...policyChecks,
          status: 'BLOCKED'
        }
      };
    }

    // 3. Check Overall Transaction Cap
    const projectedTotal = baseProductPrice + candidateProduct.price;
    if (projectedTotal > policy.max_transaction_amount) {
      return {
        allowed: false,
        reason: `Projected order total (₹${projectedTotal}) exceeds maximum allowed transaction limit of ₹${policy.max_transaction_amount}.`,
        code: 'EXCEEDS_TRANSACTION_LIMIT',
        policy_checks: {
          ...policyChecks,
          projected_total: projectedTotal,
          max_transaction_limit: policy.max_transaction_amount,
          status: 'BLOCKED'
        }
      };
    }

    return {
      allowed: true,
      reason: `Upsell passes all merchant constraints: price ₹${candidateProduct.price} <= limit ₹${policy.max_upsell_amount}, stock available.`,
      code: 'ALLOWED',
      policy_checks: {
        ...policyChecks,
        status: 'ALLOW'
      }
    };
  }

  /**
   * Validates cart subtotal and discount against merchant policy.
   * @param {number} subtotal 
   * @param {number} discountAmount 
   * @returns {Object}
   */
  static evaluateCart(subtotal, discountAmount = 0) {
    const policy = db.getPolicies();
    const effectiveDiscountPercent = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;

    const policyChecks = {
      max_transaction_limit: policy.max_transaction_amount,
      cart_subtotal: subtotal,
      max_discount_percent: policy.max_discount_percent,
      effective_discount_percent: Math.round(effectiveDiscountPercent * 10) / 10
    };

    if (subtotal > policy.max_transaction_amount) {
      return {
        allowed: false,
        reason: `Cart subtotal (₹${subtotal}) exceeds maximum merchant transaction ceiling of ₹${policy.max_transaction_amount}.`,
        policy_checks: { ...policyChecks, status: 'BLOCKED' }
      };
    }

    // Rounding margin allowance (0.5%)
    if (effectiveDiscountPercent > policy.max_discount_percent + 0.5) {
      return {
        allowed: false,
        reason: `Applied discount (${effectiveDiscountPercent.toFixed(1)}%) breaches merchant ceiling of ${policy.max_discount_percent}%.`,
        policy_checks: { ...policyChecks, status: 'BLOCKED' }
      };
    }

    return {
      allowed: true,
      reason: `Cart satisfies all financial and risk constraints.`,
      policy_checks: { ...policyChecks, status: 'ALLOW' }
    };
  }
}

module.exports = PolicyEngine;
