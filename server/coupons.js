// server/coupons.js
// Deterministic Coupon Optimization Engine for RazorGrow AI

const db = require('./db');

class CouponOptimizer {
  /**
   * Deterministically evaluates all active coupons against a cart subtotal and merchant policy.
   * @param {number} subtotal Cart subtotal before discount
   * @param {Object} options Additional context like session_id, order_id
   * @returns {Object} Optimized coupon recommendation and audit details
   */
  static optimize(subtotal, options = {}) {
    const policy = db.getPolicies();
    const coupons = db.getCoupons();
    const maxDiscountPercent = policy.max_discount_percent || 10;

    const evaluated = [];

    for (const coupon of coupons) {
      let isEligible = true;
      let reason = '';
      let calculatedDiscount = 0;
      let effectivePercent = 0;
      let status = 'VALID';

      // 1. Minimum order check
      if (subtotal < coupon.minimum_order) {
        isEligible = false;
        status = 'INELIGIBLE';
        reason = `Subtotal ₹${subtotal} is below minimum order requirement of ₹${coupon.minimum_order}.`;
      } else {
        // 2. Calculate potential discount
        if (coupon.type === 'percentage') {
          calculatedDiscount = Math.floor((subtotal * coupon.value) / 100);
          if (coupon.max_discount && calculatedDiscount > coupon.max_discount) {
            calculatedDiscount = coupon.max_discount;
          }
          effectivePercent = coupon.value;
        } else if (coupon.type === 'flat') {
          calculatedDiscount = Math.min(coupon.value, subtotal);
          effectivePercent = subtotal > 0 ? (calculatedDiscount / subtotal) * 100 : 0;
        }

        // 3. Merchant Policy Check: Max Discount Percentage
        if (effectivePercent > maxDiscountPercent) {
          isEligible = false;
          status = 'BLOCKED';
          reason = `Discount of ${effectivePercent.toFixed(1)}% breaches merchant maximum discount policy of ${maxDiscountPercent}%.`;
        } else {
          reason = `Eligible for ₹${calculatedDiscount} savings (${coupon.type === 'percentage' ? `${coupon.value}% off` : `Flat ₹${coupon.value}`}). Satisfies ${maxDiscountPercent}% policy cap.`;
        }
      }

      evaluated.push({
        coupon_id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minimum_order: coupon.minimum_order,
        max_discount: coupon.max_discount,
        calculated_discount: calculatedDiscount,
        effective_percent: Math.round(effectivePercent * 10) / 10,
        status,
        eligible: isEligible,
        reason
      });
    }

    // Filter valid and find best customer savings
    const validCoupons = evaluated.filter(c => c.eligible && c.calculated_discount > 0);
    validCoupons.sort((a, b) => b.calculated_discount - a.calculated_discount);

    const bestCoupon = validCoupons.length > 0 ? validCoupons[0] : null;
    const finalDiscount = bestCoupon ? bestCoupon.calculated_discount : 0;

    let explanation = '';
    if (bestCoupon) {
      explanation = `Selected ${bestCoupon.code} saving ₹${finalDiscount}. Out of ${evaluated.length} evaluated coupons, this provides maximum customer savings while strictly complying with the ${maxDiscountPercent}% merchant discount ceiling.`;
    } else {
      explanation = `No eligible coupons met the minimum order or policy constraints (merchant ceiling: ${maxDiscountPercent}%).`;
    }

    // Write to AI Action Ledger
    const sessionId = options.sessionId || 'session_cart';
    const orderId = options.orderId || null;

    db.addAiAction({
      order_id: orderId,
      session_id: sessionId,
      action_type: 'COUPON_EVALUATED',
      status: 'SUCCESS',
      reason: `Evaluated ${evaluated.length} coupons against ₹${subtotal} subtotal and ${maxDiscountPercent}% merchant policy.`,
      confidence: 1.0,
      input_summary: `Subtotal: ₹${subtotal}, Evaluated: ${evaluated.map(c => `${c.code}(${c.status})`).join(', ')}`,
      output_summary: bestCoupon ? `Optimal: ${bestCoupon.code} saving ₹${finalDiscount}` : 'No valid coupon',
      evidence: evaluated.map(c => `${c.code}: status=${c.status}, discount=₹${c.calculated_discount}`).join(' | '),
      policy_checks: {
        max_discount_percent: maxDiscountPercent,
        results: evaluated.map(c => ({ code: c.code, status: c.status, reason: c.reason }))
      }
    });

    if (bestCoupon) {
      db.addAiAction({
        order_id: orderId,
        session_id: sessionId,
        action_type: 'COUPON_SELECTED',
        status: 'SUCCESS',
        reason: explanation,
        confidence: 1.0,
        input_summary: `Best coupon applied: ${bestCoupon.code}`,
        output_summary: `Total savings: ₹${finalDiscount}. Final cart amount: ₹${subtotal - finalDiscount}`,
        evidence: `Customer savings maximized deterministically under policy constraint.`,
        policy_checks: { discount_within_policy: true, applied_discount: finalDiscount }
      });
    }

    return {
      evaluated,
      bestCoupon,
      discountAmount: finalDiscount,
      finalAmount: Math.max(0, subtotal - finalDiscount),
      explanation
    };
  }
}

module.exports = CouponOptimizer;
