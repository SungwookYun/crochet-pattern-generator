const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // 환경변수에서 API 키 가져오기
});

async function testAPI() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello" }]
    });
    console.log('API 테스트 성공:', response.choices[0].message);
  } catch (error) {
    console.error('API 테스트 실패:', error);
  }
}

testAPI(); 