@echo off
echo 🧶 코바늘 도안 생성기 시작 중...
echo.

REM 현재 디렉토리를 스크립트 위치로 변경
cd /d "%~dp0"

REM Node.js 설치 확인
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js가 설치되지 않았습니다.
    echo Node.js를 설치해주세요: https://nodejs.org
    pause
    exit /b 1
)

REM 의존성 설치 확인
if not exist "node_modules" (
    echo 📦 서버 의존성 설치 중...
    npm install
)

if not exist "client\node_modules" (
    echo 📦 클라이언트 의존성 설치 중...
    cd client
    npm install
    cd ..
)

REM .env 파일 확인
if not exist ".env" (
    echo ⚠️  .env 파일이 없습니다.
    echo 다음 내용으로 .env 파일을 생성해주세요:
    echo.
    echo OPENAI_API_KEY=your_openai_api_key_here
    echo NODE_ENV=development
    echo.
    pause
)

REM 서버 시작
echo 🚀 서버 시작 중...
echo.
echo 브라우저에서 다음 주소로 접속하세요:
echo - 로컬: http://localhost:3000
echo - 네트워크: http://192.168.0.32:3000
echo.
echo 종료하려면 Ctrl+C를 누르세요.
echo.

npm run dev

pause 