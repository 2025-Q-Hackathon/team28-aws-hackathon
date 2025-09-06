#!/bin/bash

# Love Q v2.0 환경변수 설정 스크립트
set -e

export AWS_PAGER=""

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}

echo "⚙️ Love Q v2.0 환경변수 설정 - Environment: $ENVIRONMENT, Region: $REGION"

# 백엔드 정보 가져오기
API_URL=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

if [ -z "$API_URL" ]; then
    echo "❌ 백엔드를 먼저 배포하세요: ./deploy-backend.sh $ENVIRONMENT $REGION"
    exit 1
fi

COGNITO_USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' \
    --output text)

COGNITO_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoClientId`].OutputValue' \
    --output text)

# 환경변수 파일 생성
cd frontend
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
NEXT_PUBLIC_AWS_REGION=$REGION
EOF

echo "✅ 환경변수 설정 완료!"
echo ""
echo "📋 Amplify 환경변수 (콘솔에서 설정):"
echo "NEXT_PUBLIC_API_URL=$API_URL"
echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID"
echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID"
echo "NEXT_PUBLIC_AWS_REGION=$REGION"
echo "NEXT_PUBLIC_USE_MOCK=false"
echo ""
echo "🚀 로컬 개발: cd frontend && npm run dev"