# 🚀 Vercel 배포 완전 가이드

## 📋 사전 준비사항

### 1. OpenAI API 키 준비
- [OpenAI Platform](https://platform.openai.com/account/api-keys)에서 API 키 발급
- 결제 정보 등록 필요 (사용량에 따라 과금)

### 2. GitHub 저장소 확인
- 코드가 GitHub에 푸시되어 있는지 확인
- 현재 저장소: `https://github.com/SungwookYun/crochet-pattern-generator.git`

## 🌐 Vercel 웹 인터페이스 배포

### 1단계: Vercel 계정 생성 및 로그인
1. [https://vercel.com](https://vercel.com) 접속
2. "Sign up" 또는 "Log in" 클릭
3. GitHub 계정으로 로그인

### 2단계: 새 프로젝트 생성
1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 저장소 목록에서 `crochet-pattern-generator` 선택
3. "Import" 버튼 클릭

### 3단계: 프로젝트 설정
다음과 같이 설정하세요:

```
Project Name: crochet-pattern-generator
Framework Preset: Other
Root Directory: ./
Build Command: npm run vercel-build
Output Directory: client/build
Install Command: npm install
```

### 4단계: 환경변수 설정 (중요!)
"Environment Variables" 섹션에서 다음 변수들을 추가:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `OPENAI_API_KEY` | `sk-...` | OpenAI API 키 (실제 키 입력) |
| `NODE_ENV` | `production` | 환경 설정 |
| `PORT` | `5001` | 서버 포트 |

⚠️ **중요**: `OPENAI_API_KEY`는 실제 OpenAI에서 발급받은 키를 입력해야 합니다!

### 5단계: 배포 실행
1. "Deploy" 버튼 클릭
2. 빌드 과정 모니터링 (약 2-5분 소요)
3. 성공 시 배포된 URL 확인

## 🔧 배포 후 설정

### 1. 도메인 확인
- 배포 완료 후 Vercel에서 제공하는 URL 확인
- 예: `https://crochet-pattern-generator-xxx.vercel.app`

### 2. CORS 설정 업데이트
배포된 도메인을 서버의 CORS 설정에 추가해야 합니다.

`server.js` 파일에서 다음 부분을 확인:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-vercel-app.vercel.app'  // 실제 배포된 도메인으로 변경
];
```

### 3. 환경변수 업데이트
Vercel 대시보드에서 `ALLOWED_ORIGINS` 환경변수 추가:
```
ALLOWED_ORIGINS=https://your-actual-vercel-domain.vercel.app
```

## 🐛 트러블슈팅

### 빌드 실패 시
1. **의존성 문제**: `package.json`의 의존성 확인
2. **Node.js 버전**: Vercel은 Node.js 18+ 사용
3. **빌드 명령어**: `npm run vercel-build` 명령어 확인

### API 오류 시
1. **환경변수 확인**: Vercel 대시보드에서 환경변수 재확인
2. **OpenAI API 키**: 유효한 키인지 확인
3. **크레딧**: OpenAI 계정에 충분한 크레딧이 있는지 확인

### CORS 오류 시
1. **도메인 설정**: 서버의 CORS 설정에 배포된 도메인 추가
2. **환경변수**: `ALLOWED_ORIGINS` 환경변수 설정
3. **재배포**: 설정 변경 후 재배포 필요

## 📊 모니터링

### Vercel 대시보드
- **Functions**: 서버리스 함수 로그 확인
- **Analytics**: 사용량 및 성능 모니터링
- **Deployments**: 배포 히스토리 및 로그

### 로그 확인 방법
1. Vercel 대시보드 → 프로젝트 선택
2. "Functions" 탭 → 함수 클릭
3. 실시간 로그 및 에러 확인

## 🔄 재배포

### 자동 재배포
- GitHub에 코드 푸시 시 자동으로 재배포됨
- `main` 브랜치에 푸시하면 프로덕션 배포

### 수동 재배포
1. Vercel 대시보드에서 "Redeploy" 클릭
2. 또는 GitHub에서 빈 커밋 푸시:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

## 🔒 보안 체크리스트

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있음
- [ ] 환경변수가 Vercel 대시보드에서만 설정됨
- [ ] OpenAI API 키가 안전하게 관리됨
- [ ] CORS 설정이 적절히 구성됨

## 📞 지원

문제 발생 시:
1. Vercel 대시보드의 로그 확인
2. 브라우저 개발자 도구 콘솔 확인
3. [Vercel 문서](https://vercel.com/docs) 참조
4. GitHub Issues에 문제 보고 