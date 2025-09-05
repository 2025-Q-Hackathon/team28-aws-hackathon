#!/bin/bash

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}

echo "🚀 Deploying Lambda functions..."

# Create deployment packages
cd src

# Chat Analysis Function
echo "📦 Packaging chat_analysis function..."
zip -r ../chat_analysis.zip lambda/chat_analysis.py
pip install -r requirements.txt -t ./temp
cd temp && zip -r ../../chat_analysis.zip . && cd ..
rm -rf temp

# File Upload Function  
echo "📦 Packaging file_upload function..."
zip -r ../file_upload.zip lambda/file_upload.py
pip install -r requirements.txt -t ./temp
cd temp && zip -r ../../file_upload.zip . && cd ..
rm -rf temp

# User Profile Function
echo "📦 Packaging user_profile function..."
zip -r ../user_profile.zip lambda/user_profile.py
pip install -r requirements.txt -t ./temp
cd temp && zip -r ../../user_profile.zip . && cd ..
rm -rf temp

cd ..

# Update Lambda functions
echo "🔄 Updating Lambda functions..."

aws lambda update-function-code \
    --function-name love-q-chat-analysis-$ENVIRONMENT \
    --zip-file fileb://chat_analysis.zip \
    --region $REGION

aws lambda update-function-code \
    --function-name love-q-file-upload-$ENVIRONMENT \
    --zip-file fileb://file_upload.zip \
    --region $REGION

aws lambda update-function-code \
    --function-name love-q-user-profile-$ENVIRONMENT \
    --zip-file fileb://user_profile.zip \
    --region $REGION

# Clean up
rm -f *.zip

echo "✅ Lambda functions deployed successfully!"
