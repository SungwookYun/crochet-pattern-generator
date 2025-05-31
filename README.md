# 🧶 코바늘 도안 생성기 (Crochet Pattern Generator)

AI를 활용한 코바늘 도안 자동 생성 웹 애플리케이션입니다.

## ✨ 주요 기능

- 📸 이미지 업로드로 코바늘 도안 자동 생성
- 🌍 다국어 지원 (한국어, 영어, 중국어, 일본어, 프랑스어)
- 🎨 원본 이미지와 도안 동시 표시
- 📱 모바일 반응형 디자인

## 🚀 로컬 실행 방법

### 필수 요구사항
- Node.js 14.0.0 이상
- npm 또는 yarn
- OpenAI API 키

### 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/[사용자명]/crochet-pattern-generator.git
cd crochet-pattern-generator
```

2. **의존성 설치**
```bash
npm install
cd client && npm install && cd ..
```

3. **환경변수 설정**
루트 디렉토리에 `.env` 파일 생성:
```
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

4. **개발 서버 실행**
```bash
npm run dev
```

5. **브라우저에서 접속**
- 로컬: http://localhost:3000
- 네트워크: http://[IP주소]:3000

## 📦 배포

### Vercel 배포
1. GitHub에 코드 푸시
2. Vercel에서 저장소 연결
3. 환경변수 `OPENAI_API_KEY` 설정
4. 자동 배포 완료

### Railway 배포
1. Railway에서 GitHub 저장소 연결
2. 환경변수 설정
3. 자동 배포 완료

## 🛠️ 기술 스택

- **Frontend**: React, TypeScript, CSS3
- **Backend**: Node.js, Express
- **AI**: OpenAI GPT-4o
- **배포**: Vercel, Railway
- **기타**: Multer (파일 업로드), CORS

## 📝 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request 

# Crochet Pattern Generator 🧶

AI 기반 코바늘 도안 생성기입니다. 완성된 작품 사진을 업로드하면 상세한 도안을 생성해줍니다.

## ✨ 주요 기능

- 📸 **이미지 업로드**: 1-3장의 코바늘 작품 사진 업로드
- 🤖 **AI 도안 생성**: OpenAI GPT-4 Vision을 이용한 상세 도안 생성
- 📱 **반응형 디자인**: 모바일/데스크톱 모두 지원
- 🎯 **다각도 분석**: 여러 장 업로드 시 3D 분석으로 더 정확한 도안

## 🌐 배포 정보

- **도메인**: [crochetain.com](https://crochetain.com)
- **호스팅**: Railway
- **프론트엔드**: React (TypeScript)
- **백엔드**: Node.js + Express
- **AI**: OpenAI GPT-4 Vision API

## 🛠️ 기술 스택

### Frontend
- React 18
- TypeScript
- TailwindCSS
- 모바일 카메라 API

### Backend
- Node.js
- Express
- Multer (파일 업로드)
- OpenAI API
- CORS 설정

## 🚀 Railway 배포

현재 Railway에서 자동 배포되며, 다음 과정을 거칩니다:

1. **빌드**: `npm run railway-build`
   - React 앱 빌드 (`cd client && npm ci && npm run build`)
   - 서버 의존성 설치 (`cd .. && npm ci`)

2. **시작**: `node server.js`
   - React 정적 파일 서빙
   - API 엔드포인트 제공

## 📁 프로젝트 구조

```
/
├── server.js              # Express 서버
├── package.json           # 서버 의존성
├── railway.json           # Railway 설정
├── client/                # React 앱
│   ├── src/
│   │   ├── App.tsx       # 메인 앱 컴포넌트
│   │   ├── components/   # UI 컴포넌트들
│   │   └── ...
│   ├── package.json      # 클라이언트 의존성
│   └── build/            # 빌드된 정적 파일
└── uploads/              # 업로드된 이미지 (자동 정리)
```

## 🔧 개발 환경 설정

### 환경변수
```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=5001
NODE_ENV=production
```

### 로컬 개발
```bash
# 전체 앱 실행
npm start

# 클라이언트만 개발 모드
npm run client

# 서버만 실행
npm run server
```

## 📊 자동 파일 관리

- **자동 정리**: 업로드된 이미지는 12시간 후 자동 삭제
- **정리 주기**: 30분마다 정기 점검
- **용량 관리**: 자동으로 오래된 파일 제거

## 🔄 업데이트 방법

1. 코드 수정
2. Git push to main branch
3. Railway 자동 배포 실행
4. [crochetain.com](https://crochetain.com)에서 확인

## 📝 API 엔드포인트

- `GET /api/health` - 서버 상태 확인
- `POST /api/generate-pattern` - 단일 이미지 도안 생성
- `POST /api/generate-multi-pattern` - 다중 이미지 도안 생성
- `GET /api/cleanup-status` - 파일 정리 상태 확인

## 🎯 향후 개선사항

- [ ] 도안 저장 기능
- [ ] 사용자 계정 시스템
- [ ] 도안 공유 기능
- [ ] 모바일 앱 개발

---

Made with ❤️ by SungwookYun 