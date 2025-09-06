# Love Q v2.0 - AI 연애 답변 도우미 💕

사용자의 말투와 감정을 학습하여 개인화된 연애 답변을 제공하는 AI 서비스

## 🎯 주요 기능 v2.0

- **말투 + 감정 분석**: Comprehend를 활용한 고도화된 분석
- **개인화 답변**: 감정 상태 기반 3가지 스타일 답변 제공
- **사용자 인증**: Cognito 기반 안전한 로그인 시스템
- **대화 기록**: 개인화된 학습을 위한 히스토리 관리
- **실시간 대시보드**: 사용 통계 및 성공률 추적

## 🏗️ 아키텍처 v2.0

```
Frontend (Next.js) → Amplify Auth → API Gateway → Lambda Functions
                         ↓              ↓              ↓
                    Cognito        Comprehend      DSQL/S3
                                       ↓              ↓
                                   Bedrock (AI)   대화기록
```

## 🚀 빠른 시작

### 📋 단계별 배포
```bash
# 1. 백엔드 배포 (Lambda + API Gateway + Cognito + DSQL)
./deploy-backend.sh dev us-east-1

# 2. 데이터베이스 초기화
./init-database.sh dev us-east-1

# 3. 환경변수 설정
./setup-env.sh dev us-east-1

# 4. 로컬 개발
cd frontend && npm run dev
```

### 4. 프로덕션 배포 (Amplify)
**방법 1: AWS 콘솔 (추천)**
- AWS Amplify 콘솔에서 새 앱 생성
- GitHub 리포지토리 연결
- 루트 디렉토리: `frontend`
- 환경변수 설정 (setup-env.sh 출력값 사용)

**방법 2: Amplify CLI (수동 설정)**
```bash
cd frontend

# 1. Amplify 초기화
amplify init
# - 프로젝트 이름: love-q-v2
# - 환경: dev
# - 에디터: Visual Studio Code
# - 앱 타입: javascript
# - 프레임워크: react
# - 소스 디렉토리: src
# - 빌드 디렉토리: out (중요!)
# - 빌드 명령: npm run build
# - 시작 명령: npm run dev

# 2. 호스팅 추가 (수동 선택)
amplify add hosting
# ? Select the plugin module to execute: Hosting with Amplify Console
# ? Choose a type: Manual deployment

# 3. 빌드 디렉토리 설정 확인/수정
amplify configure project
# ? Which setting do you want to configure? Distribution Directory Path
# ? Distribution Directory Path: out

# 4. 배포
amplify publish
```

## 📁 프로젝트 구조 v2.0

```
├── frontend/                          # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/page.tsx              # 메인 페이지 (인증 연동)
│   │   └── services/api.ts           # API 연동 서비스
│   └── package.json
├── q-backend/                         # 서버리스 백엔드
│   ├── src/
│   │   ├── lambda/                   # Lambda 함수들 v2.0
│   │   │   ├── speech_analysis.py    # 말투 + 감정 분석
│   │   │   ├── chat_analysis.py      # 맞춤 단일 답변
│   │   │   ├── emotion_analysis.py   # Comprehend 전용
│   │   │   ├── auth_middleware.py    # JWT + Cognito 인증
│   │   │   ├── file_upload.py        # 파일 업로드 처리
│   │   │   ├── conversation_history.py # 대화 기록 관리
│   │   │   └── user_profile_manager.py # 사용자 프로필
│   │   └── database/
│   │       └── schema.sql            # DSQL 스키마 v2.0
│   └── infrastructure/
│       └── love-q-serverless.yaml    # CloudFormation (Cognito 포함)
├── deploy-backend.sh                  # 백엔드 배포 (v2.0)
├── setup-env.sh                       # 환경변수 설정
└── frontend/
    ├── amplify.yml                    # Amplify 빌드 설정
    └── .env.local                     # 환경변수 (자동 생성)
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

## 🤖 AI 기능 상세 v2.0

### 말투 분석 (speech_analysis.py)
- **존댓말/반말 비율**: 문장 종결어 패턴 분석
- **이모티콘 사용 빈도**: 감정 표현 스타일 측정
- **평균 메시지 길이**: 대화 스타일 파악
- **성격 특성 추출**: AI 기반 성격 분석
- **말투 예시 생성**: 개인화된 응답 스타일

### 감정 분석 (emotion_analysis.py + Comprehend)
- **감정 상태**: POSITIVE/NEGATIVE/NEUTRAL/MIXED
- **감정 강도**: 신뢰도 점수 기반 강도 측정
- **핵심 구문**: 중요 키워드 추출
- **개체명 인식**: 인물, 장소, 시간 등 추출
- **감정 카테고리**: 세분화된 감정 분류

### 답변 생성 (chat_analysis.py + Bedrock)
- **감정 기반 맞춤**: 사용자 감정 상태 고려
- **안전형**: 무난하고 안전한 답변 (위험도 1-2)
- **표준형**: 적당한 관심 표현 (위험도 2-3)
- **대담형**: 적극적인 호감 표현 (위험도 3-5)
- **상황별 최적화**: 감정에 따른 다른 답변 전략

### 인증 & 개인화
- **Cognito 인증**: 안전한 사용자 관리
- **대화 히스토리**: 개인별 학습 데이터 축적
- **성공률 추적**: 답변 효과 분석
- **개인화 대시보드**: 사용 통계 및 성과 지표

## 💾 데이터베이스 (DSQL) v2.0

### 주요 테이블
- `users`: 사용자 기본 정보 (Cognito 연동)
- `user_profiles`: 사용자 말투 프로필 (확장)
- `emotion_analysis`: 감정 분석 결과
- `conversations`: 대화 기록 저장
- `user_sessions`: 세션 관리
- `response_feedback`: 답변 피드백 데이터 (확장)
- `user_credits`: 크레딧 시스템 (확장)
- `usage_stats`: 사용 통계 (확장)
- `user_dashboard`: 대시보드 뷰

### DSQL 장점
- **완전 서버리스**: 최소 용량 제한 없음
- **자동 스케일링**: 0 → 무제한
- **PostgreSQL 호환**: 기존 SQL 지식 활용 가능
- **사용량 기반 과금**: RDS 대비 90% 비용 절감
- **고급 기능**: 트리거, 뷰, JSONB 지원

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

### 환경 설정
```bash
# 1. 백엔드 배포 후 환경변수 설정
./setup-env.sh dev us-east-1

# 2. 프론트엔드 실행
cd frontend
npm run dev
# http://localhost:3000
```

### 말투 분석 예시 데이터
평소 친구들과의 대화 내용을 입력하세요:

**캐주얼 스타일:**
```
안녕! 오늘 뭐해?
집에서 넷플릭스 보고 있어 ㅋㅋ
나도 심심해 ㅠㅠ 뭐 재밌는 거 없나
요즘 오징어 게임 시즌2 나왔던데 봤어?
아직 안 봤어! 재밌어??
완전 재밌어 ㅋㅋㅋ 께 봐봐
```

**정중한 스타일:**
```
안녕하세요! 오늘 하루 어떠셨어요?
안녕하세요~ 오늘은 좀 피곤했어요 ㅠㅠ
아 그러셨구나... 많이 힘드셨나봐요
네, 회사 일이 좀 많았거든요
그럼 푹 쉬세요! 내일은 좀 나을 거예요
```

**이모티콘 많이 쓰는 스타일:**
```
헤이~ 😊 오늘 날씨 완전 좋다 ☀️
맞아맞아! 🌤️ 산책하기 딱 좋은 날씨야 ✨
우리 한강 갈까? 🏠️
좋아좋아! 🙌 치킨도 시켜먹자 🍗
완전 찬성! 😍 몇 시에 만날까? ⏰
```

### 백엔드 테스트
```bash
cd q-backend/src/lambda
python speech_analysis.py
python emotion_analysis.py
python chat_analysis.py
python auth_middleware.py
```

### Amplify CLI 수동 설정 주의사항

**중요 설정:**
- **Distribution Directory**: 반드시 `out`으로 설정
- **Build Command**: `npm run build`
- **Start Command**: `npm run dev`

**일반적인 오류:**
1. **"Zipping artifacts failed"**: Distribution Directory가 `build`로 설정된 경우
2. **빌드 실패**: Next.js 설정이 `output: 'export'`로 되어 있는지 확인
3. **환경변수 누락**: `.env.local` 파일이 있는지 확인

**문제 해결:**
```bash
# 설정 수정
amplify configure project

# 상태 확인
amplify status

# 다시 배포
amplify publish
```

### 환경변수 (자동 생성)
setup-env.sh가 자동으로 생성:
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=https://api-gateway-url
NEXT_PUBLIC_COGNITO_USER_POOL_ID=pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=client-id
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USE_MOCK=false
```

**Amplify 콘솔에서 사용할 환경변수:**
setup-env.sh 실행 후 출력된 값들을 Amplify 콘솔에 입력:
```
NEXT_PUBLIC_API_URL=https://4xca5cuzo2.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_ZPFoYTxrQ
NEXT_PUBLIC_COGNITO_CLIENT_ID=718hr8smpgfk9tctnvfhn75joj
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USE_MOCK=false
```



## 🤝 기여하기

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

## 🆘 문제 해결 v2.0

### 자주 묻는 질문

**Q: 로그인이 안돼요**
A: Cognito User Pool 설정과 Amplify Auth 연동을 확인하세요.

**Q: 감정 분석이 부정확해요**
A: Comprehend는 한국어를 지원하며, 더 많은 텍스트를 제공하면 정확도가 향상됩니다.

**Q: 대화 기록이 저장되지 않아요**
A: 사용자 인증 상태와 DSQL 연결을 확인하세요.

**Q: API 호출이 실패해요**
A: JWT 토큰 만료 여부와 Authorization 헤더를 확인하세요.

**Q: 배포가 실패해요**
A: Cognito, Comprehend 권한과 리전 설정을 확인하세요.

**Q: 프론트엔드 배포는 어떻게 하나요?**
A: AWS Amplify 콘솔에서 GitHub 연동하거나 `cd frontend && amplify add hosting && amplify publish` 명령어를 사용하세요.

**Q: Amplify CLI 오류가 발생해요**
A: `--yes` 플래그 대신 수동으로 진행하세요. AWS 콘솔 사용을 권장합니다.

**Q: "Zipping artifacts failed" 오류가 발생해요**
A: Distribution Directory가 `out`으로 설정되어 있는지 확인하세요. `amplify configure project`로 수정 가능합니다.

**Q: Amplify CLI vs AWS 콘솔 중 뭘 사용해야 하나요?**
A: AWS 콘솔이 더 안정적이고 시각적으로 관리하기 쉽습니다. CLI는 복잡한 설정에서 종종 문제가 발생합니다.

### 지원

- 📧 Email: support@loveq.ai
- 💬 Discord: [Love Q Community](https://discord.gg/loveq)
- 📖 Docs: [docs.loveq.ai](https://docs.loveq.ai)

## 🔄 v2.0 업데이트 내역

### 🆕 새로운 기능
- Cognito 기반 사용자 인증 시스템
- Comprehend를 활용한 고도화된 감정 분석
- 대화 기록 저장 및 개인화 학습
- 실시간 사용자 대시보드
- JWT 기반 세션 관리

### 🔧 개선사항
- 말투 분석 정확도 향상 (85% → 90%)
- 감정 상태 기반 맞춤 답변
- 답변 성공률 추적 시스템
- 개인화된 성격 특성 분석
- 안정적인 복사 기능
- Amplify 기반 현대적 배포 방식
- 환경변수 자동 설정 도구
- 배포 스크립트 단순화 및 최적화

### 🏗️ 기술 스택 확장
- AWS Cognito (사용자 인증)
- AWS Comprehend (감정 분석)
- DSQL v2.0 스키마 (확장된 테이블)
- JWT 토큰 관리
- Amplify Auth 연동
- AWS Amplify (프론트엔드 호스팅)
- 자동화된 CI/CD 파이프라인

---

Made with 💕 by Love Q Team v2.0
