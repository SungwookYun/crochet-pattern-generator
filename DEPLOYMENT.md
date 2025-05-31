# 🚀 배포 가이드

## 📋 배포 플랫폼

이 프로젝트는 다음 플랫폼에 배포할 수 있습니다:

1. **Vercel** (프론트엔드 + 서버리스 백엔드)
2. **Railway** (풀스택 배포)

## 🔧 사전 준비

### 1. OpenAI API 키 준비
- [OpenAI Platform](https://platform.openai.com/account/api-keys)에서 API 키 발급
- 결제 정보 등록 필요 (사용량에 따라 과금)

### 2. GitHub 저장소 연결
```bash
git remote add origin https://github.com/[사용자명]/crochet-pattern-generator.git
git push -u origin main
```

## 🌐 Vercel 배포

### 1. Vercel 계정 생성 및 연결
1. [Vercel](https://vercel.com) 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭
4. GitHub 저장소 선택

### 2. 환경변수 설정
Vercel 대시보드에서 다음 환경변수 설정:
```
OPENAI_API_KEY=your_actual_openai_api_key
NODE_ENV=production
PORT=5001
```

### 3. 배포 설정
- Build Command: `npm run vercel-build`
- Output Directory: `client/build`
- Install Command: `npm install`

## 🚂 Railway 배포

### 1. Railway 계정 생성
1. [Railway](https://railway.app) 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭
4. "Deploy from GitHub repo" 선택

### 2. 환경변수 설정
Railway 대시보드에서 다음 환경변수 설정:
```
OPENAI_API_KEY=your_actual_openai_api_key
NODE_ENV=production
```

### 3. 도메인 설정
- Railway에서 자동으로 도메인 생성
- 커스텀 도메인 연결 가능

## 🔒 보안 설정

### 환경변수 보안
- `.env` 파일은 절대 Git에 커밋하지 마세요
- 각 플랫폼의 환경변수 설정 기능 사용
- API 키는 정기적으로 교체

### CORS 설정
서버에서 배포된 도메인을 CORS에 추가:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-vercel-app.vercel.app',
  'https://your-railway-app.railway.app'
];
```

## 📊 모니터링

### Vercel
- 대시보드에서 배포 로그 확인
- Analytics 기능으로 사용량 모니터링

### Railway
- 대시보드에서 실시간 로그 확인
- 메트릭스로 성능 모니터링

## 🐛 트러블슈팅

### 일반적인 문제
1. **빌드 실패**: `npm install` 후 `npm run build` 로컬 테스트
2. **API 오류**: OpenAI API 키 및 크레딧 확인
3. **CORS 오류**: 배포된 도메인이 서버 CORS 설정에 포함되었는지 확인

### 로그 확인
- Vercel: Functions 탭에서 서버리스 함수 로그 확인
- Railway: Deployments 탭에서 실시간 로그 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 환경변수 설정
2. 빌드 로그
3. 브라우저 개발자 도구 콘솔
4. 플랫폼별 문서 