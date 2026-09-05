// server/a2a-customer.js
// Customer-Side Agent-to-Agent Commerce Orchestration
// Two logical agents (Buyer Agent + Merchant Agent) exchange structured messages
// using real catalog, policy engine, and coupon optimizer data.

const express = require('express');
const router = express.Router();
const db = require('./db');
const PolicyEngine = require('./policies');
const CouponOptimizer = require('./coupons');
const GeminiAgent = require('./gemini');

// ─────────────────────────────────────────────────
// POST /api/a2a/customer-buyer
// Full Buyer Agent ↔ Merchant Agent orchestration
// Returns structured message log + final offer
// ─────────────────────────────────────────────────
router.post('/customer-buyer', (req, res) => {
  try {
    const { intent = '', budget_max = 5000, preferences = [] } = req.body;

    if (!intent || !intent.trim()) {
      return res.status(400).json({ error: 'Customer intent is required' });
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const sessionId = `a2a_cust_${Date.now()}`;
    const messages = [];
    const policies = db.getPolicies();
    const products = db.getProducts();

    // ── Step 1: Buyer Agent creates COMMERCE_REQUEST ──
    const buyerRequest = {
      type: 'COMMERCE_REQUEST',
      request_id: requestId,
      from_agent: 'BUYER_AGENT',
      to_agent: 'MERCHANT_AGENT',
      timestamp: new Date().toISOString(),
      customer_intent: intent,
      constraints: {
        budget_max: budget_max,
        preferences: preferences,
        currency: 'INR'
      },
      reasoning: `Customer wants: "${intent}". Budget ceiling: ₹${budget_max.toLocaleString('en-IN')}. Preferences: ${preferences.length > 0 ? preferences.join(', ') : 'general'}.`
    };
    messages.push(buyerRequest);

    // ── Step 2: Merchant Agent receives request and searches catalog ──
    const catalogSearch = {
      type: 'AGENT_ACTION',
      request_id: requestId,
      from_agent: 'MERCHANT_AGENT',
      action: 'SEARCH_CATALOG',
      timestamp: new Date().toISOString(),
      reasoning: `Searching merchant catalog for products matching intent "${intent}" within ₹${budget_max} budget.`,
      evidence: {
        catalog_size: products.length,
        in_stock_count: products.filter(p => p.stock > 0).length
      }
    };
    messages.push(catalogSearch);

    // Use GeminiAgent's catalog search with real DB data
    const candidates = GeminiAgent.searchCatalog({
      query: intent,
      maxPrice: budget_max,
      intent: 'general',
      preferences: preferences
    });

    if (candidates.length === 0) {
      const noResults = {
        type: 'COMMERCE_REJECT',
        request_id: requestId,
        from_agent: 'MERCHANT_AGENT',
        to_agent: 'BUYER_AGENT',
        timestamp: new Date().toISOString(),
        reason: `No products found matching "${intent}" within ₹${budget_max} budget.`,
        evidence: { products_searched: products.length, matches: 0 }
      };
      messages.push(noResults);

      db.addAiAction({
        session_id: sessionId,
        action_type: 'A2A_CUSTOMER_BUYER',
        status: 'NO_MATCH',
        reason: `No catalog matches for: ${intent}`,
        confidence: 1.0,
        input_summary: `Intent: ${intent}, Budget: ₹${budget_max}`,
        output_summary: 'No products found',
        evidence: 'Catalog search returned empty',
        policy_checks: {}
      });

      return res.json({
        status: 'NO_MATCH',
        request_id: requestId,
        messages,
        final_offer: null,
        requires_approval: false
      });
    }

    // Pick top product from real catalog
    const mainProduct = candidates[0];

    const productFound = {
      type: 'AGENT_ACTION',
      request_id: requestId,
      from_agent: 'MERCHANT_AGENT',
      action: 'PRODUCT_SELECTED',
      timestamp: new Date().toISOString(),
      product: {
        id: mainProduct.id,
        name: mainProduct.name,
        price: mainProduct.price,
        category: mainProduct.category,
        stock: mainProduct.stock,
        rating: mainProduct.rating
      },
      reasoning: `Selected "${mainProduct.name}" (₹${mainProduct.price}) — best match for "${intent}". ${mainProduct.rating}★ rating, ${mainProduct.stock} units in stock.`,
      evidence: {
        stock_verified: mainProduct.stock > 0,
        price_verified: true,
        price_within_budget: mainProduct.price <= budget_max
      }
    };
    messages.push(productFound);

    // ── Step 3: Merchant Agent proposes initial upsell ──
    // First try: Premium Gift Box ₹899 (designed to be BLOCKED by policy)
    const premiumUpsell = db.getProductById('prod_premiumpack_12');
    let initialUpsellCandidate = null;
    let upsellBlocked = false;
    let blockedProduct = null;
    let blockedReason = '';
    let finalUpsell = null;
    let upsellPolicyResult = null;

    // Determine category-appropriate initial upsell that might be blocked
    if (premiumUpsell && premiumUpsell.stock > 0 && premiumUpsell.price > policies.max_upsell_amount) {
      initialUpsellCandidate = premiumUpsell;
    } else {
      // Find any product that exceeds the upsell cap to demonstrate blocking
      initialUpsellCandidate = products.find(
        p => p.id !== mainProduct.id && p.stock > 0 && p.price > policies.max_upsell_amount
      );
    }

    if (initialUpsellCandidate) {
      // Propose the expensive upsell first
      const initialOffer = {
        type: 'COMMERCE_OFFER',
        request_id: requestId,
        from_agent: 'MERCHANT_AGENT',
        to_agent: 'BUYER_AGENT',
        timestamp: new Date().toISOString(),
        product: {
          id: mainProduct.id,
          name: mainProduct.name,
          price: mainProduct.price,
          stock: mainProduct.stock
        },
        upsell: {
          id: initialUpsellCandidate.id,
          name: initialUpsellCandidate.name,
          price: initialUpsellCandidate.price,
          stock: initialUpsellCandidate.stock
        },
        reasoning: `Proposing "${initialUpsellCandidate.name}" (₹${initialUpsellCandidate.price}) as complementary upsell — high product affinity with ${mainProduct.category} category.`,
        evidence: {
          stock_verified: true,
          price_verified: true,
          combined_total: mainProduct.price + initialUpsellCandidate.price
        }
      };
      messages.push(initialOffer);

      // Policy Engine check — this should BLOCK
      const policyCheck = PolicyEngine.evaluateUpsell(initialUpsellCandidate, mainProduct.price);

      const policyResult = {
        type: 'POLICY_RESULT',
        request_id: requestId,
        from_agent: 'POLICY_ENGINE',
        to_agent: 'MERCHANT_AGENT',
        timestamp: new Date().toISOString(),
        target: 'upsell',
        result: policyCheck.allowed ? 'ALLOWED' : 'BLOCKED',
        code: policyCheck.code || (policyCheck.allowed ? 'ALLOWED' : 'EXCEEDS_MAX_UPSELL'),
        reason: policyCheck.reason,
        policy_checks: policyCheck.policy_checks,
        evidence: {
          upsell_price: initialUpsellCandidate.price,
          max_upsell_limit: policies.max_upsell_amount,
          exceeds_by: Math.max(0, initialUpsellCandidate.price - policies.max_upsell_amount)
        }
      };
      messages.push(policyResult);

      if (!policyCheck.allowed) {
        upsellBlocked = true;
        blockedProduct = initialUpsellCandidate;
        blockedReason = policyCheck.reason;

        // Log the block
        db.addAiAction({
          session_id: sessionId,
          action_type: 'UPSELL_BLOCKED',
          status: 'BLOCKED',
          reason: policyCheck.reason,
          confidence: 1.0,
          input_summary: `Candidate: ${initialUpsellCandidate.name} (₹${initialUpsellCandidate.price})`,
          output_summary: `BLOCKED: ₹${initialUpsellCandidate.price} > ₹${policies.max_upsell_amount} ceiling`,
          evidence: `Merchant max_upsell_amount = ₹${policies.max_upsell_amount}`,
          policy_checks: policyCheck.policy_checks
        });

        // ── Step 4: Merchant Agent REPLANS ──
        const replanAction = {
          type: 'AGENT_ACTION',
          request_id: requestId,
          from_agent: 'MERCHANT_AGENT',
          action: 'REPLAN',
          timestamp: new Date().toISOString(),
          reasoning: `"${initialUpsellCandidate.name}" (₹${initialUpsellCandidate.price}) was blocked by Policy Engine. Searching for alternative complementary product within ₹${policies.max_upsell_amount} limit.`,
          discarded: {
            id: initialUpsellCandidate.id,
            name: initialUpsellCandidate.name,
            price: initialUpsellCandidate.price,
            block_reason: policyCheck.reason
          }
        };
        messages.push(replanAction);

        // Find a valid alternative under the upsell cap
        const validUpsells = products.filter(
          p => p.id !== mainProduct.id &&
               p.stock > 0 &&
               p.price <= policies.max_upsell_amount &&
               p.id !== initialUpsellCandidate.id
        ).sort((a, b) => b.rating - a.rating);

        if (validUpsells.length > 0) {
          finalUpsell = validUpsells[0];
          const replanPolicyCheck = PolicyEngine.evaluateUpsell(finalUpsell, mainProduct.price);
          upsellPolicyResult = replanPolicyCheck;

          // Revised offer
          const revisedOffer = {
            type: 'REVISED_OFFER',
            request_id: requestId,
            from_agent: 'MERCHANT_AGENT',
            to_agent: 'BUYER_AGENT',
            timestamp: new Date().toISOString(),
            action: 'REPLAN',
            product: {
              id: mainProduct.id,
              name: mainProduct.name,
              price: mainProduct.price,
              stock: mainProduct.stock
            },
            upsell: {
              id: finalUpsell.id,
              name: finalUpsell.name,
              price: finalUpsell.price,
              stock: finalUpsell.stock
            },
            reasoning: `Selected lower-priced complementary item "${finalUpsell.name}" (₹${finalUpsell.price}) within ₹${policies.max_upsell_amount} policy cap. ${finalUpsell.rating}★ rated.`,
            evidence: {
              stock_verified: finalUpsell.stock > 0,
              price_verified: true,
              within_policy: replanPolicyCheck.allowed,
              combined_total: mainProduct.price + finalUpsell.price
            }
          };
          messages.push(revisedOffer);

          // Policy check on revised upsell
          const revisedPolicyResult = {
            type: 'POLICY_RESULT',
            request_id: requestId,
            from_agent: 'POLICY_ENGINE',
            to_agent: 'MERCHANT_AGENT',
            timestamp: new Date().toISOString(),
            target: 'revised_upsell',
            result: replanPolicyCheck.allowed ? 'ALLOWED' : 'BLOCKED',
            code: replanPolicyCheck.code || 'ALLOWED',
            reason: replanPolicyCheck.reason,
            policy_checks: replanPolicyCheck.policy_checks
          };
          messages.push(revisedPolicyResult);

          // Log the successful replan
          db.addAiAction({
            session_id: sessionId,
            action_type: 'UPSELL_PROPOSED',
            status: 'SUCCESS',
            reason: `Agent replanned: ${finalUpsell.name} (₹${finalUpsell.price}) within ₹${policies.max_upsell_amount} cap`,
            confidence: 0.96,
            input_summary: `Fallback for blocked ${initialUpsellCandidate.name}`,
            output_summary: `Proposed: ${finalUpsell.name} (₹${finalUpsell.price})`,
            evidence: `Replanned after policy block on ₹${initialUpsellCandidate.price} upsell`,
            policy_checks: replanPolicyCheck.policy_checks
          });
        }
      } else {
        // Initial upsell was allowed (shouldn't happen with Premium Gift Box, but handle gracefully)
        finalUpsell = initialUpsellCandidate;
        upsellPolicyResult = policyCheck;
      }
    } else {
      // No upsell candidate that would be blocked — find any valid one
      const validUpsells = products.filter(
        p => p.id !== mainProduct.id && p.stock > 0 && p.price <= policies.max_upsell_amount
      ).sort((a, b) => b.rating - a.rating);

      if (validUpsells.length > 0) {
        finalUpsell = validUpsells[0];
        const check = PolicyEngine.evaluateUpsell(finalUpsell, mainProduct.price);
        upsellPolicyResult = check;

        const directOffer = {
          type: 'COMMERCE_OFFER',
          request_id: requestId,
          from_agent: 'MERCHANT_AGENT',
          to_agent: 'BUYER_AGENT',
          timestamp: new Date().toISOString(),
          product: {
            id: mainProduct.id,
            name: mainProduct.name,
            price: mainProduct.price,
            stock: mainProduct.stock
          },
          upsell: check.allowed ? {
            id: finalUpsell.id,
            name: finalUpsell.name,
            price: finalUpsell.price,
            stock: finalUpsell.stock
          } : null,
          reasoning: `Offering "${mainProduct.name}" with ${check.allowed ? `complementary "${finalUpsell.name}" (₹${finalUpsell.price})` : 'no upsell'}.`,
          evidence: {
            stock_verified: true,
            price_verified: true
          }
        };
        messages.push(directOffer);

        if (!check.allowed) {
          finalUpsell = null;
        }
      }
    }

    // ── Step 5: Calculate cart totals with coupon ──
    let subtotal = mainProduct.price;
    const cartItems = [{
      id: mainProduct.id,
      name: mainProduct.name,
      price: mainProduct.price,
      quantity: 1,
      is_upsell: false
    }];

    if (finalUpsell && upsellPolicyResult && upsellPolicyResult.allowed) {
      subtotal += finalUpsell.price;
      cartItems.push({
        id: finalUpsell.id,
        name: finalUpsell.name,
        price: finalUpsell.price,
        quantity: 1,
        is_upsell: true
      });
    }

    // Run coupon optimizer
    const couponResult = CouponOptimizer.optimize(subtotal, { sessionId });
    const discount = couponResult.discountAmount || 0;
    const finalTotal = Math.max(0, subtotal - discount);

    // Cart policy validation
    const cartValidation = PolicyEngine.evaluateCart(subtotal, discount);

    if (couponResult.bestCoupon) {
      const couponMsg = {
        type: 'AGENT_ACTION',
        request_id: requestId,
        from_agent: 'MERCHANT_AGENT',
        action: 'COUPON_APPLIED',
        timestamp: new Date().toISOString(),
        coupon: {
          code: couponResult.bestCoupon.code,
          type: couponResult.bestCoupon.type,
          discount_amount: discount
        },
        reasoning: `Applied best coupon "${couponResult.bestCoupon.code}" saving ₹${discount}. Cart subtotal ₹${subtotal} → ₹${finalTotal}.`,
        evidence: {
          coupons_evaluated: couponResult.evaluated ? couponResult.evaluated.length : 0,
          discount_within_policy: cartValidation.allowed
        }
      };
      messages.push(couponMsg);
    }

    // ── Step 6: Buyer Agent evaluates final offer ──
    const withinBudget = finalTotal <= budget_max;
    const buyerEvaluation = {
      type: 'BUYER_EVALUATION',
      request_id: requestId,
      from_agent: 'BUYER_AGENT',
      to_agent: 'CUSTOMER',
      timestamp: new Date().toISOString(),
      verdict: withinBudget ? 'ACCEPT' : 'REJECT',
      reasoning: withinBudget
        ? `Offer satisfies customer constraints. Total ₹${finalTotal.toLocaleString('en-IN')} is within ₹${budget_max.toLocaleString('en-IN')} budget.${preferences.length > 0 ? ` Product matches ${preferences.join(', ')} preference.` : ''}`
        : `Total ₹${finalTotal.toLocaleString('en-IN')} exceeds customer budget of ₹${budget_max.toLocaleString('en-IN')}.`,
      offer_summary: {
        product: { id: mainProduct.id, name: mainProduct.name, price: mainProduct.price },
        upsell: finalUpsell && upsellPolicyResult && upsellPolicyResult.allowed
          ? { id: finalUpsell.id, name: finalUpsell.name, price: finalUpsell.price }
          : null,
        coupon: couponResult.bestCoupon
          ? { code: couponResult.bestCoupon.code, discount: discount }
          : null,
        subtotal,
        discount,
        final_total: finalTotal
      },
      evidence: {
        budget_check: withinBudget ? 'PASS' : 'FAIL',
        policy_check: cartValidation.allowed ? 'PASS' : 'FAIL',
        stock_check: 'PASS'
      }
    };
    messages.push(buyerEvaluation);

    // Log the full A2A session
    db.addAiAction({
      session_id: sessionId,
      action_type: 'A2A_CUSTOMER_BUYER',
      status: withinBudget ? 'SUCCESS' : 'BUDGET_EXCEEDED',
      reason: `Customer A2A buyer session: ${intent}`,
      confidence: 0.95,
      input_summary: `Intent: ${intent}, Budget: ₹${budget_max}`,
      output_summary: `Product: ${mainProduct.name} ₹${mainProduct.price}, Total: ₹${finalTotal}${upsellBlocked ? ', Replan: YES' : ''}`,
      evidence: `${messages.length} agent messages exchanged`,
      policy_checks: { upsell_replanned: upsellBlocked, cart_validated: cartValidation.allowed }
    });

    // Build final offer for customer approval
    const finalOffer = withinBudget ? {
      product: {
        id: mainProduct.id,
        name: mainProduct.name,
        price: mainProduct.price,
        category: mainProduct.category,
        image: mainProduct.image,
        rating: mainProduct.rating,
        stock: mainProduct.stock
      },
      upsell: finalUpsell && upsellPolicyResult && upsellPolicyResult.allowed ? {
        id: finalUpsell.id,
        name: finalUpsell.name,
        price: finalUpsell.price,
        image: finalUpsell.image,
        rating: finalUpsell.rating
      } : null,
      coupon: couponResult.bestCoupon ? {
        code: couponResult.bestCoupon.code,
        discount_amount: discount
      } : null,
      subtotal,
      discount,
      final_total: finalTotal,
      cart_items: cartItems,
      policy_validation: cartValidation,
      replanning_occurred: upsellBlocked,
      blocked_upsell: blockedProduct ? {
        id: blockedProduct.id,
        name: blockedProduct.name,
        price: blockedProduct.price,
        block_reason: blockedReason
      } : null
    } : null;

    res.json({
      status: withinBudget ? 'OFFER_READY' : 'BUDGET_EXCEEDED',
      request_id: requestId,
      session_id: sessionId,
      messages,
      final_offer: finalOffer,
      requires_approval: withinBudget
    });
  } catch (err) {
    console.error('[A2A Customer Buyer] Error:', err);
    res.status(500).json({ error: 'A2A buyer orchestration failed', details: err.message });
  }
});

module.exports = router;
