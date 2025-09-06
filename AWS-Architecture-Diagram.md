# Love Q - AWS 솔루션 아키텍처 다이어그램

## 🏗️ AWS 공식 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    AWS Cloud                                        │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              Region: us-east-1                              │   │
│  │                                                                             │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                        Availability Zone A                          │   │   │
│  │  │                                                                     │   │   │
│  │  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │   │   │
│  │  │  │   AWS Amplify   │    │  Amazon Cognito │    │ Amazon S3 Bucket│ │   │   │
│  │  │  │                 │    │                 │    │                 │ │   │   │
│  │  │  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │ │   │   │
│  │  │  │ │  Next.js    │ │    │ │ User Pool   │ │    │ │ File Storage│ │ │   │   │
│  │  │  │ │  Frontend   │ │    │ │ JWT Tokens  │ │    │ │ 7-day TTL   │ │ │   │   │
│  │  │  │ │  Hosting    │ │    │ │ Auth Flow   │ │    │ │ Lifecycle   │ │ │   │   │
│  │  │  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │ │   │   │
│  │  │  └─────────────────┘    └─────────────────┘    └─────────────────┘ │   │   │
│  │  │           │                       │                       │        │   │   │
│  │  │           │                       │                       │        │   │   │
│  │  │  ┌────────▼───────────────────────▼───────────────────────▼──────┐ │   │   │
│  │  │  │                    Amazon API Gateway                         │ │   │   │
│  │  │  │                                                               │ │   │   │
│  │  │  │  ┌─────────────────────────────────────────────────────────┐  │ │   │   │
│  │  │  │  │                REST API Endpoints                      │  │ │   │   │
│  │  │  │  │                                                         │  │ │   │   │
│  │  │  │  │ POST /analyze-speech     GET /chat-rooms               │  │ │   │   │
│  │  │  │  │ POST /analyze            POST /chat-rooms              │  │ │   │   │
│  │  │  │  │ POST /process-file       PUT /chat-rooms               │  │ │   │   │
│  │  │  │  │ GET /partner-profile     DELETE /chat-rooms            │  │ │   │   │
│  │  │  │  │ POST /partner-profile    GET /conversation-history     │  │ │   │   │
│  │  │  │  │ PUT /partner-profile     POST /conversation-history    │  │ │   │   │
│  │  │  │  │ DELETE /partner-profile  GET /user-profile             │  │ │   │   │
│  │  │  │  └─────────────────────────────────────────────────────────┘  │ │   │   │
│  │  │  └──────────────────────────┬────────────────────────────────────┘ │   │   │
│  │  │                             │                                      │   │   │
│  │  │  ┌──────────────────────────▼────────────────────────────────────┐ │   │   │
│  │  │  │                    AWS Lambda Functions                       │ │   │   │
│  │  │  │                                                               │ │   │   │
│  │  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │ │   │   │
│  │  │  │  │speech_      │  │chat_        │  │emotion_analysis     │   │ │   │   │
│  │  │  │  │analysis     │  │analysis     │  │                     │   │ │   │   │
│  │  │  │  │             │  │             │  │ ┌─────────────────┐ │   │ │   │   │
│  │  │  │  │Python 3.9   │  │Python 3.9   │  │ │ Amazon         │ │   │ │   │   │
│  │  │  │  │30s timeout  │  │60s timeout  │  │ │ Comprehend     │ │   │ │   │   │
│  │  │  │  └─────────────┘  └─────────────┘  │ │ NLP Service    │ │   │ │   │   │
│  │  │  │                                    │ └─────────────────┘ │   │ │   │   │
│  │  │  │  ┌─────────────┐  ┌─────────────┐  └─────────────────────┘   │ │   │   │
│  │  │  │  │auth_        │  │file_upload  │                            │ │   │   │
│  │  │  │  │middleware   │  │             │  ┌─────────────────────┐   │ │   │   │
│  │  │  │  │             │  │             │  │partner_profile_     │   │ │   │   │
│  │  │  │  │JWT Auth     │  │S3 Upload    │  │manager              │   │ │   │   │
│  │  │  │  │15s timeout  │  │60s timeout  │  │                     │   │ │   │   │
│  │  │  │  └─────────────┘  └─────────────┘  │Python 3.9           │   │ │   │   │
│  │  │  │                                    │30s timeout          │   │ │   │   │
│  │  │  │  ┌─────────────┐  ┌─────────────┐  └─────────────────────┘   │ │   │   │
│  │  │  │  │conversation_│  │user_profile_│                            │ │   │   │
│  │  │  │  │history      │  │manager      │  ┌─────────────────────┐   │ │   │   │
│  │  │  │  │             │  │             │  │chat_room_manager    │   │ │   │   │
│  │  │  │  │DSQL Access  │  │DSQL Access  │  │                     │   │ │   │   │
│  │  │  │  │30s timeout  │  │30s timeout  │  │DSQL Access          │   │ │   │   │
│  │  │  │  └─────────────┘  └─────────────┘  │30s timeout          │   │ │   │   │
│  │  │  │                                    └─────────────────────┘   │ │   │   │
│  │  │  └───────────────────────┬───────────────────────────────────────┘ │   │   │
│  │  │                          │                                         │   │   │
│  │  │  ┌───────────────────────▼───────────────────────────────────────┐ │   │   │
│  │  │  │                    Amazon Bedrock                             │ │   │   │
│  │  │  │                                                               │ │   │   │
│  │  │  │  ┌─────────────────────────────────────────────────────────┐  │ │   │   │
│  │  │  │  │                Claude 3.5 Sonnet                       │  │ │   │   │
│  │  │  │  │                                                         │  │ │   │   │
│  │  │  │  │  • 상대방 특성 분석                                      │  │ │   │   │
│  │  │  │  │  • 맞춤형 답변 생성                                      │  │ │   │   │
│  │  │  │  │  • 3가지 위험도별 옵션                                   │  │ │   │   │
│  │  │  │  │  • 한국어 최적화                                         │  │ │   │   │
│  │  │  │  └─────────────────────────────────────────────────────────┘  │ │   │   │
│  │  │  └───────────────────────────────────────────────────────────────┘ │   │   │
│  │  │                                                                     │   │   │
│  │  │  ┌───────────────────────────────────────────────────────────────┐ │   │   │
│  │  │  │                      Amazon DSQL                             │ │   │   │
│  │  │  │                                                               │ │   │   │
│  │  │  │  ┌─────────────────────────────────────────────────────────┐  │ │   │   │
│  │  │  │  │              Serverless Database                        │  │ │   │   │
│  │  │  │  │                                                         │  │ │   │   │
│  │  │  │  │  Tables:                                                │  │ │   │   │
│  │  │  │  │  • users                                                │  │ │   │   │
│  │  │  │  │  • user_profiles                                        │  │ │   │   │
│  │  │  │  │  • partner_profiles                                     │  │ │   │   │
│  │  │  │  │  • chat_rooms                                           │  │ │   │   │
│  │  │  │  │  • conversations                                        │  │ │   │   │
│  │  │  │  │  • emotion_analysis                                     │  │ │   │   │
│  │  │  │  │                                                         │  │ │   │   │
│  │  │  │  │  Features:                                              │  │ │   │   │
│  │  │  │  │  • Auto-scaling (0 → ∞)                                │  │ │   │   │
│  │  │  │  │  • PostgreSQL Compatible                               │  │ │   │   │
│  │  │  │  │  • Pay-per-request                                     │  │ │   │   │
│  │  │  │  │  • 90% cost reduction vs RDS                          │  │ │   │   │
│  │  │  │  └─────────────────────────────────────────────────────────┘  │ │   │   │
│  │  │  └───────────────────────────────────────────────────────────────┘ │   │   │
│  │  └─────────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              Security & Monitoring                          │   │
│  │                                                                             │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │   │
│  │  │       IAM       │    │   CloudWatch    │    │    AWS CloudFormation  │ │   │
│  │  │                 │    │                 │    │                         │ │   │
│  │  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────────────┐ │ │   │
│  │  │ │ Roles &     │ │    │ │ Logs &      │ │    │ │ Infrastructure      │ │ │   │
│  │  │ │ Policies    │ │    │ │ Metrics     │ │    │ │ as Code             │ │ │   │
│  │  │ │             │ │    │ │             │ │    │ │                     │ │ │   │
│  │  │ │ • Lambda    │ │    │ │ • Function  │ │    │ │ • Automated Deploy  │ │ │   │
│  │  │ │   Execution │ │    │ │   Logs      │ │    │ │ • Resource Mgmt     │ │ │   │
│  │  │ │ • DSQL      │ │    │ │ • API       │ │    │ │ • Environment       │ │ │   │
│  │  │ │   Access    │ │    │ │   Metrics   │ │    │ │   Variables         │ │ │   │
│  │  │ │ • S3 Bucket │ │    │ │ • Error     │ │    │ │ • Output Values     │ │ │   │
│  │  │ │   Access    │ │    │ │   Tracking  │ │    │ │                     │ │ │   │
│  │  │ │ • Bedrock   │ │    │ │ • Alarms    │ │    │ │                     │ │ │   │
│  │  │ │   Access    │ │    │ │             │ │    │ │                     │ │ │   │
│  │  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────────────┘ │ │   │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                    Internet
                                        │
                                        ▼
                              ┌─────────────────┐
                              │      Users      │
                              │                 │
                              │ ┌─────────────┐ │
                              │ │   Browser   │ │
                              │ │   Mobile    │ │
                              │ │   Desktop   │ │
                              │ └─────────────┘ │
                              └─────────────────┘
```

## 🔄 데이터 플로우 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Request Flow Diagram                                   │
└─────────────────────────────────────────────────────────────────────────────────────┘

User Request:
┌─────────┐    HTTPS    ┌─────────┐    Auth     ┌─────────┐    REST     ┌─────────┐
│ Browser │─────────────▶│ Amplify │─────────────▶│ Cognito │─────────────▶│API Gateway│
│         │              │Frontend │              │         │              │         │
└─────────┘              └─────────┘              └─────────┘              └─────────┘
                                                       │                        │
                                                       ▼                        ▼
                                                 ┌─────────┐              ┌─────────┐
                                                 │JWT Token│              │ Lambda  │
                                                 │Validation│              │Function │
                                                 └─────────┘              └─────────┘
                                                                               │
                                                                               ▼
AI Processing:                                                          ┌─────────┐
┌─────────┐    Invoke    ┌─────────┐    Query     ┌─────────┐          │ Business│
│ Lambda  │─────────────▶│Bedrock  │─────────────▶│Claude   │          │ Logic   │
│Function │              │Service  │              │3.5 Model│          └─────────┘
└─────────┘              └─────────┘              └─────────┘               │
     │                                                 │                   ▼
     ▼                                                 ▼             ┌─────────┐
┌─────────┐              ┌─────────┐              ┌─────────┐        │  DSQL   │
│Comprehend│              │   S3    │              │Response │        │Database │
│NLP      │              │ Bucket  │              │Generation│        └─────────┘
└─────────┘              └─────────┘              └─────────┘

Response Flow:
┌─────────┐    JSON      ┌─────────┐    HTTPS     ┌─────────┐    Render   ┌─────────┐
│ Lambda  │─────────────▶│API      │─────────────▶│ Amplify │─────────────▶│ Browser │
│Response │              │Gateway  │              │Frontend │              │  UI     │
└─────────┘              └─────────┘              └─────────┘              └─────────┘
```

## 📊 AWS 서비스 매핑

| AWS 서비스 | 역할 | 구성 요소 |
|-----------|------|----------|
| **AWS Amplify** | 프론트엔드 호스팅 | Next.js, React, TypeScript |
| **Amazon Cognito** | 사용자 인증 | User Pool, JWT, Auth Flow |
| **Amazon API Gateway** | API 관리 | REST API, CORS, Rate Limiting |
| **AWS Lambda** | 서버리스 컴퓨팅 | 9개 함수, Python 3.9 |
| **Amazon Bedrock** | AI/ML 서비스 | Claude 3.5 Sonnet |
| **Amazon Comprehend** | 자연어 처리 | 감정 분석, 개체명 인식 |
| **Amazon DSQL** | 서버리스 DB | PostgreSQL 호환 |
| **Amazon S3** | 객체 스토리지 | 파일 저장, Lifecycle |
| **AWS IAM** | 권한 관리 | 역할, 정책, 최소 권한 |
| **Amazon CloudWatch** | 모니터링 | 로그, 메트릭, 알람 |
| **AWS CloudFormation** | IaC | 인프라 자동화 |

## 🔐 보안 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Security Layers                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: Network Security                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • HTTPS/TLS 1.2+ Encryption                            │   │
│  │ • API Gateway CORS Configuration                       │   │
│  │ • VPC Endpoints (Future)                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 2: Authentication & Authorization                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Cognito User Pool Authentication                     │   │
│  │ • JWT Token Validation                                 │   │
│  │ • IAM Role-based Access Control                        │   │
│  │ • Lambda Authorizer (Custom Auth)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 3: Data Protection                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • DSQL Encryption at Rest                              │   │
│  │ • S3 Server-Side Encryption (AES-256)                  │   │
│  │ • Lambda Environment Variables Encryption              │   │
│  │ • Automatic Data Deletion (7-day TTL)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 4: Application Security                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Input Validation & Sanitization                      │   │
│  │ • SQL Injection Prevention                             │   │
│  │ • XSS Protection                                       │   │
│  │ • Rate Limiting & Throttling                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 💰 비용 최적화 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cost Optimization Strategy                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Serverless-First Approach:                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Lambda: Pay-per-request (no idle costs)              │   │
│  │ • DSQL: Pay-per-query (vs $40+/month RDS)             │   │
│  │ • API Gateway: Pay-per-call                            │   │
│  │ • S3: Pay-per-storage + lifecycle policies             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Resource Optimization:                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Lambda Concurrent Execution Limit: 10                │   │
│  │ • S3 Lifecycle: Auto-delete after 7 days               │   │
│  │ • API Gateway Caching: Reduce backend calls            │   │
│  │ • CloudWatch Log Retention: 30 days                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Cost Monitoring:                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • AWS Cost Explorer Integration                         │   │
│  │ • Budget Alerts ($50/month threshold)                   │   │
│  │ • Resource Tagging for Cost Allocation                  │   │
│  │ • Monthly Cost Review & Optimization                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Estimated Monthly Cost: $1-5 (vs $40+ traditional)           │
│  Cost Reduction: 90%+ 🎉                                      │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 배포 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                      Deployment Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Infrastructure as Code (IaC):                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐ │   │
│  │  │ CloudFormation  │───▶│     AWS Resources           │ │   │
│  │  │ Template        │    │                             │ │   │
│  │  │                 │    │ • Lambda Functions          │ │   │
│  │  │ • Parameters    │    │ • API Gateway               │ │   │
│  │  │ • Resources     │    │ • Cognito User Pool         │ │   │
│  │  │ • Outputs       │    │ • DSQL Cluster              │ │   │
│  │  │ • Mappings      │    │ • S3 Bucket                 │ │   │
│  │  └─────────────────┘    │ • IAM Roles                 │ │   │
│  │                         └─────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Automated Deployment Pipeline:                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  Developer ──▶ Git Push ──▶ deploy-backend.sh ──▶ AWS  │   │
│  │      │              │              │              │    │   │
│  │      ▼              ▼              ▼              ▼    │   │
│  │  Code Review   GitHub Repo   Shell Script    CloudFormation │
│  │                                   │                    │   │
│  │                                   ▼                    │   │
│  │                            Lambda Package              │   │
│  │                            & Deploy                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Environment Management:                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Development: love-q-serverless-dev                   │   │
│  │ • Staging: love-q-serverless-staging (Future)          │   │
│  │ • Production: love-q-serverless-prod (Future)          │   │
│  │                                                         │   │
│  │ • Environment Variables Auto-Configuration             │   │
│  │ • Resource Naming Convention                           │   │
│  │ • Cross-Environment Promotion                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

**이 다이어그램은 AWS Well-Architected Framework를 기반으로 설계되었습니다.**

- **운영 우수성**: CloudFormation IaC, 자동화된 배포
- **보안**: 다층 보안, 최소 권한 원칙
- **안정성**: 서버리스 아키텍처, 자동 복구
- **성능 효율성**: 적절한 서비스 선택, 캐싱
- **비용 최적화**: 사용량 기반 과금, 90% 비용 절감
- **지속 가능성**: 서버리스로 탄소 발자국 최소화