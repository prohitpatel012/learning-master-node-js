-- =============================================================================
-- File: queries.sql
-- Description: Parameterized Read & Aggregation Queries for API Controllers
-- =============================================================================

-- =============================================================================
-- 1. PUBLIC & CUSTOMER QUERIES
-- =============================================================================

-- 1.1 List Active Products (with optional category, search, and pagination)
-- Params: $1: category_id (or NULL), $2: search_term (or NULL), $3: limit, $4: offset
SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.stock,
    p.images,
    p.whatsapp_number,
    c.name AS category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
  AND ($1::UUID IS NULL OR p.category_id = $1)
  AND ($2::TEXT IS NULL OR p.name ILIKE '%' || $2 || '%' OR p.description ILIKE '%' || $2 || '%')
ORDER BY p.created_at DESC
LIMIT $3 OFFSET $4;

-- 1.2 Get Product Details & WhatsApp Link Info
-- Params: $1: product_id
SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.stock,
    p.images,
    p.whatsapp_number,
    u.name AS seller_name,
    c.name AS category_name
FROM products p
JOIN users u ON p.created_by = u.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.id = $1 AND p.is_active = true;

-- 1.3 Get Customer Cart with Subtotals
-- Params: $1: user_id
SELECT 
    ci.id AS cart_item_id,
    ci.quantity,
    p.id AS product_id,
    p.name AS product_name,
    p.price AS unit_price,
    (ci.quantity * p.price) AS subtotal,
    p.images[1] AS thumbnail,
    p.stock AS available_stock
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
WHERE ci.user_id = $1;


-- =============================================================================
-- 2. ISOLATED SUPERADMIN DASHBOARD QUERIES
-- =============================================================================

-- 2.1 Get Only Products Created by Current Superadmin
-- Params: $1: superadmin_user_id, $2: limit, $3: offset
SELECT 
    p.id,
    p.name,
    p.price,
    p.stock,
    p.is_active,
    c.name AS category_name,
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.created_by = $1
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3;

-- 2.2 Superadmin Inventory Summary
-- Params: $1: superadmin_user_id
SELECT 
    COUNT(id) AS total_products,
    COUNT(id) FILTER (WHERE is_active = true AND stock > 0) AS in_stock_count,
    COUNT(id) FILTER (WHERE stock = 0) AS out_of_stock_count
FROM products
WHERE created_by = $1;


-- =============================================================================
-- 3. SALES & REVENUE AGGREGATION QUERIES
-- =============================================================================

-- 3.1 List Sold Items for Current Superadmin (Order history)
-- Params: $1: superadmin_user_id, $2: limit, $3: offset
SELECT 
    oi.id AS order_item_id,
    oi.order_id,
    p.name AS product_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    o.status AS order_status,
    o.payment_status,
    o.created_at AS order_date
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
WHERE oi.seller_id = $1
ORDER BY o.created_at DESC
LIMIT $2 OFFSET $3;

-- 3.2 Total Revenue & Sales Analytics for Current Superadmin
-- Params: $1: superadmin_user_id
SELECT 
    COUNT(oi.id) AS total_orders_count,
    COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
    COALESCE(SUM(oi.total_price), 0) AS total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.seller_id = $1
  AND o.payment_status = 'PAID';

-- 3.3 Top 5 Best Selling Products for Current Superadmin
-- Params: $1: superadmin_user_id
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.total_price) AS total_earned
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE oi.seller_id = $1
  AND o.payment_status = 'PAID'
GROUP BY p.id, p.name
ORDER BY total_earned DESC
LIMIT 5;

