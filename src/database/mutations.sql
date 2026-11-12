-- =============================================================================
-- File: mutations.sql
-- Description: Parameterized Mutation Queries for API Controllers
-- =============================================================================

-- =============================================================================
-- 1. AUTH MUTATIONS
-- =============================================================================

-- 1.1 Register New User
-- Params: $1: name, $2: email, $3: password_hash, $4: role ('CUSTOMER'|'SUPERADMIN'), $5: whatsapp_number
INSERT INTO users (name, email, password_hash, role, whatsapp_number)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, name, email, role, whatsapp_number, created_at;

-- 1.2 Update User Profile
-- Params: $1: user_id, $2: name, $3: whatsapp_number
UPDATE users
SET name = COALESCE($2, name),
    whatsapp_number = COALESCE($3, whatsapp_number)
WHERE id = $1
RETURNING id, name, email, role, whatsapp_number, updated_at;


-- =============================================================================
-- 2. CATEGORY MUTATIONS (SUPERADMIN / PLATFORM_ADMIN)
-- =============================================================================

-- 2.1 Create Category
-- Params: $1: name, $2: slug, $3: description, $4: created_by (user_id)
INSERT INTO categories (name, slug, description, created_by)
VALUES ($1, $2, $3, $4)
RETURNING id, name, slug, description, created_by, created_at;

-- 2.2 Update Category
-- Params: $1: category_id, $2: name, $3: slug, $4: description
UPDATE categories
SET name = COALESCE($2, name),
    slug = COALESCE($3, slug),
    description = COALESCE($4, description)
WHERE id = $1
RETURNING id, name, slug, description, updated_at;

-- 2.3 Delete Category
-- Params: $1: category_id
DELETE FROM categories
WHERE id = $1
RETURNING id;


-- =============================================================================
-- 3. PRODUCT MUTATIONS (SUPERADMIN)
-- =============================================================================

-- 3.1 Create Product (Tied to the authenticated Superadmin creator)
-- Params: $1: name, $2: slug, $3: description, $4: price, $5: stock, $6: category_id, $7: images (array), $8: created_by, $9: whatsapp_number
INSERT INTO products (name, slug, description, price, stock, category_id, images, created_by, whatsapp_number)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, name, slug, price, stock, category_id, images, created_by, whatsapp_number, created_at;

-- 3.2 Update Product (Strict ownership check: only creator or PLATFORM_ADMIN can modify)
-- Params: $1: product_id, $2: user_id, $3: name, $4: description, $5: price, $6: stock, $7: category_id, $8: images, $9: whatsapp_number, $10: is_active
UPDATE products
SET name = COALESCE($3, name),
    description = COALESCE($4, description),
    price = COALESCE($5, price),
    stock = COALESCE($6, stock),
    category_id = COALESCE($7, category_id),
    images = COALESCE($8, images),
    whatsapp_number = COALESCE($9, whatsapp_number),
    is_active = COALESCE($10, is_active)
WHERE id = $1 
  AND (created_by = $2 OR (SELECT role FROM users WHERE id = $2) = 'PLATFORM_ADMIN')
RETURNING id, name, price, stock, category_id, images, is_active, updated_at;

-- 3.3 Delete Product (Strict ownership check)
-- Params: $1: product_id, $2: user_id
DELETE FROM products
WHERE id = $1 
  AND (created_by = $2 OR (SELECT role FROM users WHERE id = $2) = 'PLATFORM_ADMIN')
RETURNING id;


-- =============================================================================
-- 4. CART MUTATIONS (CUSTOMER)
-- =============================================================================

-- 4.1 Add or Upsert Item to Cart
-- Params: $1: user_id, $2: product_id, $3: quantity
INSERT INTO cart_items (user_id, product_id, quantity)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, product_id)
DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
RETURNING id, user_id, product_id, quantity, updated_at;

-- 4.2 Update Cart Item Quantity
-- Params: $1: cart_item_id, $2: user_id, $3: new_quantity
UPDATE cart_items
SET quantity = $3
WHERE id = $1 AND user_id = $2
RETURNING id, user_id, product_id, quantity, updated_at;

-- 4.3 Remove Single Item from Cart
-- Params: $1: cart_item_id, $2: user_id
DELETE FROM cart_items
WHERE id = $1 AND user_id = $2
RETURNING id;

-- 4.4 Clear Entire Cart
-- Params: $1: user_id
DELETE FROM cart_items
WHERE user_id = $1;


-- =============================================================================
-- 5. ORDER & CHECKOUT MUTATIONS (CUSTOMER)
-- =============================================================================

-- 5.1 Create Order Header
-- Params: $1: customer_id, $2: total_amount, $3: shipping_address
INSERT INTO orders (customer_id, total_amount, status, payment_status, shipping_address)
VALUES ($1, $2, 'PENDING', 'PENDING', $3)
RETURNING id, customer_id, total_amount, status, payment_status, created_at;

-- 5.2 Insert Order Item (Captures unit_price at time of purchase and attributes seller_id)
-- Params: $1: order_id, $2: product_id, $3: seller_id, $4: quantity, $5: unit_price
INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, order_id, product_id, seller_id, quantity, unit_price, total_price;

-- 5.3 Deduct Product Stock on Successful Purchase
-- Params: $1: product_id, $2: quantity_purchased
UPDATE products
SET stock = stock - $2
WHERE id = $1 AND stock >= $2
RETURNING id, stock;


-- =============================================================================
-- 6. ORDER STATUS & REVENUE MUTATIONS (SUPERADMIN / PLATFORM_ADMIN)
-- =============================================================================

-- 6.1 Update Order Status
-- Params: $1: order_id, $2: new_status ('PROCESSING'|'SHIPPED'|'DELIVERED'|'CANCELLED')
UPDATE orders
SET status = $2
WHERE id = $1
RETURNING id, status, updated_at;

-- 6.2 Update Payment Status
-- Params: $1: order_id, $2: payment_status ('PAID'|'REFUNDED')
UPDATE orders
SET payment_status = $2
WHERE id = $1
RETURNING id, payment_status, updated_at;

