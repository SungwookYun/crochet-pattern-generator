# 🔧 Vercel 환경변수 설정 체크리스트

## 필수 환경변수

Vercel 대시보드의 "Settings" → "Environment Variables"에서 다음 변수들을 설정하세요:

### 1. OPENAI_API_KEY
- **값**: `sk-proj-...` (실제 OpenAI API 키)
- **환경**: Production, Preview, Development 모두 체크
- **설명**: OpenAI GPT-4 Vision API 사용을 위한 키

### 2. NODE_ENV
- **값**: `production`
- **환경**: Production만 체크
- **설명**: 프로덕션 환경 설정

### 3. PORT
- **값**: `5001`
- **환경**: Production, Preview, Development 모두 체크
- **설명**: 서버 포트 설정

## 선택적 환경변수

### 4. ALLOWED_ORIGINS (배포 후 설정)
- **값**: `https://your-actual-vercel-domain.vercel.app`
- **환경**: Production만 체크
- **설명**: CORS 허용 도메인 (배포 완료 후 실제 도메인으로 설정)

## 설정 방법

1. Vercel 대시보드에서 프로젝트 선택
2. "Settings" 탭 클릭
3. "Environment Variables" 메뉴 선택
4. "Add New" 버튼 클릭
5. 변수명과 값 입력
6. 적용할 환경 선택 (Production, Preview, Development)
7. "Save" 클릭

## 주의사항

⚠️ **보안 주의사항**:
- API 키는 절대 GitHub에 커밋하지 마세요
- 환경변수 설정 후 반드시 재배포하세요
- API 키는 정기적으로 교체하세요

✅ **설정 확인**:
- 배포 후 `/api/health` 엔드포인트로 서버 상태 확인
- 브라우저 개발자 도구에서 네트워크 탭 확인
- Vercel Functions 로그에서 에러 확인

## OpenAI API 키 발급 방법

1. [OpenAI Platform](https://platform.openai.com) 접속
2. 계정 로그인 또는 회원가입
3. "API keys" 메뉴 선택
4. "Create new secret key" 클릭
5. 키 이름 입력 후 생성
6. 생성된 키 복사 (한 번만 표시됨!)
7. 결제 정보 등록 (사용량에 따라 과금)

## 트러블슈팅

### API 키 관련 오류
- `OPENAI_API_KEY_MISSING`: 환경변수가 설정되지 않음
- `401 Unauthorized`: 잘못된 API 키
- `429 Too Many Requests`: API 사용량 초과

### 해결 방법
1. Vercel 대시보드에서 환경변수 재확인
2. OpenAI 계정에서 API 키 상태 확인
3. 크레딧 잔액 확인
4. 새 API 키 생성 후 교체 