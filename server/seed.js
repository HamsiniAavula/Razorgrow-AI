// server/seed.js
// Pre-seeded realistic data for RazorGrow AI

const seedProducts = [
  {
    id: "prod_watch_01",
    name: "Classic Watch",
    description: "Timeless analog watch with genuine leather strap, sapphire crystal glass, and Japanese quartz movement.",
    category: "Watches",
    price: 2499,
    stock: 24,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    margin: 0.42,
    active: true
  },
  {
    id: "prod_earbuds_02",
    name: "Wireless Earbuds",
    description: "Active noise-cancelling Bluetooth 5.3 earbuds with 36hr battery life and sweat-proof design.",
    category: "Audio",
    price: 1999,
    stock: 45,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    margin: 0.38,
    active: true
  },
  {
    id: "prod_wallet_03",
    name: "Leather Wallet",
    description: "Handcrafted full-grain bi-fold leather wallet with RFID blocking and 8 card slots.",
    category: "Accessories",
    price: 1299,
    stock: 32,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    margin: 0.45,
    active: true
  },
  {
    id: "prod_giftbox_04",
    name: "Gift Packaging",
    description: "Eco-friendly luxury satin gift wrap with custom handwritten greeting card and embossed ribbon.",
    category: "Gifts",
    price: 199,
    stock: 150,
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    margin: 0.65,
    active: true
  },
  {
    id: "prod_socks_05",
    name: "Performance Socks",
    description: "Anti-blister seamless merino-blend athletic socks with arch compression.",
    category: "Apparel",
    price: 399,
    stock: 80,
    image: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=600&q=80",
    rating: 4.5,
    margin: 0.55,
    active: true
  },
  {
    id: "prod_shoes_06",
    name: "Running Shoes",
    description: "Responsive carbon-infused foam running shoes engineered for daily training and distance races.",
    category: "Footwear",
    price: 2999,
    stock: 18,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    margin: 0.40,
    active: true
  },
  {
    id: "prod_mouse_07",
    name: "Wireless Mouse",
    description: "Ergonomic multi-device silent optical wireless mouse with rechargeable battery.",
    category: "Electronics",
    price: 799,
    stock: 50,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80",
    rating: 4.4,
    margin: 0.35,
    active: true
  },
  {
    id: "prod_laptop_08",
    name: "Laptop",
    description: "Ultra-slim 14-inch IPS display laptop with fast SSD storage, 8-core CPU, and backlit keyboard.",
    category: "Electronics",
    price: 4999,
    stock: 10,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    margin: 0.25,
    active: true
  },
  {
    id: "prod_sunscreen_09",
    name: "Sunscreen",
    description: "Broad spectrum SPF 50 PA++++ matte finish lightweight sunscreen with niacinamide and zinc oxide.",
    category: "Beauty",
    price: 599,
    stock: 65,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    margin: 0.50,
    active: true
  },
  {
    id: "prod_skincare_10",
    name: "Skincare Kit",
    description: "Complete 3-step restorative skincare routine: gentle hydra-cleanser, balancing toner, and ceramide cream.",
    category: "Beauty",
    price: 1499,
    stock: 28,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    margin: 0.48,
    active: true
  },
  {
    id: "prod_backpack_11",
    name: "Backpack",
    description: "Water-resistant commuter backpack with dedicated 15.6-inch laptop compartment and hidden anti-theft pocket.",
    category: "Bags",
    price: 1799,
    stock: 30,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    rating: 4.5,
    margin: 0.36,
    active: true
  },
  {
    id: "prod_premiumpack_12",
    name: "Premium Gift Box",
    description: "Handcrafted velvet-lined wooden keepsake box with embossed brass clasp and magnetic closure.",
    category: "Gifts",
    price: 899,
    stock: 15,
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    margin: 0.60,
    active: true
  }
];

const seedCoupons = [
  {
    id: "coup_save10",
    code: "SAVE10",
    type: "percentage",
    value: 10,
    minimum_order: 1000,
    max_discount: 500,
    eligible_categories: ["*"],
    active: true,
    expires_at: "2027-12-31T23:59:59Z",
    description: "10% off on orders above ₹1000 (up to ₹500)"
  },
  {
    id: "coup_flat300",
    code: "FLAT300",
    type: "flat",
    value: 300,
    minimum_order: 2500,
    max_discount: 300,
    eligible_categories: ["*"],
    active: true,
    expires_at: "2027-12-31T23:59:59Z",
    description: "Flat ₹300 off on orders above ₹2500"
  },
  {
    id: "coup_welcome15",
    code: "WELCOME15",
    type: "percentage",
    value: 15,
    minimum_order: 500,
    max_discount: 600,
    eligible_categories: ["*"],
    active: true,
    expires_at: "2027-12-31T23:59:59Z",
    description: "15% off for new customers (exceeds merchant 10% policy cap)"
  }
];

const seedPolicies = {
  id: "policy_default",
  merchant_id: "merchant_acme",
  merchant_name: "Acme Commerce",
  max_transaction_amount: 5000,
  max_upsell_amount: 500,
  max_discount_percent: 10,
  customer_approval_required: true,
  allow_out_of_stock: false,
  allow_auto_refund: false,
  updated_at: new Date().toISOString()
};

const seedOpportunities = [
  {
    id: "opp_shoes_socks",
    product_id: "prod_shoes_06",
    product_name: "Running Shoes",
    recommended_product_id: "prod_socks_05",
    recommended_product_name: "Performance Socks",
    upsell_price: 399,
    reason: "High co-purchase affinity. Runners consistently bundle moisture-wicking anti-blister socks.",
    current_attachment_rate: 12,
    benchmark_attachment_rate: 27,
    estimated_monthly_revenue: 38400,
    status: "ACTIVE", // can be ACTIVE, PENDING, or PAUSED
    activated_at: "2026-09-01T10:00:00Z"
  },
  {
    id: "opp_laptop_mouse",
    product_id: "prod_laptop_08",
    product_name: "Laptop",
    recommended_product_id: "prod_mouse_07",
    recommended_product_name: "Wireless Mouse",
    upsell_price: 799,
    reason: "78% of laptop buyers purchase an external wireless mouse within 14 days of acquisition.",
    current_attachment_rate: 9,
    benchmark_attachment_rate: 34,
    estimated_monthly_revenue: 21600,
    status: "PENDING_ACTIVATION",
    activated_at: null
  },
  {
    id: "opp_skincare_sunscreen",
    product_id: "prod_skincare_10",
    product_name: "Skincare Kit",
    recommended_product_id: "prod_sunscreen_09",
    recommended_product_name: "Sunscreen",
    upsell_price: 599,
    reason: "Dermatological bundle pairing. Daily SPF recommendation increases routine retention by 62%.",
    current_attachment_rate: 15,
    benchmark_attachment_rate: 38,
    estimated_monthly_revenue: 17200,
    status: "PENDING_ACTIVATION",
    activated_at: null
  },
  {
    id: "opp_watch_giftbox",
    product_id: "prod_watch_01",
    product_name: "Classic Watch",
    recommended_product_id: "prod_giftbox_04",
    recommended_product_name: "Gift Packaging",
    upsell_price: 199,
    reason: "42% of classic watch orders are purchased as gifts for anniversaries and birthdays.",
    current_attachment_rate: 19,
    benchmark_attachment_rate: 42,
    estimated_monthly_revenue: 14800,
    status: "ACTIVE",
    activated_at: "2026-09-02T14:15:00Z"
  },
  {
    id: "opp_backpack_wallet",
    product_id: "prod_backpack_11",
    product_name: "Backpack",
    recommended_product_id: "prod_wallet_03",
    recommended_product_name: "Leather Wallet",
    upsell_price: 1299,
    reason: "Travel everyday carry pairing. Bundling essentials drives higher cart sizes for professionals.",
    current_attachment_rate: 8,
    benchmark_attachment_rate: 22,
    estimated_monthly_revenue: 16500,
    status: "PENDING_ACTIVATION",
    activated_at: null
  },
  {
    id: "opp_earbuds_packaging",
    product_id: "prod_earbuds_02",
    product_name: "Wireless Earbuds",
    recommended_product_id: "prod_giftbox_04",
    recommended_product_name: "Gift Packaging",
    upsell_price: 199,
    reason: "Popular holiday and graduation gift choice with rapid impulse attachment rate.",
    current_attachment_rate: 14,
    benchmark_attachment_rate: 31,
    estimated_monthly_revenue: 9800,
    status: "ACTIVE",
    activated_at: "2026-09-03T11:20:00Z"
  },
  {
    id: "opp_mouse_packaging",
    product_id: "prod_mouse_07",
    product_name: "Wireless Mouse",
    recommended_product_id: "prod_socks_05",
    recommended_product_name: "Performance Socks",
    upsell_price: 399,
    reason: "Seasonal lifestyle bundle promotion.",
    current_attachment_rate: 5,
    benchmark_attachment_rate: 16,
    estimated_monthly_revenue: 8100,
    status: "PENDING_ACTIVATION",
    activated_at: null
  }
];

const seedCustomer = {
  id: "cust_demo_01",
  name: "Arjun Verma",
  email: "arjun.verma@example.com",
  phone: "+919876543210",
  preferences: {
    favorite_categories: ["Watches", "Footwear", "Electronics"],
    budget_range: "₹2000 - ₹5000"
  },
  purchase_history: [
    {
      order_id: "ord_hist_99",
      date: "2026-08-15",
      product: "Wireless Earbuds",
      amount: 1999
    }
  ]
};

// Seed historical orders to match prompt KPI requirements:
// Total Revenue: ₹8,42,350
// AI-attributed revenue: ₹1,26,400
// AOV: ₹2,174
// AI upsell rate: 18.6%
// Successful orders: 428
// Active opportunities: 7
const seedOrders = [
  {
    id: "ord_demo_1024",
    customer_id: "cust_demo_01",
    customer_name: "Arjun Verma",
    items: [
      { id: "prod_watch_01", name: "Classic Watch", price: 2499, quantity: 1, is_upsell: false },
      { id: "prod_giftbox_04", name: "Gift Packaging", price: 199, quantity: 1, is_upsell: true }
    ],
    subtotal: 2698,
    upsell_amount: 199,
    discount: 269,
    coupon_code: "SAVE10",
    total: 2429,
    status: "PAID",
    razorpay_order_id: "order_test_demo1024",
    razorpay_payment_id: "pay_test_capt_1024",
    ai_influenced: true,
    ai_attributed_revenue: 2429,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "ord_demo_1023",
    customer_id: "cust_demo_02",
    customer_name: "Priya Sharma",
    items: [
      { id: "prod_shoes_06", name: "Running Shoes", price: 2999, quantity: 1, is_upsell: false },
      { id: "prod_socks_05", name: "Performance Socks", price: 399, quantity: 1, is_upsell: true }
    ],
    subtotal: 3398,
    upsell_amount: 399,
    discount: 300,
    coupon_code: "FLAT300",
    total: 3098,
    status: "PAID",
    razorpay_order_id: "order_test_demo1023",
    razorpay_payment_id: "pay_test_capt_1023",
    ai_influenced: true,
    ai_attributed_revenue: 3098,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "ord_demo_1022",
    customer_id: "cust_demo_03",
    customer_name: "Vikram Mehta",
    items: [
      { id: "prod_skincare_10", name: "Skincare Kit", price: 1499, quantity: 1, is_upsell: false }
    ],
    subtotal: 1499,
    upsell_amount: 0,
    discount: 149,
    coupon_code: "SAVE10",
    total: 1350,
    status: "PAYMENT_FAILED",
    razorpay_order_id: "order_test_demo1022",
    razorpay_payment_id: "pay_test_fail_1022",
    ai_influenced: true,
    ai_attributed_revenue: 0, // MUST BE 0 on payment failure
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: "ord_demo_1021",
    customer_id: "cust_demo_04",
    customer_name: "Sneha Patel",
    items: [
      { id: "prod_earbuds_02", name: "Wireless Earbuds", price: 1999, quantity: 1, is_upsell: false },
      { id: "prod_giftbox_04", name: "Gift Packaging", price: 199, quantity: 1, is_upsell: true }
    ],
    subtotal: 2198,
    upsell_amount: 199,
    discount: 219,
    coupon_code: "SAVE10",
    total: 1979,
    status: "PAID",
    razorpay_order_id: "order_test_demo1021",
    razorpay_payment_id: "pay_test_capt_1021",
    ai_influenced: true,
    ai_attributed_revenue: 1979,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

const seedAiActions = [
  {
    id: "act_1001",
    order_id: "ord_demo_1024",
    session_id: "sess_demo_1024",
    action_type: "INTENT_DETECTED",
    status: "SUCCESS",
    reason: "Customer expressed need for birthday gift under ₹3000.",
    confidence: 0.94,
    input_summary: "I need a birthday gift for my brother under ₹3000.",
    output_summary: "Intent: GIFT_PURCHASE, Category: Watches/Accessories, Budget: ₹3000",
    evidence: "Query matched birthday gift intent; extracted budget constraint ₹3000.",
    policy_checks: { budget_respected: true },
    timestamp: new Date(Date.now() - 3600000 * 2 - 60000 * 15).toISOString()
  },
  {
    id: "act_1002",
    order_id: "ord_demo_1024",
    session_id: "sess_demo_1024",
    action_type: "PRODUCT_RECOMMENDED",
    status: "SUCCESS",
    reason: "Classic Watch matches gift intent and fits under ₹3000 budget with 4.8★ rating.",
    confidence: 0.96,
    input_summary: "Catalog search: price <= 3000, category in ['Watches', 'Accessories']",
    output_summary: "Recommended: Classic Watch (₹2499, Stock: 24)",
    evidence: "Database stock verified: 24 units. Margin: 42%.",
    policy_checks: { stock_available: true, price_within_bounds: true },
    timestamp: new Date(Date.now() - 3600000 * 2 - 60000 * 14).toISOString()
  },
  {
    id: "act_1003",
    order_id: "ord_demo_1024",
    session_id: "sess_demo_1024",
    action_type: "UPSELL_BLOCKED",
    status: "BLOCKED",
    reason: "Premium Gift Box (₹899) exceeds merchant maximum upsell policy limit of ₹500.",
    confidence: 0.98,
    input_summary: "Complementary candidate: Premium Gift Box (₹899)",
    output_summary: "Action BLOCKED: ₹899 > ₹500 merchant policy ceiling.",
    evidence: "Policy check: max_upsell_amount = ₹500. Proposed upsell = ₹899.",
    policy_checks: { max_upsell_allowed: 500, proposed_price: 899, result: "FAIL" },
    timestamp: new Date(Date.now() - 3600000 * 2 - 60000 * 12).toISOString()
  },
  {
    id: "act_1004",
    order_id: "ord_demo_1024",
    session_id: "sess_demo_1024",
    action_type: "UPSELL_PROPOSED",
    status: "SUCCESS",
    reason: "Agent re-planning selected valid alternative Gift Packaging (₹199). Complies with ₹500 cap.",
    confidence: 0.95,
    input_summary: "Fallback candidate search: gifts <= ₹500",
    output_summary: "Proposed: Gift Packaging (₹199) with 42% benchmark attachment rate.",
    evidence: "Historical attachment rate: 42% for watch gift purchases.",
    policy_checks: { max_upsell_allowed: 500, proposed_price: 199, result: "PASS" },
    timestamp: new Date(Date.now() - 3600000 * 2 - 60000 * 11).toISOString()
  },
  {
    id: "act_1005",
    order_id: "ord_demo_1024",
    session_id: "sess_demo_1024",
    action_type: "CUSTOMER_APPROVED",
    status: "SUCCESS",
    reason: "Customer explicitly clicked 'Yes, add it' for Gift Packaging (₹199).",
    confidence: 1.0,
    input_summary: "Customer authorization button click: TRUE",
    output_summary: "Upsell authorized by customer. Proceeding to cart modification.",
    evidence: "Customer consent timestamp recorded. Merchant policy rule enforced.",
    policy_checks: { customer_approval_required: true, customer_approved: true },
    timestamp: new Date(Date.now() - 3600000 * 2 - 60000 * 9).toISOString()
  },
  {
    id: "act_1006",
    order_id: "ord_demo_1024",
    session_id: "sess_demo_1024",
    action_type: "CART_UPDATED",
    status: "SUCCESS",
    reason: "Classic Watch (₹2499) and Gift Packaging (₹199) bundled into cart. Subtotal: ₹2698.",
    confidence: 1.0,
    input_summary: "Items: prod_watch_01, prod_giftbox_04",
    output_summary: "Cart subtotal calculated deterministically: ₹2698.",
    evidence: "DB verified item prices: ₹2499 + ₹199 = ₹2698.",
    policy_checks: { max_transaction_limit: 5000, current_subtotal: 2698, result: "PASS" },
    timestamp: new Date(Date.now() - 3600000 * 2 - 60000 * 8).toISOString()
  },
  {
    id: "act_1007",
    order_id: "ord_demo_1024",
    session_id: "sess_demo_1024",
    action_type: "COUPON_EVALUATED",
    status: "SUCCESS",
    reason: "Evaluated SAVE10, FLAT300, and WELCOME15 against merchant 10% maximum discount policy.",
    confidence: 1.0,
    input_summary: "Coupons: SAVE10 (10%), FLAT300 (₹300), WELCOME15 (15%)",
    output_summary: "WELCOME15 blocked (15% > 10% cap). SAVE10 yields ₹269. FLAT300 valid but SAVE10 optimal.",
    evidence: "Deterministic coupon optimization engine execution log.",
    policy_checks: { max_discount_percent: 10, welcome15_allowed: false, save10_allowed: true },
    timestamp: new Date(Date.now() - 3600000 * 2 - 60000 * 7).toISOString()
  },
  {
    id: "act_1008",
    order_id: "ord_demo_1024",
    session_id: "sess_demo_1024",
    action_type: "COUPON_SELECTED",
    status: "SUCCESS",
    reason: "Applied SAVE10 saving ₹269. Final payable amount: ₹2429.",
    confidence: 1.0,
    input_summary: "Subtotal: ₹2698, Coupon: SAVE10",
    output_summary: "Total: ₹2429. Discount: ₹269.",
    evidence: "Discount calculation: floor(2698 * 0.10) = 269.",
    policy_checks: { discount_within_policy: true },
    timestamp: new Date(Date.now() - 3600000 * 2 - 60000 * 6).toISOString()
  },
  {
    id: "act_1009",
    order_id: "ord_demo_1024",
    session_id: "sess_demo_1024",
    action_type: "RAZORPAY_ORDER_CREATED",
    status: "SUCCESS",
    reason: "Created Razorpay Test Mode order for ₹2429 (242900 paise).",
    confidence: 1.0,
    input_summary: "Amount: 242900 paise, Currency: INR",
    output_summary: "Razorpay Order ID: order_test_demo1024",
    evidence: "Razorpay API response received with status 'created'.",
    policy_checks: { amount_matches_cart: true },
    timestamp: new Date(Date.now() - 3600000 * 2 - 60000 * 4).toISOString()
  },
  {
    id: "act_1010",
    order_id: "ord_demo_1024",
    session_id: "sess_demo_1024",
    action_type: "PAYMENT_VERIFIED",
    status: "SUCCESS",
    reason: "Server-side HMAC-SHA256 signature verified against Razorpay Key Secret.",
    confidence: 1.0,
    input_summary: "Payment ID: pay_test_capt_1024, Signature verified: TRUE",
    output_summary: "Payment status: CAPTURED. Order marked as PAID.",
    evidence: "Cryptographic hash match confirmed on backend.",
    policy_checks: { signature_valid: true, no_replay_attack: true },
    timestamp: new Date(Date.now() - 3600000 * 2 - 60000 * 1).toISOString()
  },
  {
    id: "act_1011",
    order_id: "ord_demo_1024",
    session_id: "sess_demo_1024",
    action_type: "REVENUE_ATTRIBUTED",
    status: "SUCCESS",
    reason: "AI successfully attributed ₹2429 captured revenue to merchant dashboard.",
    confidence: 1.0,
    input_summary: "Captured amount: ₹2429. AI influenced: TRUE",
    output_summary: "Merchant AI revenue credited: +₹2429.",
    evidence: "Order status is PAID. Only captured transactions credit AI revenue.",
    policy_checks: { captured_status_verified: true },
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

const seedPaymentEvents = [
  {
    id: "pevt_1024_01",
    order_id: "ord_demo_1024",
    razorpay_event_id: "event_demo_capt_1024",
    event_type: "payment.captured",
    status: "SUCCESS",
    amount: 242900,
    error: null,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "pevt_1023_01",
    order_id: "ord_demo_1023",
    razorpay_event_id: "event_demo_capt_1023",
    event_type: "payment.captured",
    status: "SUCCESS",
    amount: 309800,
    error: null,
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "pevt_1022_01",
    order_id: "ord_demo_1022",
    razorpay_event_id: "event_demo_fail_1022",
    event_type: "payment.failed",
    status: "FAILED",
    amount: 135000,
    error: "BAD_REQUEST_ERROR: Payment processing cancelled by user or test card declined",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString()
  }
];

const seedStats = {
  total_revenue: 842350,
  ai_attributed_revenue: 126400,
  aov: 2174,
  ai_upsell_rate: 18.6,
  successful_orders: 428,
  active_opportunities: 7,
  monthly_trend: [
    { month: "Mar", total: 610000, ai: 72000 },
    { month: "Apr", total: 680000, ai: 89000 },
    { month: "May", total: 725000, ai: 98000 },
    { month: "Jun", total: 760000, ai: 106000 },
    { month: "Jul", total: 795000, ai: 115000 },
    { month: "Aug", total: 842350, ai: 126400 }
  ],
  upsell_funnel: {
    recommendations_shown: 1420,
    upsells_proposed: 860,
    upsells_accepted: 395,
    successful_payments: 368
  },
  upsell_performance: [
    {
      product: "Running Shoes",
      upsell: "Performance Socks",
      proposed: 310,
      accepted: 142,
      conversion: "45.8%",
      revenue: 56658
    },
    {
      product: "Classic Watch",
      upsell: "Gift Packaging",
      proposed: 245,
      accepted: 118,
      conversion: "48.1%",
      revenue: 23482
    },
    {
      product: "Wireless Earbuds",
      upsell: "Gift Packaging",
      proposed: 180,
      accepted: 76,
      conversion: "42.2%",
      revenue: 15124
    },
    {
      product: "Laptop",
      upsell: "Wireless Mouse",
      proposed: 125,
      accepted: 59,
      conversion: "47.2%",
      revenue: 47141
    }
  ]
};

module.exports = {
  seedProducts,
  seedCoupons,
  seedPolicies,
  seedOpportunities,
  seedCustomer,
  seedOrders,
  seedAiActions,
  seedPaymentEvents,
  seedStats
};
