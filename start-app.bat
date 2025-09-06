@echo off
echo Love Q 애플리케이션 시작...

echo 1. 백엔드 Lambda 함수 업데이트 중...
cd q-backend
if exist lambda-package.zip del lambda-package.zip
powershell -Command "Compress-Archive -Path src\lambda\*.py, src\requirements.txt -DestinationPath lambda-package.zip -Force"
aws lambda update-function-code --function-name love-q-speech-analysis-dev --zip-file fileb://lambda-package.zip
aws lambda update-function-code --function-name love-q-chat-analysis-dev --zip-file fileb://lambda-package.zip

echo 2. 프론트엔드 시작 중...
cd ..\frontend
start cmd /k "npm install && npm run dev"

echo 애플리케이션이 시작되었습니다!
echo 프론트엔드: http://localhost:3000
echo API: https://xptl7wpush.execute-api.us-east-1.amazonaws.com/dev

pause