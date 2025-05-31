// Vercel 서버리스 함수 - Health Check
export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('Health check endpoint called');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Environment variables available:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Available' : 'Missing'
  });

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    method: req.method,
    environment: process.env.NODE_ENV || 'development',
    platform: process.env.VERCEL ? 'vercel' : 'local',
    openai_configured: !!process.env.OPENAI_API_KEY
  });
} 