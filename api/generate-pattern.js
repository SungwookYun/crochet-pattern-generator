// Vercel Serverless Function for Single Image Pattern Generation

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    console.log('Single image pattern generation API called');
    
    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API 키가 설정되지 않았습니다.',
        code: 'OPENAI_API_KEY_MISSING'
      });
    }

    // 동적 import 사용 (Vercel에서 권장)
    const { OpenAI } = await import('openai');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // 단일 이미지 분석을 위한 프롬프트
    const singleImagePrompt = `업로드된 코바늘 작품 이미지를 분석하여 상세한 도안을 작성하세요.

아래 형식으로 도안을 작성하세요:

**🔍 작품 분석**
(이미지에서 관찰된 특징들을 설명)

**📏 치수와 구조**
(예상되는 크기와 구조)

**🧶 사용 스티치와 기법**
(관찰된 스티치 종류와 기법들)

**📋 필요한 재료**
(실 종류, 색상, 예상 사용량, 도구)

**📖 단계별 상세 도안**
(제작 순서와 방법)

**💡 완성 팁**
(마감 방법 및 팁)`;

    console.log('Request received, processing...');

    // 텍스트 기반 도안 생성
    const messages = [
      {
        role: "user",
        content: singleImagePrompt + "\n\n업로드된 이미지를 바탕으로 코바늘 작품의 도안을 생성해주세요."
      }
    ];

    console.log('Calling OpenAI API...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      max_tokens: 2500,
      temperature: 0.7
    });

    const generatedContent = response.choices[0].message.content;
    console.log('OpenAI response received');

    // 성공 응답
    return res.status(200).json({
      success: true,
      pattern: generatedContent,
      imageUrl: null
    });

  } catch (error) {
    console.error('Pattern generation error:', error);
    
    // OpenAI API 에러인 경우 더 구체적인 에러 메시지
    if (error.code === 'insufficient_quota') {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API 할당량이 부족합니다.',
        details: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: '도안 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
} 