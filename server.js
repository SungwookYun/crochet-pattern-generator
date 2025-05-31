const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');
const cron = require('node-cron');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001; // Railway에서 동적 포트 사용

// CORS 설정 - 모든 환경 접속 허용
app.use(cors({
  origin: function(origin, callback) {
    // origin이 없는 경우 (모바일 앱, Postman 등) 허용
    if (!origin) return callback(null, true);
    
    // Vercel 도메인 허용
    if (origin.includes('vercel.app')) return callback(null, true);
    
    // Railway 도메인 허용
    if (origin.includes('railway.app')) return callback(null, true);
    
    // 로컬 개발 환경 허용
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
    
    // 로컬 네트워크 IP 허용
    if (/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin)) return callback(null, true);
    
    // 기타 모든 origin 허용 (개발 중)
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: false, // 모바일 환경에서는 credentials를 false로 설정
  optionsSuccessStatus: 200 // 일부 레거시 브라우저 지원
}));

// 추가 CORS 헤더 설정 (모바일 환경 지원)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 보안 헤더 설정 (개발용으로 간소화)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// 기본 미들웨어 설정
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// React 빌드 파일 서빙
app.use(express.static(path.join(__dirname, 'client/build')));

// uploads 폴더가 없으면 생성
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// 12시간 이상 된 파일 삭제 함수
const cleanupOldFiles = () => {
  try {
    const uploadsDir = './uploads';
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('Uploads 디렉토리가 존재하지 않습니다.');
      return;
    }

    const files = fs.readdirSync(uploadsDir);
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12시간 전
    
    let deletedCount = 0;
    let deletedSize = 0;
    const deletedFiles = [];

    files.forEach(filename => {
      try {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        
        // 파일 생성 시간이 12시간 이전인지 확인
        if (stats.birthtime < twelveHoursAgo) {
          deletedSize += stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
          deletedFiles.push({
            filename: filename,
            size: stats.size,
            created: stats.birthtime
          });
          console.log(`🗑️ 삭제된 파일: ${filename} (생성일: ${stats.birthtime.toLocaleString()})`);
        }
      } catch (error) {
        console.error(`파일 ${filename} 처리 중 오류:`, error.message);
      }
    });
    
    if (deletedCount > 0) {
      console.log(`\n🧹 자동 정리 완료:`);
      console.log(`   - 삭제된 파일 수: ${deletedCount}개`);
      console.log(`   - 확보된 용량: ${(deletedSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   - 실행 시간: ${new Date().toLocaleString()}\n`);
    } else {
      console.log(`✨ 삭제할 오래된 파일이 없습니다. (${new Date().toLocaleString()})`);
    }

    return {
      deletedCount,
      deletedSize,
      deletedFiles
    };
    
  } catch (error) {
    console.error('파일 정리 중 오류가 발생했습니다:', error);
    return {
      deletedCount: 0,
      deletedSize: 0,
      deletedFiles: [],
      error: error.message
    };
  }
};

// 서버 시작 시 초기 정리 실행
console.log('🚀 서버 시작 시 파일 정리 실행...');
cleanupOldFiles();

// 30분마다 정리 작업 스케줄링 (12시간 체크)
cron.schedule('*/30 * * * *', () => {
  console.log('\n⏰ 정기 파일 정리 작업 시작 (12시간 기준)...');
  cleanupOldFiles();
}, {
  timezone: "Asia/Seoul"
});

// 매일 자정에 전체 정리 (추가 안전장치)
cron.schedule('0 0 * * *', () => {
  console.log('\n🌙 일일 전체 파일 정리 작업 시작...');
  const result = cleanupOldFiles();
  console.log('일일 정리 결과:', result);
}, {
  timezone: "Asia/Seoul"
});

// OpenAI 설정
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// 파일 업로드를 위한 multer 설정
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (!file) {
    cb(new Error('파일이 없습니다.'), false);
    return;
  }
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  }
});

// 서버 상태 확인 API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '서버가 정상적으로 실행 중입니다.',
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin,
    host: req.headers.host,
    fileCleanupInterval: '30분마다 (12시간 이상 된 파일 삭제)'
  });
});

// 파일 정리 상태 확인 API
app.get('/api/cleanup-status', (req, res) => {
  try {
    const uploadsDir = './uploads';
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({
        success: true,
        totalFiles: 0,
        totalSize: 0,
        oldFiles: 0,
        nextCleanup: '30분마다',
        cleanupPeriod: '12시간'
      });
    }

    const files = fs.readdirSync(uploadsDir);
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    let totalSize = 0;
    let oldFilesCount = 0;
    
    const fileDetails = files.map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      const isOld = stats.birthtime < twelveHoursAgo;
      
      totalSize += stats.size;
      if (isOld) oldFilesCount++;
      
      return {
        filename: filename,
        size: stats.size,
        created: stats.birthtime,
        ageHours: ((Date.now() - stats.birthtime.getTime()) / (1000 * 60 * 60)).toFixed(1),
        willBeDeleted: isOld
      };
    });
    
    // 오래된 파일 순으로 정렬
    fileDetails.sort((a, b) => new Date(a.created) - new Date(b.created));
    
    res.json({
      success: true,
      totalFiles: files.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      oldFiles: oldFilesCount,
      cleanupPeriod: '12시간',
      nextCleanup: '30분마다 체크',
      files: fileDetails
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '정리 상태 확인 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 수동 정리 실행 API
app.post('/api/cleanup-now', (req, res) => {
  try {
    console.log('🔧 수동 파일 정리 요청 실행...');
    const result = cleanupOldFiles();
    
    res.json({
      success: true,
      message: '파일 정리가 완료되었습니다.',
      ...result,
      executedAt: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '수동 정리 실행 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 간단한 테스트 엔드포인트
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// 프롬프트 정의
const prompt = "이미지를 분석하여 코바늘 도안을 작성하세요.\n\n이미지 분석 가이드:\n- 완성된 뜨개질 작품 사진: 모양, 패턴, 스티치를 자세히 관찰하여 도안 작성\n- 진행 중인 작품 사진: 현재 상태를 기반으로 완성 도안 추정\n- 도안/차트 이미지: 그대로 해석하여 한국어 도안으로 변환\n- 실/재료 사진: 추천 작품과 도안 제시\n\n중요: 이미지가 뜨개질과 전혀 관련 없거나 도안 작성이 불가능한 경우에만 '해당 이미지로는 도안을 만들 수 없습니다'라고 응답하세요.\n\n뜨개질 관련 이미지라면, 완성품 사진이어도 패턴을 분석하여 도안을 작성하세요. 인사말과 사과 없이 바로 아래 순서대로만 작성하세요:\n\n**1. 사용된 스티치 종류와 설명**\n(완성품에서 관찰되는 스티치: 사슬뜨기(ch), 짧은뜨기(sc), 긴뜨기(dc), 늘어뜨기(tr) 등)\n\n**2. 단 수와 각 단의 코 수**\n(완성품 크기를 기반으로 추정: 총 X단, 1단: X코, 2단: X코 등)\n\n**3. 필요한 실 재료**\n(이미지에서 보이는 실 종류, 색상, 예상 사용량, 권장 코바늘 호수)\n\n**4. 완성 크기**\n(이미지에서 추정되는 크기: 가로 x 세로 또는 지름)\n\n**5. 단계별 상세 설명**\n(관찰된 패턴을 기반으로 한 각 단별 구체적인 뜨기 방법)\n\n완성품 사진의 경우 \"이 작품을 재현하기 위한 도안\"이라고 명시하고, 패턴 분석을 통해 최대한 정확한 도안을 제공하세요.";

// 이미지 업로드 및 도안 생성 API
app.post('/api/generate-pattern', upload.single('image'), async (req, res) => {
  try {
    // OpenAI API 키 확인
    if (!openai) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요.',
        code: 'OPENAI_API_KEY_MISSING'
      });
    }

    // 파일 업로드 확인
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '이미지 파일이 필요합니다.'
      });
    }

    const imagePath = path.resolve(req.file.path);
    
    // 파일 존재 확인
    if (!fs.existsSync(imagePath)) {
      return res.status(400).json({
        success: false,
        error: '업로드된 파일을 찾을 수 없습니다.'
      });
    }

    // 이미지를 base64로 변환
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;
    const base64ImageUrl = `data:${mimeType};base64,${base64Image}`;

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: base64ImageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    });

    const generatedContent = response.choices[0].message.content;

    // 도안 생성이 불가능한 경우 체크 (더 엄격한 기준 적용)
    const invalidPatternKeywords = [
      '도안을 만들 수 없습니다',
      '뜨개질과 전혀 관련 없',
      '도안 작성이 불가능',
      '뜨개질 관련 이미지가 아닙니다'
    ];

    const isInvalidPattern = invalidPatternKeywords.some(keyword => 
      generatedContent.toLowerCase().includes(keyword.toLowerCase())
    );

    // 도안 내용이 너무 짧거나 구체적이지 않은 경우도 체크 (기준 완화)
    const isContentTooShort = generatedContent.length < 50; // 100에서 50으로 완화
    const hasRequiredSections = generatedContent.includes('스티치') || 
                               generatedContent.includes('재료') || 
                               generatedContent.includes('단계') ||
                               generatedContent.includes('도안') ||
                               generatedContent.includes('뜨기'); // OR 조건으로 완화

    if (isInvalidPattern || isContentTooShort || !hasRequiredSections) {
      // 파일 삭제
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(400).json({
        success: false,
        error: '해당 이미지로는 도안을 만들 수 없습니다. 다른 이미지를 올려주세요.',
        code: 'INVALID_IMAGE_FOR_PATTERN'
      });
    }

    // 이미지 URL 생성 (파일을 삭제하지 않고 보관)
    const imageUrl = `/uploads/${path.basename(req.file.path)}`;

    // 성공 응답
    res.json({
      success: true,
      pattern: generatedContent,
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error('도안 생성 에러:', error);

    // 파일이 존재하면 삭제
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteError) {
        console.error('파일 삭제 중 오류:', deleteError);
      }
    }

    // 에러 응답
    res.status(500).json({
      success: false,
      error: error.message || '도안 생성 중 오류가 발생했습니다.',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// 다중 이미지 업로드 및 도안 생성 API
app.post('/api/generate-multi-pattern', upload.array('images', 3), async (req, res) => {
  try {
    // OpenAI API 키 확인
    if (!openai) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요.',
        code: 'OPENAI_API_KEY_MISSING'
      });
    }

    // 파일 업로드 확인
    if (!req.files || req.files.length < 1) {
      return res.status(400).json({
        success: false,
        error: '최소 1장의 이미지 파일이 필요합니다.'
      });
    }

    if (req.files.length > 3) {
      return res.status(400).json({
        success: false,
        error: '최대 3장까지만 업로드할 수 있습니다.'
      });
    }

    const imageContents = [];
    const filePaths = [];
    
    // 각 이미지 처리
    for (const file of req.files) {
      const imagePath = path.resolve(file.path);
      filePaths.push(file.path);
      
      // 파일 존재 확인
      if (!fs.existsSync(imagePath)) {
        return res.status(400).json({
          success: false,
          error: '업로드된 파일을 찾을 수 없습니다.'
        });
      }

      // 이미지를 base64로 변환
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = file.mimetype;
      const base64ImageUrl = `data:${mimeType};base64,${base64Image}`;
      
      imageContents.push({
        type: "image_url",
        image_url: {
          url: base64ImageUrl
        }
      });
    }

    // 파일 수에 따라 프롬프트 선택
    let selectedPrompt;
    if (req.files.length === 1) {
      // 단일 이미지용 프롬프트
      selectedPrompt = prompt;
    } else {
      // 다중 이미지용 프롬프트
      selectedPrompt = `다음은 같은 코바늘 작품의 여러 각도 사진들입니다. 이 ${req.files.length}장의 사진을 종합적으로 분석하여 매우 상세하고 완전한 3차원 코바늘 도안을 만들어주세요.

💡 **중요: 모든 각도의 사진을 꼼꼼히 분석하여 실제로 재현 가능한 완전한 도안을 제공해야 합니다.**

🔍 **모든 각도 사진 분석 결과:**
- 앞면에서 보이는 특징과 패턴
- 뒷면에서 보이는 구조와 마감
- 측면에서 보이는 두께와 입체감
- 세부 디테일과 연결 부분
- 색상 변화와 무늬 패턴

📐 **1. 전체 구조와 치수 분석**
- 정확한 크기 측정 (가로 x 세로 x 높이)
- 각 부분별 상세 치수
- 3차원적 형태와 볼륨감
- 앞면과 뒷면의 구조적 차이점
- 좌우 대칭성 및 비대칭 요소
- 각 부분의 연결 방식과 이음새 처리

🧶 **2. 사용된 스티치 종류와 상세 분석**
- 기본 스티치: 사슬뜨기(ch), 짧은뜨기(sc), 긴뜨기(dc), 늘어뜨기(tr)
- 특수 스티치: 뿔뜨기, 팝콘스티치, 조개껍질스티치, 릴리프스티치 등
- 각 스티치가 사용된 정확한 위치와 목적
- 스티치 조합으로 만들어진 무늬와 효과
- 증가/감소 스티치의 위치와 방법
- 색상 변경 시점과 실 처리 방법

📏 **3. 정확한 코 수와 단 수 계산**
- 시작 고리: 정확한 개수
- 각 단별 상세한 코 수 (1단부터 마지막 단까지)
- 증가 코의 위치와 개수 (매 몇 코마다 증가)
- 감소 코의 위치와 방법
- 색상 변경이 있는 단의 처리
- 특별한 패턴이 시작되는 단 번호
- 마무리 단의 특별한 처리 방법

🎨 **4. 필요한 실과 재료**
- 주 색상 실: 종류, 굵기, 예상 사용량(그램)
- 보조 색상 실: 각 색상별 사용량
- 권장 코바늘 호수 (mm)
- 추가 재료: 단추, 지퍼, 장식품, 솜 등
- 실의 질감과 특성 (면, 모, 아크릴 등)
- 색상 조합과 그라데이션 효과

🔢 **5. 완성 크기와 게이지**
- 최종 완성 크기 (cm 단위)
- 10cm x 10cm 게이지 (몇 단 x 몇 코)
- 각 부분별 치수
- 착용 시 여유분 고려사항
- 세탁 후 크기 변화 예상

📝 **6. 단계별 초상세 설명**

**[시작 단계]**
- 마법의 고리 또는 사슬뜨기로 시작하는 방법
- 첫 번째 단의 정확한 뜨기 방법
- 단 연결 방법 (돌려뜨기/왕복뜨기)

**[본체 제작 - 각 단별 상세 설명]**
- 1단: [정확한 스티치와 코 수]
- 2단: [증가/감소 위치 포함]
- 3단: [패턴 시작 부분]
- ... (모든 단을 상세히 설명)

**[패턴 부분]**
- 무늬가 시작되는 단부터 반복 패턴 설명
- 패턴 반복 단위와 횟수
- 패턴 내 색상 변경 방법

**[마무리 단계]**
- 마지막 단의 특별한 처리
- 실 끝 처리와 매듭 방법
- 가장자리 마무리 (게뜨기 등)

🔧 **7. 조립과 마무리 과정**
- 각 부분의 연결 순서
- 이음새 처리 방법 (코뜨기, 회전뜨기 등)
- 마무리재 사용법
- 다림질과 모양 잡기
- 단추 달기나 장식 부착

💡 **8. 특별한 기법과 노하우**
- 3차원 효과를 위한 특별한 뜨기 방법
- 입체감 표현 기법
- 균일한 텐션 유지 방법
- 색상 전환 시 깔끔한 처리법
- 실 끝 숨기기 기법
- 모양 유지를 위한 팁

🆘 **9. 문제 해결과 수정 방법**
- 코 수가 맞지 않을 때 대처법
- 텐션이 다를 때 조정 방법
- 실수했을 때 수정하는 방법
- 크기 조절이 필요할 때의 변형법

⚠️ **10. 주의사항과 팁**
- 각 단계별 주의할 점
- 실 교체 시점과 방법
- 세탁과 관리 방법
- 보관 시 주의사항

이 작품을 완벽하게 재현할 수 있도록 모든 세부사항을 빠짐없이 포함한 완전한 3차원 도안을 제공해주세요. 특히 사진에서 보이는 입체적 특징과 세부 디테일을 정확히 분석하여 실제 제작 시 동일한 결과물을 얻을 수 있도록 해주세요.

**최소 2000자 이상의 상세한 도안을 작성해주세요.**`;
    }

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: selectedPrompt
            },
            ...imageContents
          ]
        }
      ],
      max_tokens: req.files.length === 1 ? 2000 : 4000 // 단일/다중에 따라 토큰 수 조절
    });

    const generatedContent = response.choices[0].message.content;

    // 도안 생성이 불가능한 경우 체크
    const invalidPatternKeywords = [
      '도안을 만들 수 없습니다',
      '뜨개질과 전혀 관련 없',
      '도안 작성이 불가능',
      '뜨개질 관련 이미지가 아닙니다'
    ];

    const isInvalidPattern = invalidPatternKeywords.some(keyword => 
      generatedContent.toLowerCase().includes(keyword.toLowerCase())
    );

    // 도안 내용이 너무 짧거나 구체적이지 않은 경우도 체크
    const isContentTooShort = generatedContent.length < 100;
    const hasRequiredSections = generatedContent.includes('스티치') || 
                               generatedContent.includes('재료') || 
                               generatedContent.includes('단계') ||
                               generatedContent.includes('도안') ||
                               generatedContent.includes('뜨기');

    if (isInvalidPattern || isContentTooShort || !hasRequiredSections) {
      // 파일들 삭제
      filePaths.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
      
      return res.status(400).json({
        success: false,
        error: '해당 이미지들로는 도안을 만들 수 없습니다. 다른 이미지를 올려주세요.',
        code: 'INVALID_IMAGES_FOR_PATTERN'
      });
    }

    // 대표 이미지 URL 생성 (첫 번째 이미지 사용)
    const imageUrl = `/uploads/${path.basename(req.files[0].path)}`;

    // 성공 응답
    res.json({
      success: true,
      pattern: generatedContent,
      imageUrl: imageUrl,
      imageCount: req.files.length,
      message: req.files.length === 1 ? 
        '단일 이미지를 분석하여 도안을 생성했습니다.' :
        `${req.files.length}장의 사진을 분석하여 3차원 도안을 생성했습니다.`
    });

    console.log(`✅ 도안 생성 성공: ${req.files.length}장의 사진 분석 완료`);

  } catch (error) {
    console.error('다중 이미지 도안 생성 에러:', error);

    // 파일들이 존재하면 삭제
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (deleteError) {
            console.error('파일 삭제 중 오류:', deleteError);
          }
        }
      });
    }

    // 에러 응답
    res.status(500).json({
      success: false,
      error: error.message || '도안 생성 중 오류가 발생했습니다.',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// React 앱을 위한 catch-all 라우트
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// 글로벌 에러 핸들링
app.use((err, req, res, next) => {
  console.error('글로벌 에러:', err);
  res.status(500).json({
    success: false,
    error: '서버 오류가 발생했습니다.',
    details: err.message
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`🚀 서버가 포트 ${port}에서 실행 중입니다.`);
  console.log(`📅 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 OpenAI API 키 설정됨: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
  console.log(`🧹 자동 파일 정리: 30분마다 실행 (12시간 이상 된 파일 삭제)`);
  console.log(`⏰ 현재 시간: ${new Date().toLocaleString()}`);
  console.log(`🌏 시간대: Asia/Seoul`);
  
  // 현재 파일 상태 출력
  setTimeout(() => {
    try {
      const uploadsDir = './uploads';
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        const totalSize = files.reduce((sum, filename) => {
          try {
            const filePath = path.join(uploadsDir, filename);
            const stats = fs.statSync(filePath);
            return sum + stats.size;
          } catch {
            return sum;
          }
        }, 0);
        console.log(`📂 현재 저장된 파일 수: ${files.length}개`);
        console.log(`💾 총 사용 용량: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      }
    } catch (error) {
      console.log('📂 파일 상태 확인 중 오류:', error.message);
    }
  }, 1000);
});