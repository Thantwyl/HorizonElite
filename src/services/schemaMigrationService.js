const ensureRuntimeSchema = async (pool) => {

    await pool.query(`
        ALTER TABLE IF EXISTS users
        ALTER COLUMN phone_number TYPE VARCHAR(30)
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(30) NOT NULL DEFAULT 'LOCAL'
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(100)
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)
    `);

    await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id
        ON users(google_id)
        WHERE google_id IS NOT NULL
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS line_id VARCHAR(255)
    `);

    await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_line_id
        ON users(line_id)
        WHERE line_id IS NOT NULL
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS title VARCHAR(10)
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS date_of_birth DATE
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS gender CHAR(1)
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS address TEXT
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS alternate_phone_number VARCHAR(30)
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS passengers
        ALTER COLUMN pi_contact_phone TYPE VARCHAR(30)
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS bookings
        ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(30)
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS ticket_email_jobs (
            job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            booking_id UUID NOT NULL UNIQUE,
            recipient_email VARCHAR(100) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            attempts INTEGER NOT NULL DEFAULT 0,
            due_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
            sent_at TIMESTAMP,
            last_error TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS booking_checkins (
            checkin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            booking_id UUID NOT NULL UNIQUE REFERENCES bookings(booking_id) ON DELETE CASCADE,
            checked_in_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS check_in_reminder_jobs (
            job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            booking_id UUID NOT NULL UNIQUE REFERENCES bookings(booking_id) ON DELETE CASCADE,
            recipient_email VARCHAR(100) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            attempts INTEGER NOT NULL DEFAULT 0,
            due_at TIMESTAMP NOT NULL,
            sent_at TIMESTAMP,
            last_error TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
        )
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_check_in_reminder_jobs_due
        ON check_in_reminder_jobs(status, due_at)
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS check_in_whatsapp_reminder_jobs (
            job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            booking_id UUID NOT NULL UNIQUE REFERENCES bookings(booking_id) ON DELETE CASCADE,
            recipient_phone VARCHAR(30) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            attempts INTEGER NOT NULL DEFAULT 0,
            due_at TIMESTAMP NOT NULL,
            sent_at TIMESTAMP,
            last_error TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
        )
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_check_in_whatsapp_reminder_jobs_due
        ON check_in_whatsapp_reminder_jobs(status, due_at)
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS passenger_addons
        ADD COLUMN IF NOT EXISTS addon_status VARCHAR(20) NOT NULL DEFAULT 'PAID'
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS passenger_addons
        ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS passenger_addons
        ADD COLUMN IF NOT EXISTS payment_id UUID
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS passenger_addons
        ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP
    `);

    await pool.query(`
        ALTER TABLE IF EXISTS passenger_addons
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS saved_passengers (
            saved_passenger_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_email_address VARCHAR(50) NOT NULL REFERENCES users(email_address) ON DELETE CASCADE,
            relationship VARCHAR(40) NOT NULL DEFAULT 'Self',
            title VARCHAR(10) NOT NULL,
            first_name VARCHAR(60) NOT NULL,
            middle_name VARCHAR(60),
            last_name VARCHAR(60) NOT NULL,
            gender CHAR(1) NOT NULL,
            date_of_birth DATE NOT NULL,
            nationality VARCHAR(100) NOT NULL,
            passenger_type_code CHAR(3) NOT NULL DEFAULT 'ADT',
            contact_email VARCHAR(100),
            contact_phone VARCHAR(30),
            passport_number VARCHAR(30),
            passport_issuing_country VARCHAR(100),
            passport_expiry_date DATE,
            visa_number VARCHAR(50),
            visa_country VARCHAR(100),
            visa_expiry_date DATE,
            notes TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
            CONSTRAINT chk_saved_passenger_gender CHECK (gender IN ('M','F','X')),
            CONSTRAINT chk_saved_passenger_type CHECK (passenger_type_code IN ('ADT','CHD','INF'))
        )
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_saved_passengers_user
        ON saved_passengers(user_email_address)
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS emergency_contacts (
            emergency_contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_email_address VARCHAR(50) NOT NULL REFERENCES users(email_address) ON DELETE CASCADE,
            contact_name VARCHAR(120) NOT NULL,
            relationship VARCHAR(60),
            phone_number VARCHAR(30) NOT NULL,
            email_address VARCHAR(100),
            priority INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
        )
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user
        ON emergency_contacts(user_email_address)
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS saved_payment_methods (
            payment_method_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_email_address VARCHAR(50) NOT NULL REFERENCES users(email_address) ON DELETE CASCADE,
            payment_type VARCHAR(30) NOT NULL DEFAULT 'CARD',
            card_brand VARCHAR(40),
            cardholder_name VARCHAR(120) NOT NULL,
            last_four VARCHAR(4) NOT NULL,
            expiry_month INTEGER NOT NULL,
            expiry_year INTEGER NOT NULL,
            gateway_payment_method_id VARCHAR(255),
            billing_address TEXT,
            is_default BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
            CONSTRAINT chk_saved_payment_last_four CHECK (last_four ~ '^[0-9]{4}$'),
            CONSTRAINT chk_saved_payment_expiry_month CHECK (expiry_month BETWEEN 1 AND 12)
        )
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user
        ON saved_payment_methods(user_email_address)
    `);

};

module.exports = {
    ensureRuntimeSchema
};
