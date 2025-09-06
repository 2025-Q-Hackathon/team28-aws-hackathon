@echo off
echo 백엔드 배포 시작...

cd q-backend

echo Lambda 함수 패키징 중...
if exist lambda-package.zip del lambda-package.zip

powershell -Command "Compress-Archive -Path src\lambda\*.py, src\requirements.txt -DestinationPath lambda-package.zip -Force"

echo Lambda 함수 업데이트 중...
aws lambda update-function-code --function-name love-q-speech-analysis-dev --zip-file fileb://lambda-package.zip
aws lambda update-function-code --function-name love-q-chat-analysis-dev --zip-file fileb://lambda-package.zip

echo 백엔드 배포 완료!
pause