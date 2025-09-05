# Love Q - AI 연애 답변 도우미

서버리스 아키텍처 기반 연애 상담 AI 서비스

## 🏗️ 아키텍처

**서버리스 구성**
- **Frontend**: CloudFront + S3 (Next.js)
- **Backend**: API Gateway + Lambda (Python)
- **Database**: RDS Serverless v2 (Aurora MySQL)
- **Storage**: S3 (AES256 암호화, 7일 자동 삭제)
- **AI**: AWS Bedrock (Claude, Llama)

**Lambda Functions**
- `chat-analysis`: 대화 분석 및 말투 프로파일링
- `response-generation`: AI 답변 생성 (3안 제시)
- `file-upload`: 카톡 파일 업로드 처리

## 🛠️ 기술 스택 선택 근거

**Python (Lambda)**
- AI/ML 생태계 (boto3, pandas, numpy)
- Bedrock SDK 성숙도
- 한국어 텍스트 처리 라이브러리 풍부
- 텍스트 분석 + AI 처리에 최적화

**Next.js (Frontend)**
- SEO 최적화 (연애 상담 서비스 검색 노출 중요)
- SSR/SSG로 초기 로딩 속도 개선
- 이미지 자동 최적화
- B2C 마케팅에 유리

## 💰 비용 효율성

- **기존 ECS 방식**: 월 $50-100+
- **서버리스 방식**: 월 $5-15
- **90% 비용 절감** (간헐적 사용 패턴에 최적화)

## 🔒 보안 & 프라이버시

- S3 파일 7일 자동 삭제 (LifeCycle Policy)
- RDS 암호화 저장 + 7일 백업
- 사용자 직접 입력만 허용 (크롤링 금지)
- IAM 최소 권한 원칙

## 🚀 배포

```bash
./deploy-serverless.sh dev ap-northeast-2 "your-password"
```

## 📊 핵심 기능

1. **말투 프로파일링**: 사용자 대화 기록 분석
2. **상황별 답변**: 안전형/표준형/대담형 3안 제시
3. **적합도 점수**: AI 신뢰도 수치화
4. **맥락 설명**: 왜 이 답변이 적합한지 설명

## 🎯 서비스 플로우

1. 카톡 대화 업로드 → 2. 상황 선택 → 3. AI 답변 3안 생성 → 4. 설명 + 적합도 점수 제공

## 📁 파일 구조

```
infrastructure/
├── love-q-serverless.yaml    # 서버리스 인프라
└── deploy-serverless.sh       # 배포 스크립트
```
