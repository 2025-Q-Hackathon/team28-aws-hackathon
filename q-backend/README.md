# Love Q Backend

AI 연애 답변 도우미 서버리스 백엔드

## 🏗️ 아키텍처

```
Frontend (Next.js) → API Gateway → Lambda Functions → RDS/S3
                                      ↓
                                  AWS Bedrock (AI)
```

## 📁 프로젝트 구조

```
q-backend/
├── src/
│   ├── lambda/
│   │   ├── chat_analysis.py      # 말투 분석 + AI 답변 생성
│   │   ├── file_upload.py        # 카톡 파일 업로드 처리
│   │   └── user_profile.py       # 사용자 프로필 관리
│   ├── database/
│   │   └── schema.sql            # MySQL 스키마
│   └── requirements.txt          # Python 의존성
├── infrastructure/
│   ├── love-q-serverless.yaml    # CloudFormation 템플릿
│   └── deploy-serverless.sh      # 인프라 배포
└── deploy-lambda.sh              # Lambda 함수 배포
```

## 🚀 배포 방법

### 1. 인프라 배포
```bash
cd infrastructure
./deploy-serverless.sh dev us-east-1 "your-db-password"
```

### 2. 데이터베이스 초기화
```bash
mysql -h <RDS_ENDPOINT> -u admin -p < src/database/schema.sql
```

### 3. Lambda 함수 배포
```bash
./deploy-lambda.sh dev us-east-1
```

## 🔧 API 엔드포인트

### 파일 업로드
```
POST /api/upload
Content-Type: application/json

{
  "file_content": "base64_encoded_kakao_chat",
  "file_name": "chat.txt"
}
```

### 답변 생성
```
POST /api/analyze
Content-Type: application/json

{
  "chat_history": [...],
  "situation": "데이트 제안",
  "recent_context": "최근 대화 내용"
}
```

### 사용자 프로필
```
GET /api/users/{user_id}/profile
POST /api/users/{user_id}/profile
POST /api/users/{user_id}/feedback
```

## 🤖 AI 기능

**말투 분석**
- 존댓말/반말 비율 계산
- 이모티콘 사용 빈도 분석
- 평균 메시지 길이 측정

**답변 생성 (AWS Bedrock)**
- 안전형: 무난하고 안전한 답변
- 표준형: 적당한 관심 표현
- 대담형: 적극적인 호감 표현
- 각 답변마다 설명 + 리스크 레벨 + 신뢰도 점수

## 💾 데이터베이스

**테이블 구조**
- `user_profiles`: 사용자 말투 프로필
- `response_feedback`: 답변 피드백 데이터
- `user_credits`: 크레딧 시스템
- `usage_stats`: 사용 통계

**보안**
- S3 파일 7일 자동 삭제
- RDS 암호화 저장
- IAM 최소 권한 원칙

## 🔍 로컬 테스트

```bash
# Lambda 함수 로컬 테스트
python src/lambda/chat_analysis.py

# 의존성 설치
pip install -r src/requirements.txt
```

## 📊 모니터링

- CloudWatch 로그: `/aws/lambda/love-q-*`
- 메트릭: 함수 실행 시간, 오류율, 동시 실행 수
- 알람: 오류율 5% 초과 시 알림

## 💰 비용 최적화

- Lambda 동시 실행 제한: 10개
- RDS Serverless v2: 0.5-1 ACU
- S3 Lifecycle: 7일 자동 삭제
- 예상 월 비용: $5-15
