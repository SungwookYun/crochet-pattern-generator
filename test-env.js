const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('=== 환경변수 테스트 ===');
console.log('현재 디렉토리:', __dirname);
console.log('.env 파일 경로:', path.join(__dirname, '.env'));
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '설정됨' : '설정안됨');
console.log('실제 값:', process.env.OPENAI_API_KEY);
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('===================='); 