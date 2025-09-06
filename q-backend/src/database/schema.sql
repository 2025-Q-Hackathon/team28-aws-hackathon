-- Love Q v2.0 DSQL Schema
-- 사용자 인증 및 개인화 기능을 위한 확장된 스키마

-- 사용자 테이블 (Cognito 연동)
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,  -- Cognito User ID
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    subscription_type VARCHAR(50) DEFAULT 'free'  -- free, premium
);

-- 사용자 프로필 테이블 (기존 확장)
CREATE TABLE IF NOT EXISTS user_profiles (
    profile_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    total_messages INTEGER DEFAULT 0,
    formal_ratio DECIMAL(3,2) DEFAULT 0.0,
    emoji_ratio DECIMAL(3,2) DEFAULT 0.0,
    avg_length DECIMAL(5,2) DEFAULT 0.0,
    tone VARCHAR(50),
    speech_style VARCHAR(100),
    personality_traits TEXT[], -- JSON array
    response_examples TEXT[], -- JSON array
    last_analysis_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 감정 분석 결과 테이블
CREATE TABLE IF NOT EXISTS emotion_analysis (
    analysis_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    sentiment VARCHAR(20), -- POSITIVE/NEGATIVE/NEUTRAL/MIXED
    sentiment_confidence DECIMAL(3,2),
    emotions JSONB, -- {joy: 0.8, surprise: 0.2, etc}
    key_phrases TEXT[],
    entities JSONB,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 대화 기록 테이블
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    partner_name VARCHAR(100),
    partner_relationship VARCHAR(50),
    context_text TEXT,
    user_message TEXT NOT NULL,
    ai_responses JSONB, -- 3가지 답변 옵션
    selected_response_type VARCHAR(20), -- 안전형, 표준형, 대담형
    selected_response TEXT,
    feedback_rating INTEGER, -- 1-5 점수
    feedback_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 세션 테이블
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    jwt_token_hash VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- 답변 성공률 추적 테이블 (기존 response_feedback 확장)
CREATE TABLE IF NOT EXISTS response_feedback (
    feedback_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    conversation_id INTEGER REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    response_type VARCHAR(20) NOT NULL,
    success_rating INTEGER CHECK (success_rating >= 1 AND success_rating <= 5),
    outcome VARCHAR(50), -- 'positive', 'negative', 'neutral'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 크레딧 시스템 (기존 확장)
CREATE TABLE IF NOT EXISTS user_credits (
    credit_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    credits_remaining INTEGER DEFAULT 10, -- 무료 사용자 10회
    credits_used INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용 통계 테이블 (기존 확장)
CREATE TABLE IF NOT EXISTS usage_stats (
    stat_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    conversations_count INTEGER DEFAULT 0,
    responses_generated INTEGER DEFAULT 0,
    successful_responses INTEGER DEFAULT 0,
    avg_response_rating DECIMAL(2,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_emotion_analysis_user_id ON emotion_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_response_feedback_user_id ON response_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date ON usage_stats(user_id, date);

-- 트리거: 사용자 프로필 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at 
    BEFORE UPDATE ON user_credits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 뷰: 사용자 대시보드 데이터
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
    u.user_id,
    u.email,
    u.username,
    up.total_messages,
    up.speech_style,
    uc.credits_remaining,
    us.conversations_count as today_conversations,
    us.avg_response_rating,
    COUNT(c.conversation_id) as total_conversations,
    AVG(rf.success_rating) as overall_success_rate
FROM users u
LEFT JOIN user_profiles up ON u.user_id = up.user_id
LEFT JOIN user_credits uc ON u.user_id = uc.user_id
LEFT JOIN usage_stats us ON u.user_id = us.user_id AND us.date = CURRENT_DATE
LEFT JOIN conversations c ON u.user_id = c.user_id
LEFT JOIN response_feedback rf ON u.user_id = rf.user_id
WHERE u.is_active = true
GROUP BY u.user_id, u.email, u.username, up.total_messages, up.speech_style, 
         uc.credits_remaining, us.conversations_count, us.avg_response_rating;

-- 샘플 데이터 (개발용)
INSERT INTO users (user_id, email, username) VALUES 
('test-user-1', 'test@loveq.ai', 'testuser')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_credits (user_id, credits_remaining) VALUES 
('test-user-1', 10)
ON CONFLICT DO NOTHING;
