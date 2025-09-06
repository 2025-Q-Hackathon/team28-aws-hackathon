#!/bin/bash

# 프론트엔드 배포 스크립트
set -e

# AWS CLI 페이저 비활성화
export AWS_PAGER=""

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}

echo "🌐 프론트엔드 배포 시작 - Environment: $ENVIRONMENT, Region: $REGION"

# API Gateway URL 가져오기
API_URL=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

if [ -z "$API_URL" ]; then
    echo "❌ API Gateway URL을 찾을 수 없습니다. 백엔드를 먼저 배포하세요."
    echo "./deploy-backend.sh $ENVIRONMENT $REGION"
    exit 1
fi

echo "✅ API Gateway URL: $API_URL"

# 프론트엔드 디렉토리로 이동
cd frontend

# 환경변수 설정
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_USE_MOCK=false
EOF

echo "✅ 환경변수 설정 완료"

# 빌드
echo "🏗️ Next.js 빌드 중..."
npm install
npm run build

# S3 정보 가져오기
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
    --output text)

FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
    --output text)

# S3 업로드
echo "📤 S3에 업로드 중..."
if [ -d "out" ]; then
    aws s3 sync out/ s3://$FRONTEND_BUCKET --delete --region $REGION
    echo "✅ 업로드 완료!"
    
    echo ""
    echo "🎉 프론트엔드 배포 완료!"
    echo "🌐 웹사이트 URL: $FRONTEND_URL"
    echo "📤 S3 버킷: $FRONTEND_BUCKET"
else
    echo "❌ out 폴더가 없습니다. 빌드를 확인하세요."
    exit 1
fi