-- Create regional_claims table for the Local Proximity Agent
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS regional_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    source_name TEXT NOT NULL,
    source_url TEXT,
    country TEXT NOT NULL,
    region TEXT,
    location_confidence TEXT DEFAULT 'low',
    virality_score FLOAT DEFAULT 0,
    language TEXT DEFAULT 'en',
    published_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_regional_claims_country ON regional_claims(country);
CREATE INDEX IF NOT EXISTS idx_regional_claims_virality ON regional_claims(virality_score DESC);
CREATE INDEX IF NOT EXISTS idx_regional_claims_language ON regional_claims(language);
CREATE INDEX IF NOT EXISTS idx_regional_claims_claim_id ON regional_claims(claim_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE regional_claims ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust for production)
CREATE POLICY "Allow all operations on regional_claims" ON regional_claims
    FOR ALL USING (true) WITH CHECK (true);

