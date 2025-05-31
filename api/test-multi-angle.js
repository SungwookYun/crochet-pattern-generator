export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('Test multi-angle endpoint called');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);

  res.json({
    success: true,
    message: 'Multi-angle test endpoint working',
    method: req.method,
    timestamp: new Date().toISOString()
  });
} 