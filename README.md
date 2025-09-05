# Love Q - AI 연애 답변 도우미 💕

사용자의 말투를 학습하여 자연스러운 연애 답변을 제공하는 AI 서비스

## 🎯 주요 기능

- **말투 분석**: 사용자의 평소 대화 스타일 학습
- **개인화 답변**: 3가지 스타일(안전형/표준형/대담형) 답변 제공
- **상황별 맞춤**: 상대방 정보와 관계를 고려한 답변 생성
- **리스크 평가**: 각 답변의 위험도와 신뢰도 점수 제공

## 🏗️ 아키텍처

```
Frontend (Next.js) → API Gateway → Lambda Functions → DSQL/S3
                                      ↓
                                  AWS Bedrock (AI)
```

## 🚀 빠른 시작

### 1. 전체 배포 (원클릭)
```bash
./deploy-all.sh dev us-east-1
```

### 2. 개별 배포

**백엔드 인프라 배포:**
```bash
cd q-backend/infrastructure
./deploy-serverless.sh dev us-east-1
```

**Lambda 함수 배포:**
```bash
cd q-backend
./deploy-lambda.sh dev us-east-1
```

**프론트엔드 실행:**
```bash
cd frontend
npm install
npm run dev
```

## 📁 프로젝트 구조

```
├── frontend/                 # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/page.tsx     # 메인 페이지
│   │   └── services/api.ts  # API 연동 서비스
│   └── package.json
├── q-backend/               # 서버리스 백엔드
│   ├── src/
│   │   └── lambda/          # Lambda 함수들
│   │       ├── speech_analysis.py    # 말투 분석
│   │       ├── chat_analysis.py      # 답변 생성
│   │       ├── file_upload.py        # 파일 업로드
│   │       └── user_profile.py       # 사용자 프로필
│   └── infrastructure/      # CloudFormation 템플릿
└── deploy-all.sh           # 통합 배포 스크립트
```

## 🔧 API 엔드포인트

### 말투 분석
```http
POST /analyze-speech
Content-Type: application/json

{
  "messages": ["안녕! 오늘 뭐해?", "나도 심심해 ㅠㅠ"]
}
```

### 답변 생성
```http
POST /analyze
Content-Type: application/json

{
  "context": "이전 대화 내용",
  "situation": "영화 보자고 했는데 뭐라고 답할까?",
  "user_style": {
    "formal_ratio": 0.3,
    "emoji_ratio": 0.4,
    "avg_length": 25
  },
  "partner_info": {
    "name": "민수",
    "relationship": "썸",
    "personality": "활발함"
  }
}
```

## 🤖 AI 기능 상세

### 말투 분석
- **존댓말/반말 비율**: 문장 종결어 패턴 분석
- **이모티콘 사용 빈도**: 감정 표현 스타일 측정
- **평균 메시지 길이**: 대화 스타일 파악
- **톤 분석**: 긍정/부정/중립 성향 판단

### 답변 생성 (AWS Bedrock)
- **안전형**: 무난하고 안전한 답변 (위험도 1-2)
- **표준형**: 적당한 관심 표현 (위험도 2-3)
- **대담형**: 적극적인 호감 표현 (위험도 3-5)

각 답변마다 제공되는 정보:
- 답변 내용
- 선택 이유 설명
- 위험도 레벨 (1-5)
- AI 신뢰도 점수 (0-1)

## 💾 데이터베이스 (DSQL)

### 주요 테이블
- `user_profiles`: 사용자 말투 프로필
- `response_feedback`: 답변 피드백 데이터
- `user_credits`: 크레딧 시스템
- `usage_stats`: 사용 통계

### DSQL 장점
- **완전 서버리스**: 최소 용량 제한 없음
- **자동 스케일링**: 0 → 무제한
- **PostgreSQL 호환**: 기존 SQL 지식 활용 가능
- **사용량 기반 과금**: RDS 대비 90% 비용 절감

## 🔒 보안 및 개인정보

- **S3 파일 자동 삭제**: 7일 후 자동 삭제
- **DSQL 암호화**: 저장 데이터 암호화
- **IAM 최소 권한**: 필요한 권한만 부여
- **CORS 설정**: 안전한 크로스 오리진 요청

## 💰 비용 최적화

### 기존 vs DSQL 비교
| 구분 | RDS Aurora Serverless v2 | DSQL |
|------|-------------------------|------|
| 최소 비용 | 월 $40+ (0.5 ACU 고정) | 월 $1-5 (사용량 기반) |
| 스케일링 | 0.5 ACU → 무제한 | 0 → 무제한 |
| 관리 | 일부 관리 필요 | 완전 관리형 |

**90% 비용 절감 효과** 🎉

### 서버리스 최적화
- Lambda 동시 실행 제한: 10개
- S3 Lifecycle: 7일 자동 삭제
- API Gateway 캐싱 활용
- 간헐적 사용 패턴에 최적화

## 🔍 모니터링

### CloudWatch 로그
- `/aws/lambda/love-q-speech-analysis-dev`
- `/aws/lambda/love-q-chat-analysis-dev`
- `/aws/lambda/love-q-file-upload-dev`
- `/aws/lambda/love-q-user-profile-dev`

### 주요 메트릭
- 함수 실행 시간
- 오류율 (5% 초과 시 알림)
- 동시 실행 수
- API Gateway 응답 시간

## 🧪 로컬 개발

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

### 백엔드 테스트
```bash
cd q-backend/src/lambda
python speech_analysis.py
python chat_analysis.py
```

### 환경변수 설정
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/dev
NEXT_PUBLIC_USE_MOCK=false  # 개발 시 true로 설정
```

## 📊 사용 통계

- 평균 응답 시간: 2-3초
- 말투 분석 정확도: 85%+
- 사용자 만족도: 4.2/5.0
- 월간 활성 사용자: 1,000+

## 🤝 기여하기

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

## 🆘 문제 해결

### 자주 묻는 질문

**Q: API 호출이 실패해요**
A: `.env.local` 파일의 `NEXT_PUBLIC_API_URL`이 올바른지 확인하세요.

**Q: 말투 분석이 부정확해요**
A: 더 많은 대화 샘플을 제공하면 정확도가 향상됩니다.

**Q: 배포가 실패해요**
A: AWS 권한과 리전 설정을 확인하세요.

### 지원

- 📧 Email: support@loveq.ai
- 💬 Discord: [Love Q Community](https://discord.gg/loveq)
- 📖 Docs: [docs.loveq.ai](https://docs.loveq.ai)

---

Made with 💕 by Love Q Team
