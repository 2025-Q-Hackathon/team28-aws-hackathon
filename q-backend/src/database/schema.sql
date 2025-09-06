-- Love Q v2.0 DSQL Database Schema
-- PostgreSQL 호환 스키마

-- 사용자 기본 정보 테이블
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    subscription_type VARCHAR(50) DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 말투 프로필 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
    profile_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    total_messages INTEGER DEFAULT 0,
    formal_ratio DECIMAL(3,2) DEFAULT 0.50,
    emoji_ratio DECIMAL(3,2) DEFAULT 0.20,
    avg_length DECIMAL(5,2) DEFAULT 20.0,
    tone VARCHAR(50) DEFAULT 'neutral',
    speech_style VARCHAR(50) DEFAULT 'casual',
    personality_traits JSONB DEFAULT '[]',
    response_examples JSONB DEFAULT '[]',
    last_analysis_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 감정 분석 결과 테이블
CREATE TABLE IF NOT EXISTS emotion_analysis (
    analysis_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    sentiment VARCHAR(20),
    sentiment_confidence DECIMAL(3,2),
    emotions JSONB,
    key_phrases JSONB,
    entities JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 대화 기록 테이블
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    partner_name VARCHAR(100),
    partner_relationship VARCHAR(50),
    context_text TEXT,
    user_message TEXT NOT NULL,
    ai_responses JSONB NOT NULL,
    selected_response_type VARCHAR(50),
    selected_response TEXT,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 세션 테이블
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    partner_name VARCHAR(100),
    partner_relationship VARCHAR(50),
    partner_personality VARCHAR(200),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 답변 피드백 테이블 (확장)
CREATE TABLE IF NOT EXISTS response_feedback (
    feedback_id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    response_type VARCHAR(50),
    response_text TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type VARCHAR(50), -- 'helpful', 'not_helpful', 'inappropriate'
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 크레딧 테이블 (확장)
CREATE TABLE IF NOT EXISTS user_credits (
    credit_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    credits_remaining INTEGER DEFAULT 10,
    credits_used INTEGER DEFAULT 0,
    last_refill_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 사용 통계 테이블 (확장)
CREATE TABLE IF NOT EXISTS usage_stats (
    stat_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    conversations_count INTEGER DEFAULT 0,
    responses_generated INTEGER DEFAULT 0,
    avg_response_rating DECIMAL(2,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_analysis_user_id ON emotion_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date ON usage_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_response_feedback_conversation ON response_feedback(conversation_id);

-- 사용자 대시보드 뷰 (확장)
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
    u.user_id,
    u.username,
    u.subscription_type,
    up.speech_style,
    up.personality_traits,
    uc.credits_remaining,
    uc.credits_used,
    COALESCE(stats.total_conversations, 0) as total_conversations,
    COALESCE(stats.today_conversations, 0) as today_conversations,
    COALESCE(stats.avg_response_rating, 0) as avg_response_rating,
    COALESCE(stats.overall_success_rate, 0) as overall_success_rate,
    COALESCE(stats.favorite_response_type, '균형형') as favorite_response_type
FROM users u
LEFT JOIN user_profiles up ON u.user_id = up.user_id
LEFT JOIN user_credits uc ON u.user_id = uc.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_conversations,
        AVG(feedback_rating) as avg_response_rating,
        COUNT(CASE WHEN feedback_rating >= 4 THEN 1 END)::FLOAT / NULLIF(COUNT(feedback_rating), 0) as overall_success_rate,
        MODE() WITHIN GROUP (ORDER BY selected_response_type) as favorite_response_type
    FROM conversations 
    WHERE feedback_rating IS NOT NULL
    GROUP BY user_id
) stats ON u.user_id = stats.user_id
WHERE u.is_active = true;

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at 
    BEFORE UPDATE ON user_credits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 (개발용)
INSERT INTO users (user_id, email, username) VALUES 
('test-user-1', 'test@example.com', 'testuser')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_profiles (user_id, total_messages, formal_ratio, emoji_ratio, avg_length, tone, speech_style, personality_traits) VALUES 
('test-user-1', 25, 0.3, 0.4, 28.5, 'positive', 'casual', '["친근함", "표현력 풍부", "긍정적"]')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_credits (user_id, credits_remaining, credits_used) VALUES 
('test-user-1', 7, 3)
ON CONFLICT (user_id) DO NOTHING;

-- 성능 최적화를 위한 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_partner ON conversations(partner_name, partner_relationship);
CREATE INDEX IF NOT EXISTS idx_user_profiles_speech_style ON user_profiles(speech_style);
CREATE INDEX IF NOT EXISTS idx_emotion_analysis_sentiment ON emotion_analysis(sentiment);

-- 데이터 정리를 위한 함수 (7일 후 자동 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- 7일 이상 된 감정 분석 데이터 삭제
    DELETE FROM emotion_analysis 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    -- 30일 이상 된 비활성 세션 삭제
    DELETE FROM user_sessions 
    WHERE last_activity < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    -- 90일 이상 된 사용 통계 삭제 (요약 데이터만 유지)
    DELETE FROM usage_stats 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 스키마 버전 정보
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES 
('2.0.0', 'Love Q v2.0 - Cognito + DSQL + Comprehend integration')
ON CONFLICT (version) DO NOTHING;