// Vercel Serverless Function for Multi-Angle Pattern Generation

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
    console.log('Multi-angle pattern generation API called');
    
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

    // JSON 요청 본문에서 이미지 데이터 추출
    console.log('Request received');
    
    // 요청 크기 체크
    const requestSize = JSON.stringify(req.body).length / 1024 / 1024;
    console.log(`Request size: ${requestSize.toFixed(2)}MB`);
    
    if (requestSize > 4) {
      return res.status(413).json({
        success: false,
        error: '요청 크기가 너무 큽니다. 이미지를 더 작게 압축해주세요.',
        details: `Request size: ${requestSize.toFixed(2)}MB`
      });
    }
    
    const { images } = req.body || {};

    if (!images || !Array.isArray(images) || images.length === 0) {
      console.log('No images found in request');
      return res.status(400).json({
        success: false,
        error: '이미지 데이터가 없습니다.'
      });
    }

    console.log('Received images:', images.map(img => img.angle));

    // 간단하고 효과적인 프롬프트 (사용자 성공 사례 기반)
    const simplePrompt = `첨부한 사진들은 crochet 완성 작품입니다.
사진을 참고해서 코바늘 도안을 완성해주세요.

아래 형식으로 작성해주세요:

**🔍 작품 분석**
**📏 크기와 구조** 
**🧶 사용된 스티치**
**📋 필요한 재료**
**📖 제작 순서**
**💡 완성 팁**`;

    console.log('Building message content...');

    // 메시지 구성
    const messageContent = [
      {
        type: "text",
        text: simplePrompt
      }
    ];

    // 업로드된 이미지들을 메시지에 추가
    let imageCount = 0;
    
    for (const imageInfo of images) {
      if (imageInfo.data && imageInfo.angle) {
        messageContent.push({
          type: "image_url",
          image_url: {
            url: imageInfo.data
          }
        });
        imageCount++;
        console.log(`Added ${imageInfo.angle} image to analysis`);
      }
    }

    console.log(`Total images for analysis: ${imageCount}`);

    if (imageCount === 0) {
      return res.status(400).json({
        success: false,
        error: '분석할 이미지가 없습니다.'
      });
    }

    const messages = [
      {
        role: "user",
        content: messageContent
      }
    ];

    console.log('Calling OpenAI API...');
    console.log('Message structure:', {
      role: "user",
      contentLength: messageContent.length,
      textLength: simplePrompt.length,
      imageCount: imageCount
    });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Vision 모델 사용
      messages: messages,
      max_tokens: 2000, // 토큰 수 줄임
      temperature: 0.7
    });

    console.log('OpenAI response received successfully');
    console.log('Response usage:', response.usage);

    const generatedContent = response.choices[0].message.content;
    
    if (!generatedContent) {
      throw new Error('OpenAI에서 빈 응답을 받았습니다.');
    }
    
    console.log('Generated content length:', generatedContent.length);

    // 성공 응답
    return res.status(200).json({
      success: true,
      pattern: generatedContent,
      angleCount: imageCount,
      usage: response.usage
    });

  } catch (error) {
    console.error('=== Multi-angle pattern generation error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    
    // OpenAI API 에러인 경우 더 구체적인 에러 메시지
    if (error.code === 'insufficient_quota') {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API 할당량이 부족합니다.',
        details: error.message
      });
    }
    
    if (error.code === 'context_length_exceeded') {
      return res.status(413).json({
        success: false,
        error: '이미지가 너무 크거나 많습니다. 더 작은 이미지를 사용해주세요.',
        details: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: '도안 생성 중 오류가 발생했습니다.',
      details: error.message,
      errorType: error.constructor.name
    });
  }
} 