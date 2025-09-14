-- Production PostgreSQL initialization script
-- This script sets up the production database with proper configuration

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE delivery_app_prod'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'delivery_app_prod')\gexec

-- Connect to the delivery_app_prod database
\c delivery_app_prod;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'BUSINESS', 'DRIVER', 'CUSTOMER', 'DISPATCHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_type AS ENUM ('CAR', 'MOTORCYCLE', 'BICYCLE', 'VAN', 'TRUCK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tables with proper indexing
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    phone VARCHAR(20),
    avatar VARCHAR(500),
    isActive BOOLEAN DEFAULT true,
    isVerified BOOLEAN DEFAULT false,
    lastLogin TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS driver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    licenseNumber VARCHAR(50) UNIQUE NOT NULL,
    vehicleType vehicle_type NOT NULL,
    vehicleModel VARCHAR(100),
    vehicleColor VARCHAR(50),
    licensePlate VARCHAR(20),
    isAvailable BOOLEAN DEFAULT true,
    rating DECIMAL(3,2) DEFAULT 0.0,
    totalDeliveries INTEGER DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orderNumber VARCHAR(50) UNIQUE NOT NULL,
    customerId UUID REFERENCES users(id) ON DELETE CASCADE,
    driverId UUID REFERENCES users(id) ON DELETE SET NULL,
    status order_status DEFAULT 'PENDING',
    paymentStatus payment_status DEFAULT 'PENDING',
    pickupAddress TEXT NOT NULL,
    deliveryAddress TEXT NOT NULL,
    pickupLat DECIMAL(10,8),
    pickupLng DECIMAL(11,8),
    deliveryLat DECIMAL(10,8),
    deliveryLng DECIMAL(11,8),
    scheduledPickup TIMESTAMP,
    scheduledDelivery TIMESTAMP,
    actualPickup TIMESTAMP,
    actualDelivery TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0.0,
    deliveryFee DECIMAL(10,2) DEFAULT 0.0,
    tip DECIMAL(10,2) DEFAULT 0.0,
    total DECIMAL(10,2) NOT NULL,
    instructions TEXT,
    isFragile BOOLEAN DEFAULT false,
    requiresSignature BOOLEAN DEFAULT false,
    requiresPhoto BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orderId UUID REFERENCES orders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unitPrice DECIMAL(10,2) NOT NULL,
    totalPrice DECIMAL(10,2) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orderId UUID REFERENCES orders(id) ON DELETE CASCADE,
    driverId UUID REFERENCES users(id) ON DELETE CASCADE,
    status delivery_status DEFAULT 'PENDING',
    pickupTime TIMESTAMP,
    deliveryTime TIMESTAMP,
    distance DECIMAL(8,2),
    estimatedDuration INTEGER,
    actualDuration INTEGER,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(isActive);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customerId);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driverId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(paymentStatus);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(createdAt);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driverId);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(orderId);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_orders_pickup_address_gin ON orders USING gin(to_tsvector('english', pickupAddress));
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address_gin ON orders USING gin(to_tsvector('english', deliveryAddress));

-- Create partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_orders_active ON orders(customerId, status) WHERE status IN ('PENDING', 'CONFIRMED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT');
CREATE INDEX IF NOT EXISTS idx_drivers_available ON driver_profiles(userId) WHERE isAvailable = true;

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_profiles_updated_at BEFORE UPDATE ON driver_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW active_orders AS
SELECT 
    o.*,
    c.firstName as customerFirstName,
    c.lastName as customerLastName,
    c.phone as customerPhone,
    d.firstName as driverFirstName,
    d.lastName as driverLastName,
    d.phone as driverPhone
FROM orders o
LEFT JOIN users c ON o.customerId = c.id
LEFT JOIN users d ON o.driverId = d.id
WHERE o.status IN ('PENDING', 'CONFIRMED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT');

CREATE OR REPLACE VIEW driver_stats AS
SELECT 
    u.id,
    u.firstName,
    u.lastName,
    dp.rating,
    dp.totalDeliveries,
    COUNT(d.id) as active_deliveries,
    AVG(EXTRACT(EPOCH FROM (d.deliveryTime - d.pickupTime))/60) as avg_delivery_time_minutes
FROM users u
JOIN driver_profiles dp ON u.id = dp.userId
LEFT JOIN deliveries d ON u.id = d.driverId AND d.status = 'IN_TRANSIT'
WHERE u.role = 'DRIVER' AND u.isActive = true
GROUP BY u.id, u.firstName, u.lastName, dp.rating, dp.totalDeliveries;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE delivery_app_prod TO delivery_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO delivery_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO delivery_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO delivery_user;

-- Create backup user
CREATE USER backup_user WITH PASSWORD 'backup_password';
GRANT CONNECT ON DATABASE delivery_app_prod TO backup_user;
GRANT USAGE ON SCHEMA public TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;

-- Set up connection limits
ALTER USER delivery_user CONNECTION LIMIT 50;
ALTER USER backup_user CONNECTION LIMIT 5;

-- Configure logging
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;

-- Reload configuration
SELECT pg_reload_conf();
