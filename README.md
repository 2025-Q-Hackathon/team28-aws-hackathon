## IGRUS : LoveQ

**사용자의 말투를 학습해서 자연스러운 연애 답변을 제공하는 AI 서비스**

## **어플리케이션 개요**

### **🎯 서비스 소개**

**Love Q**는 AI 기반 연애 답변 도우미로, 사용자의 개인적인 말투를 학습하여 자연스럽고 매력적인 연애 답변을 제공하는 웹 애플리케이션입니다.

### **💡 핵심 가치 제안**

- **개인화**: 사용자만의 고유한 말투와 스타일을 반영한 맞춤형 답변
- **선택권**: 안전형/표준형/대담형 3가지 스타일로 다양한 접근 방식 제공
- **신뢰성**: 각 답변의 위험도와 성공 확률을 미리 알려주는 리스크 평가
- **학습 효과**: 지속 사용을 통한 연애 소통 능력 향상

### **🏗️ 기술 아키텍처**

```c
사용자 → Next.js 웹앱 → API Gateway → Lambda 함수들 → DSQL/S3
                                           ↓
                                    AWS Bedrock AI

```

Copy

### **🔄 사용자 플로우**

1. **프로필 생성**: 평소 메시지 샘플 업로드로 개인 말투 분석
2. **상황 입력**: 연애 상황과 상대방 정보 입력
3. **답변 생성**: AI가 3가지 스타일의 답변 옵션 제공
4. **선택 및 학습**: 위험도를 참고하여 답변 선택 후 결과 피드백

## **주요 기능**

**1. 말투 분석 📝**

- 사용자의 평소 메시지들을 분석해서 개인 대화 스타일 학습
- 존댓말/반말 비율, 이모티콘 사용 빈도, 메시지 길이, 톤 등을 파악

**2. 개인화 답변 생성 💬**

- **안전형**: 무난하고 안전한 답변 (위험도 1-2)
- **표준형**: 적당한 관심 표현 (위험도 2-3)
- **대담형**: 적극적인 호감 표현 (위험도 3-5)

**3. 상황별 맞춤 답변 🎯**

- 상대방 정보 (이름, 관계, 성격) 고려
- 이전 대화 맥락 분석
- 현재 상황에 맞는 답변 생성

**4. 리스크 평가 ⚠️**

- 각 답변의 위험도 레벨 (1-5) 표시
- AI 신뢰도 점수 (0-1) 제공
- 선택 이유와 예상 결과 설명

## 동영상 데모

## 리소스 배포하기

### **📋 사전 준비사항**

```bash
# AWS CLI 설치 및 구성
aws configure
# AWS SAM CLI 설치
pip install aws-sam-cli
# Node.js 18+ 설치 확인
node --version

```

Copy

### **🎯 1단계: 원클릭 전체 배포**

```bash
# 프로젝트 루트에서 실행chmod +x deploy-all.sh
./deploy-all.sh dev us-east-1

```

Copybash

### **🔧 2단계: 개별 배포 (선택사항)**

### **백엔드 인프라 배포**

```bash
cd q-backend/infrastructure
sam build
sam deploy --guided --parameter-overrides Environment=dev

```

Copybash

### **Lambda 함수 배포**

```bash
cd q-backend/src
zip -r lambda-functions.zip lambda/
aws lambda update-function-code --function-name love-q-speech-analysis-dev --zip-file fileb://lambda-functions.zip
aws lambda update-function-code --function-name love-q-chat-analysis-dev --zip-file fileb://lambda-functions.zip

```

Copybash

### **프론트엔드 배포**

```bash
cd frontend
npm install
npm run build
# Vercel 배포 (선택)
npx vercel --prod
# 또는 S3 정적 호스팅
aws s3 sync out/ s3://love-q-frontend-bucket --delete

```

Copybash

### **🔍 3단계: 배포 확인**

```bash
# API Gateway 엔드포인트 확인
aws apigateway get-rest-apis --query 'items[?name==`love-q-api-dev`]'

# Lambda 함수 상태 확인
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `love-q`)]'

# DSQL 클러스터 확인
aws dsql list-clusters

```

Copybash

### **⚙️ 4단계: 환경변수 설정**

```bash
# frontend/.env.local 생성echo "NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev" > frontend/.env.local
echo "NEXT_PUBLIC_USE_MOCK=false" >> frontend/.env.local

```

Copy

### **🧪 5단계: 배포 테스트**

```bash
# API 엔드포인트 테스트
curl -X POST https://your-api-url/dev/analyze-speech \
  -H "Content-Type: application/json" \
  -d '{"messages": ["안녕하세요!", "잘 지내세요?"]}'

# 프론트엔드 로컬 실행cd frontend && npm run dev

```

Copybash

### **🔄 업데이트 배포**

```bash
# 코드 변경 후 재배포
./deploy-all.sh dev us-east-1 --update

```

Copybash

## 프로젝트 기대 효과 및 예상 사용 사례

### 타겟 페르소나 👥

### 🎯 주요 타겟: "연애 초보 지민" (23세, 대학생)

**배경**:

- 연애 경험이 적어 상대방에게 어떻게 답장해야 할지 항상 고민
- 친구들에게 조언을 구하지만 매번 물어보기 부담스러움
- 카톡 답장을 30분씩 고민하다가 결국 "ㅋㅋ 그래" 같은 무난한 답변만 보냄

**니즈**:

- 자연스럽고 매력적인 답변을 빠르게 얻고 싶음
- 실수로 상대방 기분을 상하게 할까봐 걱정
- 점차 연애 스킬을 늘려가고 싶음

### **🎓 연애 스킬 학습**

- **패턴 인식**: AI 답변을 통해 상황별 적절한 대화 방식과 타이밍을 자연스럽게 학습
- **감정 표현법**: 다양한 스타일의 답변 예시를 보며 자신의 감정을 효과적으로 전달하는 방법 습득
- **위험도 판단**: 각 답변의 리스크 분석을 통해 연애에서의 적절한 선택 기준과 판단력 개발

### **💡 소통 능력 향상**

- **상대방 배려**: 상대방 정보를 고려한 맞춤 답변을 보며 타인의 입장에서 생각하는 능력 강화
- **단계별 접근**: 관계 발전 단계에 따른 적절한 소통 방식을 체계적으로 이해하고 실전 적용
- **자연스러운 대화**: 개인 말투 분석을 통해 진정성 있으면서도 매력적인 대화법 터득
