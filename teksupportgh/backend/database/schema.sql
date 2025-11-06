-- TeksupportGH Database Schema

-- Users table (clients, technicians, and admins)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'technician', 'admin')),
    name VARCHAR(255) NOT NULL,
    location JSONB,
    profile_image VARCHAR(500),
    bio TEXT,
    skills TEXT[],
    is_available BOOLEAN DEFAULT true,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_jobs INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service categories
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service requests
CREATE TABLE IF NOT EXISTS service_requests (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES service_categories(id),
    issue_type VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'in_progress', 'completed', 'cancelled', 'paid')),
    location JSONB NOT NULL,
    estimated_cost DECIMAL(10, 2),
    final_cost DECIMAL(10, 2),
    scheduled_time TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages for real-time chat
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ratings and reviews
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(request_id, from_user_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50) NOT NULL,
    momo_reference VARCHAR(255),
    transaction_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_technician ON service_requests(technician_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_messages_request ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user ON ratings(to_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_request ON payments(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Insert default service categories
INSERT INTO service_categories (name, description, icon) VALUES
('Computer Repair', 'Desktop and laptop hardware repairs', 'computer'),
('Software Issues', 'Operating system and software troubleshooting', 'software'),
('Network Setup', 'Wi-Fi, router configuration, and network issues', 'network'),
('Printer Setup', 'Printer installation and troubleshooting', 'printer'),
('Phone Repair', 'Smartphone hardware and software issues', 'phone'),
('Data Recovery', 'Recover lost or deleted data', 'database'),
('Virus Removal', 'Malware and virus removal services', 'shield'),
('Digital Training', 'Basic computer and digital literacy training', 'education')
ON CONFLICT DO NOTHING;
