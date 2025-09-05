#!/bin/bash

ENVIRONMENT=${1:-dev}
REGION=${2:-ap-northeast-2}
DB_PASSWORD=${3}

if [ -z "$DB_PASSWORD" ]; then
    echo "Usage: $0 <environment> <region> <db_password>"
    exit 1
fi

echo "🚀 Deploying Love Q Serverless Architecture..."

aws cloudformation deploy \
    --template-file love-q-serverless.yaml \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        DBPassword=$DB_PASSWORD \
    --capabilities CAPABILITY_IAM \
    --region $REGION

echo "✅ Serverless deployment completed!"

# Get outputs
API_URL=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
    --output text)

echo ""
echo "🎉 Deployment Information:"
echo "API URL: $API_URL"
echo "Frontend URL: https://$CLOUDFRONT_URL"
echo ""
echo "💰 Estimated Monthly Cost: $5-15 (vs $50-100 with ECS)"
