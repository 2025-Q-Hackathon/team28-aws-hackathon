# Love Q v2.0 아키텍처 다이어그램

## 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Love Q v2.0 Architecture                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────────┐
│   Frontend      │    │   Authentication │    │        Backend              │
│   (Next.js)     │    │    (Cognito)     │    │      (Lambda + API GW)     │
│                 │    │                  │    │                             │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────────────────┐ │
│ │ Chat UI     │ │    │ │ User Pool    │ │    │ │ speech_analysis.py      │ │
│ │ Partner     │ │◄───┤ │ JWT Tokens   │ ├────┤ │ chat_analysis.py        │ │
│ │ Profile     │ │    │ │ Auth Flow    │ │    │ │ emotion_analysis.py     │ │
│ │ Room Mgmt   │ │    │ └──────────────┘ │    │ │ partner_profile_mgr.py  │ │
│ └─────────────┘ │    └──────────────────┘    │ │ chat_room_manager.py    │ │
│                 │                            │ │ conversation_history.py │ │
│ Amplify Hosting │                            │ │ user_profile_manager.py │ │
└─────────────────┘                            │ │ file_upload.py          │ │
                                               │ │ auth_middleware.py      │ │
                                               │ └─────────────────────────┘ │
                                               └─────────────────────────────┘
                                                              │
                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Data & AI Services                                │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────┤
│     DSQL        │    Bedrock      │   Comprehend    │        S3           │
│   (Database)    │   (AI Model)    │  (NLP Service)  │  (File Storage)     │
│                 │                 │                 │                     │
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────────┐ │
│ │ users       │ │ │ Claude 3.5  │ │ │ Sentiment   │ │ │ Chat Files      │ │
│ │ chat_rooms  │ │ │ Sonnet      │ │ │ Analysis    │ │ │ (Auto-delete    │ │
│ │ partners    │ │ │             │ │ │ Entity      │ │ │  after 7 days)  │ │
│ │ messages    │ │ │ Response    │ │ │ Detection   │ │ └─────────────────┘ │
│ │ profiles    │ │ │ Generation  │ │ │ Key Phrases │ │                     │
│ └─────────────┘ │ └─────────────┘ │ └─────────────┘ │                     │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────┘
```

## 데이터 플로우

```
User Request Flow:
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ User    │───▶│ Next.js │───▶│ Cognito │───▶│ API GW  │───▶│ Lambda  │
│ Input   │    │ UI      │    │ Auth    │    │         │    │ Function│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                                                                  │
                                                                  ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ User    │◄───│ Next.js │◄───│ API GW  │◄───│ Lambda  │◄───│ AI/DB   │
│ Response│    │ UI      │    │ Response│    │ Response│    │ Services│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

## 핵심 기능별 아키텍처

### 1. 말투 분석 플로우
```
Text Input → speech_analysis.py → Comprehend → DSQL → Response
     ↓              ↓                  ↓         ↓        ↓
  사용자 메시지   패턴 분석        감정 분석   프로필 저장  개인화 결과
```

### 2. 상대방 분석 플로우  
```
Partner Info → partner_profile_mgr.py → Bedrock → DSQL → Insights
     ↓                ↓                    ↓        ↓        ↓
  상대방 정보      성격 분석           AI 추론   저장    맞춤 전략
```

### 3. 답변 생성 플로우
```
Situation + User Style + Partner Info → chat_analysis.py → Bedrock → Response Options
    ↓           ↓            ↓                  ↓             ↓           ↓
  상황 설명   사용자 말투   상대방 특성        컨텍스트 구성   AI 생성   3가지 답변
```

## 보안 & 인증 플로우

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │    │   Cognito   │    │   Lambda    │
│             │    │             │    │             │
│ 1. Login    │───▶│ 2. JWT      │    │             │
│             │◄───│    Token    │    │             │
│             │    │             │    │             │
│ 3. API Call │────┼─────────────┼───▶│ 4. Verify   │
│ + JWT Token │    │             │    │   Token     │
│             │◄───┼─────────────┼────│             │
│ 6. Response │    │             │    │ 5. Process  │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 비용 최적화 아키텍처

```
Traditional RDS vs DSQL Comparison:

┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐
│           RDS Aurora                │  │              DSQL                   │
│                                     │  │                                     │
│ ┌─────────────────────────────────┐ │  │ ┌─────────────────────────────────┐ │
│ │ Always-on Instance              │ │  │ │ Serverless (0 → ∞)             │ │
│ │ Minimum: 0.5 ACU                │ │  │ │ Pay-per-request                 │ │
│ │ Cost: $40+/month                │ │  │ │ Cost: $1-5/month                │ │
│ └─────────────────────────────────┘ │  │ └─────────────────────────────────┘ │
│                                     │  │                                     │
│ Manual scaling, Backup management  │  │ Auto-scaling, Managed service       │
└─────────────────────────────────────┘  └─────────────────────────────────────┘
                                                    90% Cost Reduction! 🎉
```

## 배포 아키텍처

```
Development → Staging → Production

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dev Branch    │    │  Main Branch    │    │   Production    │
│                 │    │                 │    │                 │
│ Local Testing   │───▶│ GitHub Actions  │───▶│ AWS Amplify     │
│ Manual Deploy   │    │ Auto Deploy     │    │ Auto Deploy     │
│                 │    │                 │    │                 │
│ dev environment │    │ staging env     │    │ prod environment│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 모니터링 & 로깅

```
┌─────────────────────────────────────────────────────────────────┐
│                      CloudWatch Monitoring                      │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Lambda Logs   │   API Gateway   │        Custom Metrics       │
│                 │     Metrics     │                             │
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────────────────┐ │
│ │ Function    │ │ │ Request     │ │ │ User Engagement         │ │
│ │ Execution   │ │ │ Latency     │ │ │ Response Success Rate   │ │
│ │ Errors      │ │ │ Error Rate  │ │ │ Partner Analysis Usage  │ │
│ │ Duration    │ │ │ Throttling  │ │ │ Chat Room Activity      │ │
│ └─────────────┘ │ └─────────────┘ │ └─────────────────────────┘ │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

## 확장성 고려사항

```
Current Architecture → Future Scaling

┌─────────────────┐    ┌─────────────────┐
│   Single Region │───▶│  Multi-Region   │
│   (us-east-1)   │    │   (Global CDN)  │
└─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐
│ Memory Storage  │───▶│ DSQL Clusters   │
│ (Development)   │    │ (Production)    │
└─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐
│ Basic Analytics │───▶│ Advanced ML     │
│                 │    │ Recommendation │
└─────────────────┘    └─────────────────┘
```