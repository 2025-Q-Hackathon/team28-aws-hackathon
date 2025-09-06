#!/bin/bash

# Love Q v2.0 백엔드 배포 스크립트 (Cognito + DSQL + Comprehend)
set -e

# AWS CLI 페이저 비활성화
export AWS_PAGER=""

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}

echo "🚀 Love Q v2.0 백엔드 배포 시작 - Environment: $ENVIRONMENT, Region: $REGION"
echo "   - Cognito 사용자 인증"
echo "   - DSQL 데이터베이스"
echo "   - Comprehend 감정 분석"
echo "   - 4개 Lambda 함수"

# 1. 인프라 배포
echo "📦 CloudFormation 스택 배포 중..."
cd q-backend/infrastructure

aws cloudformation deploy \
    --template-file love-q-serverless.yaml \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --parameter-overrides Environment=$ENVIRONMENT \
    --capabilities CAPABILITY_IAM \
    --region $REGION

echo "✅ 인프라 배포 완료!"

# 2. Lambda 함수 배포 (v2.0 - 4개 함수)
echo "🔧 Lambda 함수 배포 중..."
cd ../src

# Python 명령어 확인
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "⚠️ Python이 설치되지 않았습니다. Lambda 함수 배포를 건너뛉니다."
    cd ..
    # API URL 출력만 수행
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name love-q-serverless-$ENVIRONMENT \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
        --output text)
    
    COGNITO_POOL=$(aws cloudformation describe-stacks \
        --stack-name love-q-serverless-$ENVIRONMENT \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' \
        --output text)
    
    echo ""
    echo "🎉 백엔드 배포 완료!"
    echo "📋 API Gateway URL: $API_URL"
    echo "🔐 Cognito User Pool: $COGNITO_POOL"
    echo ""
    echo "🌐 다음 단계: 프론트엔드 배포"
    echo "./deploy-frontend.sh $ENVIRONMENT $REGION"
    exit 0
fi

# v2.0 Lambda 함수 패키징
echo "📦 v2.0 Lambda 함수 패키징 중..."
$PYTHON_CMD -m zipfile -c ../speech_analysis.zip lambda/speech_analysis.py
$PYTHON_CMD -m zipfile -c ../chat_analysis.zip lambda/chat_analysis.py
$PYTHON_CMD -m zipfile -c ../emotion_analysis.zip lambda/emotion_analysis.py
$PYTHON_CMD -m zipfile -c ../auth_middleware.zip lambda/auth_middleware.py

cd ..

# v2.0 함수 업데이트
echo "🔄 speech_analysis 함수 업데이트 중..."
aws lambda update-function-code \
    --function-name love-q-speech-analysis-$ENVIRONMENT \
    --zip-file fileb://speech_analysis.zip \
    --region $REGION \
    --output text > /dev/null

echo "🔄 chat_analysis 함수 업데이트 중..."
aws lambda update-function-code \
    --function-name love-q-chat-analysis-$ENVIRONMENT \
    --zip-file fileb://chat_analysis.zip \
    --region $REGION \
    --output text > /dev/null

echo "🔄 emotion_analysis 함수 업데이트 중..."
aws lambda update-function-code \
    --function-name love-q-emotion-analysis-$ENVIRONMENT \
    --zip-file fileb://emotion_analysis.zip \
    --region $REGION \
    --output text > /dev/null

echo "🔄 auth_middleware 함수 업데이트 중..."
aws lambda update-function-code \
    --function-name love-q-auth-middleware-$ENVIRONMENT \
    --zip-file fileb://auth_middleware.zip \
    --region $REGION \
    --output text > /dev/null

rm -f *.zip

echo "✅ v2.0 Lambda 함수 배포 완료! (4개 함수)"

# 3. v2.0 배포 정보 출력
API_URL=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

COGNITO_POOL=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' \
    --output text)

COGNITO_CLIENT=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoClientId`].OutputValue' \
    --output text)

DSQL_CLUSTER=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DSQLClusterName`].OutputValue' \
    --output text)

echo ""
echo "🎉 Love Q v2.0 백엔드 배포 완료!"
echo "📋 API Gateway URL: $API_URL"
echo "🔐 Cognito User Pool: $COGNITO_POOL"
echo "🔑 Cognito Client ID: $COGNITO_CLIENT"
echo "💾 DSQL Cluster: $DSQL_CLUSTER"
echo "🤖 Lambda 함수: 4개 (speech, chat, emotion, auth)"
echo ""
echo "🌐 다음 단계: 프론트엔드 배포"
echo "./setup-env.sh $ENVIRONMENT $REGION"