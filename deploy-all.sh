#!/bin/bash

# Love Q 전체 배포 스크립트
set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}

echo "🚀 Love Q 배포 시작 - Environment: $ENVIRONMENT, Region: $REGION"

# 1. 인프라 배포
echo "📦 1. 인프라 배포 중..."
cd q-backend/infrastructure
./deploy-serverless.sh $ENVIRONMENT $REGION

# CloudFormation 스택 완료 대기
echo "⏳ CloudFormation 스택 배포 완료 대기..."
aws cloudformation wait stack-create-complete \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION || \
aws cloudformation wait stack-update-complete \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION

# API Gateway URL 가져오기
API_URL=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

echo "✅ API Gateway URL: $API_URL"

# 2. Lambda 함수 배포
echo "🔧 2. Lambda 함수 배포 중..."
cd ../
./deploy-lambda.sh $ENVIRONMENT $REGION

# 3. 프론트엔드 환경변수 업데이트
echo "🌐 3. 프론트엔드 환경변수 업데이트..."
cd ../frontend
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_USE_MOCK=false
EOF

# 4. 프론트엔드 빌드 및 배포
echo "🏗️ 4. 프론트엔드 빌드 및 S3 배포..."
npm install
npm run build

# S3 버킷 이름 가져오기
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
    --output text)

# 프론트엔드 URL 가져오기
FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
    --output text)

# S3에 빌드 파일 업로드
echo "📤 S3에 프론트엔드 파일 업로드 중..."
aws s3 sync out/ s3://$FRONTEND_BUCKET --delete --region $REGION

echo "🎉 배포 완료!"
echo "📋 배포 정보:"
echo "   - Environment: $ENVIRONMENT"
echo "   - Region: $REGION"
echo "   - API URL: $API_URL"
echo "   - Frontend URL: $FRONTEND_URL"
echo "   - S3 Bucket: $FRONTEND_BUCKET"

echo ""
echo "🌐 접속 방법:"
echo "브라우저에서 $FRONTEND_URL 접속"
echo ""
echo "🔧 로컬 개발:"
echo "cd frontend && npm run dev (http://localhost:3000)"
