const fs = require('fs');

const envContent = `OPENAI_API_KEY=your_actual_openai_api_key_here
PORT=5001
NODE_ENV=development`;

fs.writeFileSync('.env', envContent, 'utf8');
console.log('.env 파일이 생성되었습니다.');
console.log('내용:');
console.log(envContent); 