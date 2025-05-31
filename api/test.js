// Vercel 서버리스 함수 - Test Endpoint
export default function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 모든 메서드 허용
  res.status(200).json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: req.headers,
    query: req.query
  });
} 