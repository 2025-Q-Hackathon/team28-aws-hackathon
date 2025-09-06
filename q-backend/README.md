# Love Q Backend

AI 연애 답변 도우미 서버리스 백엔드

## 🏗️ 아키텍처

```
Frontend (Next.js) → API Gateway → Lambda Functions → DSQL/S3
                                      ↓
                                  AWS Bedrock (AI)
```

## 📁 프로젝트 구조

```
q-backend/
├── src/
│   ├── lambda/
│   │   ├── speech_analysis.py        # 말투 + 감정 분석
│   │   ├── chat_analysis.py          # AI 답변 생성 (감정 기반)
│   │   ├── emotion_analysis.py       # Comprehend 감정 분석
│   │   ├── auth_middleware.py        # JWT + Cognito 인증
│   │   ├── conversation_history.py   # 대화 기록 저장/조회
│   │   └── user_profile_manager.py   # 사용자 프로필 관리
│   ├── database/
│   │   └── schema.sql                # DSQL 스키마 v2.0
│   └── requirements.txt              # Python 의존성
├── infrastructure/
│   ├── love-q-serverless.yaml        # CloudFormation 템플릿
│   └── README.md                     # 인프라 설명
└── README.md                         # 백엔드 설명
```

## 🚀 배포 방법

### 1. 인프라 배포
```bash
cd infrastructure
./deploy-serverless.sh dev us-east-1
```

### 2. 데이터베이스 초기화
```bash
aws dsql execute-statement \
    --cluster-arn <DSQL_CLUSTER_ARN> \
    --sql "$(cat src/database/schema.sql)"
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

## 🤖 AI 기능 v2.0

**말투 분석 (speech_analysis.py)**
- 존댓말/반말 비율 계산
- 이모티콘 사용 빈도 분석
- 평균 메시지 길이 측정
- 성격 특성 추출

**감정 분석 (emotion_analysis.py + Comprehend)**
- 감정 상태 분석 (POSITIVE/NEGATIVE/NEUTRAL/MIXED)
- 핵심 구문 추출
- 개체명 인식
- 감정 강도 계산

**답변 생성 (chat_analysis.py + Bedrock)**
- 안전형: 무난하고 안전한 답변
- 표준형: 적당한 관심 표현
- 대담형: 적극적인 호감 표현
- **감정 상태 기반 맞춤 답변**
- 각 답변마다 설명 + 리스크 레벨 + 신뢰도 점수

**인증 & 세션 관리 (auth_middleware.py)**
- JWT 토큰 검증
- Cognito User Pool 연동
- 세션 관리 및 토큰 갱신

**대화 기록 & 개인화**
- 대화 히스토리 저장 (conversation_history.py)
- 사용자 프로필 관리 (user_profile_manager.py)
- 답변 성공률 추적
- 개인화된 대시보드

## 💾 데이터베이스 (DSQL)

**테이블 구조 v2.0**
- `users`: 사용자 기본 정보 (Cognito 연동)
- `user_profiles`: 사용자 말투 프로필 (확장)
- `emotion_analysis`: 감정 분석 결과
- `conversations`: 대화 기록 저장
- `user_sessions`: 세션 관리
- `response_feedback`: 답변 피드백 데이터 (확장)
- `user_credits`: 크레딧 시스템 (확장)
- `usage_stats`: 사용 통계 (확장)
- `user_dashboard`: 대시보드 뷰

**DSQL 특징**
- PostgreSQL 호환 문법
- 완전 서버리스 (최소 용량 제한 없음)
- 자동 스케일링 (0 → 무제한)
- 사용량 기반 과금

**보안**
- S3 파일 7일 자동 삭제
- DSQL 암호화 저장
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

## 💰 비용 최적화 (DSQL 효과)

**기존 vs DSQL 비교:**
- RDS Aurora Serverless v2: 월 $40+ (최소 0.5 ACU)
- **DSQL: 월 $1-5 (사용량 기반 과금)**
- **90% 비용 절감** 🎉

**서버리스 장점:**
- Lambda 동시 실행 제한: 10개
- DSQL: 완전 서버리스 (최소 용량 없음)
- S3 Lifecycle: 7일 자동 삭제
- 간헐적 사용 패턴에 최적화
