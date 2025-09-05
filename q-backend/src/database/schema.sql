-- Love Q Database Schema

CREATE DATABASE IF NOT EXISTS loveq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE loveq;

-- 사용자 프로필 테이블
CREATE TABLE user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    formal_ratio DECIMAL(3,2) DEFAULT 0.50,  -- 존댓말 비율 (0.00-1.00)
    emoji_ratio DECIMAL(3,2) DEFAULT 0.20,   -- 이모티콘 사용 비율
    avg_length DECIMAL(5,1) DEFAULT 10.0,    -- 평균 메시지 길이
    total_messages INT DEFAULT 0,            -- 총 메시지 수
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
);

-- 답변 피드백 테이블
CREATE TABLE response_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    response_type ENUM('안전형', '표준형', '대담형') NOT NULL,
    response_text TEXT NOT NULL,
    was_used BOOLEAN DEFAULT FALSE,          -- 실제 사용 여부
    user_rating TINYINT,                     -- 1-5 평점
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_response_type (response_type),
    INDEX idx_created_at (created_at)
);

-- 사용 통계 테이블
CREATE TABLE usage_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    action_type ENUM('upload', 'analyze', 'generate', 'feedback') NOT NULL,
    situation VARCHAR(100),                  -- 상황 카테고리
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at)
);

-- 크레딧 시스템 테이블
CREATE TABLE user_credits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    credits INT DEFAULT 10,                  -- 보유 크레딧
    total_used INT DEFAULT 0,               -- 총 사용 크레딧
    last_refill DATE,                       -- 마지막 충전일
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
);

-- 크레딧 사용 내역
CREATE TABLE credit_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    transaction_type ENUM('use', 'refill', 'purchase') NOT NULL,
    amount INT NOT NULL,                     -- 사용/충전 크레딧 수
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- 초기 데이터 삽입
INSERT INTO user_credits (user_id, credits) VALUES 
('demo_user', 10),
('test_user', 5);

-- 뷰: 사용자 통계
CREATE VIEW user_stats AS
SELECT 
    up.user_id,
    up.total_messages,
    up.formal_ratio,
    up.emoji_ratio,
    uc.credits,
    COUNT(rf.id) as total_responses,
    AVG(rf.user_rating) as avg_rating
FROM user_profiles up
LEFT JOIN user_credits uc ON up.user_id = uc.user_id
LEFT JOIN response_feedback rf ON up.user_id = rf.user_id
GROUP BY up.user_id;
