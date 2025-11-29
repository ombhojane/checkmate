-- CheckmateAI Database Schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor to set up the database

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ==================== VERIFICATIONS TABLE ====================
-- Stores all fact-check verification results
CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_text TEXT NOT NULL,
    verdict VARCHAR(20) NOT NULL CHECK (verdict IN ('True', 'False', 'Misleading', 'Unverified', 'Error')),
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 100),
    intensity VARCHAR(10) CHECK (intensity IN ('low', 'medium', 'high')),
    summary TEXT,
    detailed_analysis TEXT,
    sources JSONB DEFAULT '[]'::jsonb,
    language VARCHAR(10) DEFAULT 'en',
    processing_time_ms INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_verifications_created_at ON verifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verifications_language ON verifications(language);
CREATE INDEX IF NOT EXISTS idx_verifications_verdict ON verifications(verdict);

-- ==================== CLAIM EMBEDDINGS TABLE ====================
-- Stores vector embeddings for semantic similarity search
CREATE TABLE IF NOT EXISTS claim_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID REFERENCES verifications(id) ON DELETE CASCADE,
    embedding vector(768),  -- Gemini embedding dimension
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_claim_embeddings_verification ON claim_embeddings(verification_id);

-- Function to find similar claims using cosine similarity
CREATE OR REPLACE FUNCTION match_claims(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.85,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    verification_id UUID,
    claim_text TEXT,
    verdict VARCHAR(20),
    confidence_score FLOAT,
    summary TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.verification_id,
        v.claim_text,
        v.verdict,
        v.confidence_score,
        v.summary,
        1 - (ce.embedding <=> query_embedding) AS similarity
    FROM claim_embeddings ce
    JOIN verifications v ON v.id = ce.verification_id
    WHERE 1 - (ce.embedding <=> query_embedding) > match_threshold
    ORDER BY ce.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ==================== THREAT FEED TABLE ====================
-- Stores trending misinformation threats detected by the Feed Agent
CREATE TABLE IF NOT EXISTS threat_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(500) UNIQUE NOT NULL,
    claim_summary TEXT,
    source_count INT DEFAULT 1,
    intensity VARCHAR(10) CHECK (intensity IN ('low', 'medium', 'high')),
    graph_centrality_score FLOAT DEFAULT 0.0,
    sources JSONB DEFAULT '[]'::jsonb,
    language VARCHAR(10) DEFAULT 'en',
    link TEXT,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for threat feed queries
CREATE INDEX IF NOT EXISTS idx_threat_feed_intensity ON threat_feed(intensity);
CREATE INDEX IF NOT EXISTS idx_threat_feed_centrality ON threat_feed(graph_centrality_score DESC);
CREATE INDEX IF NOT EXISTS idx_threat_feed_first_seen ON threat_feed(first_seen DESC);
CREATE INDEX IF NOT EXISTS idx_threat_feed_language ON threat_feed(language);

-- ==================== VACCINE DIGESTS TABLE ====================
-- Stores weekly misinformation vaccine digests
CREATE TABLE IF NOT EXISTS vaccine_digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    claims JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    view_count INT DEFAULT 0
);

-- Index for digest queries
CREATE INDEX IF NOT EXISTS idx_vaccine_digests_generated ON vaccine_digests(generated_at DESC);

-- ==================== ROW LEVEL SECURITY (Optional) ====================
-- Enable RLS for future authentication support
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccine_digests ENABLE ROW LEVEL SECURITY;

-- Public read policies (no auth required for MVP)
CREATE POLICY "Allow public read on verifications" ON verifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert on verifications" ON verifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on claim_embeddings" ON claim_embeddings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on claim_embeddings" ON claim_embeddings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on threat_feed" ON threat_feed FOR SELECT USING (true);
CREATE POLICY "Allow public all on threat_feed" ON threat_feed FOR ALL USING (true);

CREATE POLICY "Allow public read on vaccine_digests" ON vaccine_digests FOR SELECT USING (true);
CREATE POLICY "Allow public all on vaccine_digests" ON vaccine_digests FOR ALL USING (true);

-- ==================== SCAM REPORTS TABLE ====================
-- Stores user-reported scams
CREATE TABLE IF NOT EXISTS scam_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'verified', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for scam reports
CREATE INDEX IF NOT EXISTS idx_scam_reports_status ON scam_reports(status);
CREATE INDEX IF NOT EXISTS idx_scam_reports_created ON scam_reports(created_at DESC);

-- RLS for scam reports
ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on scam_reports" ON scam_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert on scam_reports" ON scam_reports FOR INSERT WITH CHECK (true);

-- ==================== HELPFUL VIEWS ====================
-- View for recent high-intensity threats
CREATE OR REPLACE VIEW high_intensity_threats AS
SELECT * FROM threat_feed 
WHERE intensity = 'high' 
ORDER BY graph_centrality_score DESC, last_updated DESC
LIMIT 20;

-- View for weekly verification stats
CREATE OR REPLACE VIEW weekly_verification_stats AS
SELECT 
    DATE_TRUNC('week', created_at) AS week,
    COUNT(*) AS total_verifications,
    COUNT(*) FILTER (WHERE verdict = 'True') AS true_count,
    COUNT(*) FILTER (WHERE verdict = 'False') AS false_count,
    COUNT(*) FILTER (WHERE verdict = 'Misleading') AS misleading_count,
    AVG(confidence_score) AS avg_confidence,
    AVG(processing_time_ms) AS avg_processing_time_ms
FROM verifications
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;



