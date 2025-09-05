-- Love Q DSQL Schema

-- 사용자 프로필 테이블
CREATE TABLE user_profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    formal_ratio DECIMAL(3,2) DEFAULT 0.50,
    emoji_ratio DECIMAL(3,2) DEFAULT 0.20,
    avg_length DECIMAL(5,1) DEFAULT 10.0,
    total_messages INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 답변 피드백 테이블
CREATE TABLE response_feedback (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    response_type VARCHAR(20) NOT NULL CHECK (response_type IN ('안전형', '표준형', '대담형')),
    response_text TEXT NOT NULL,
    was_used BOOLEAN DEFAULT FALSE,
    user_rating SMALLINT CHECK (user_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 크레딧 시스템 테이블
CREATE TABLE user_credits (
    user_id VARCHAR(255) PRIMARY KEY,
    credits INT DEFAULT 10,
    total_used INT DEFAULT 0,
    last_refill DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용 통계 테이블
CREATE TABLE usage_stats (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('upload', 'analyze', 'generate', 'feedback')),
    situation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_response_feedback_user_id ON response_feedback(user_id);
CREATE INDEX idx_response_feedback_created_at ON response_feedback(created_at);
CREATE INDEX idx_usage_stats_user_id ON usage_stats(user_id);
CREATE INDEX idx_usage_stats_action_type ON usage_stats(action_type);

-- 초기 데이터
INSERT INTO user_credits (user_id, credits) VALUES 
('demo_user', 10),
('test_user', 5);
