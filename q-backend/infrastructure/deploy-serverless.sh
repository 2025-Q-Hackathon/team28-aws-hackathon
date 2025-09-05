#!/bin/bash

ENVIRONMENT=${1:-dev}
REGION=${2:-ap-northeast-2}

echo "🚀 Deploying Love Q with DSQL..."

aws cloudformation deploy \
    --template-file love-q-serverless.yaml \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --parameter-overrides Environment=$ENVIRONMENT \
    --capabilities CAPABILITY_IAM \
    --region $REGION

echo "✅ DSQL deployment completed!"

# Get outputs
API_URL=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

DSQL_ARN=$(aws cloudformation describe-stacks \
    --stack-name love-q-serverless-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DSQLClusterArn`].OutputValue' \
    --output text)

echo ""
echo "🎉 Deployment Information:"
echo "API URL: $API_URL"
echo "DSQL Cluster: $DSQL_ARN"
echo "💰 Estimated Cost: $1-5/month (90% savings vs RDS)"
