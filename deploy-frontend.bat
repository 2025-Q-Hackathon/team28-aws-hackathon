@echo off
echo 프론트엔드 배포 시작...

cd frontend

echo 의존성 설치 중...
npm install

echo 프로젝트 빌드 중...
npm run build

echo 개발 서버 시작...
npm run dev

pause