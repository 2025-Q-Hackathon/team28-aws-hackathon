#!/bin/bash

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}

echo "🚀 Deploying Lambda functions..."

# Create deployment packages
cd src

# Speech Analysis Function
echo "📦 Packaging speech_analysis function..."
python -m zipfile -c ../speech_analysis.zip lambda/speech_analysis.py

# Chat Analysis Function
echo "📦 Packaging chat_analysis function..."
python -m zipfile -c ../chat_analysis.zip lambda/chat_analysis.py

cd ..

# Update Lambda functions
echo "🔄 Updating Lambda functions..."

aws lambda update-function-code \
    --function-name love-q-speech-analysis-$ENVIRONMENT \
    --zip-file fileb://speech_analysis.zip \
    --region $REGION

aws lambda update-function-code \
    --function-name love-q-chat-analysis-$ENVIRONMENT \
    --zip-file fileb://chat_analysis.zip \
    --region $REGION

# Clean up
rm -f *.zip

echo "✅ Lambda functions deployed successfully!"
