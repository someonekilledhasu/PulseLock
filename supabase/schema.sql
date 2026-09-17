-- PulseLock Supabase PostgreSQL Database Schema
-- Version: 1.0 (Hackathon MVP)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    pin TEXT NOT NULL DEFAULT '1234',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('draft', 'confirmed', 'active', 'completed')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Medications Table
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    strength TEXT NOT NULL, -- e.g. "500 mg"
    dose_amount TEXT NOT NULL, -- e.g. "1 tablet"
    dose_unit TEXT NOT NULL DEFAULT 'tablet',
    frequency TEXT NOT NULL, -- e.g. "2x daily"
    scheduled_times JSONB NOT NULL DEFAULT '["08:00", "20:00"]'::jsonb,
    food_instruction TEXT DEFAULT 'after food',
    duration_days INT DEFAULT 30,
    compartment_id TEXT NOT NULL DEFAULT 'C01', -- e.g. "C01", "C02"
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Dose Schedules Table
CREATE TABLE IF NOT EXISTS dose_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    scheduled_datetime TIMESTAMPTZ NOT NULL,
    compartment_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('upcoming', 'available', 'accessed', 'missed')) DEFAULT 'upcoming',
    accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Device Events Table
CREATE TABLE IF NOT EXISTS device_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dose_schedule_id UUID REFERENCES dose_schedules(id) ON DELETE SET NULL,
    device_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'access_granted', 'access_denied', 'sync', 'unlocked', 'tamper'
    compartment TEXT,
    patient_id TEXT,
    status TEXT NOT NULL,
    raw_payload JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_dose_schedules_datetime ON dose_schedules(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_dose_schedules_status ON dose_schedules(status);
CREATE INDEX IF NOT EXISTS idx_device_events_timestamp ON device_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_medications_prescription ON medications(prescription_id);

-- Enable Row Level Security (RLS) with open read/write for hackathon demo
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read prescriptions" ON prescriptions FOR SELECT USING (true);
CREATE POLICY "Allow public insert prescriptions" ON prescriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update prescriptions" ON prescriptions FOR UPDATE USING (true);
CREATE POLICY "Allow public read medications" ON medications FOR SELECT USING (true);
CREATE POLICY "Allow public insert medications" ON medications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read dose_schedules" ON dose_schedules FOR SELECT USING (true);
CREATE POLICY "Allow public update dose_schedules" ON dose_schedules FOR ALL USING (true);
CREATE POLICY "Allow public read device_events" ON device_events FOR ALL USING (true);

-- Seed Initial Demo Patient
INSERT INTO users (id, username, full_name, pin)
VALUES ('00000000-0000-0000-0000-000000000001', 'alex_davis', 'Alex Davis', '1234')
ON CONFLICT (username) DO NOTHING;
