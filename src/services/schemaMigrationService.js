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

};

module.exports = {
    ensureRuntimeSchema
};
