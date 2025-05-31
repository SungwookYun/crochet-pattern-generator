import React, { useState, useEffect } from 'react';

// 항상 상대 경로 사용 (Vercel 환경에서 안전)
const API_URL = '';

// 한국어 텍스트 정의
const texts = {
  title: 'Crochet Ain',
  selectPhoto: '사진 선택하기 (1-3장)',
  generatePattern: '도안 생성하기',
  generating: '도안 생성 중...',
  newPattern: '다른 도안 생성',
  serverDisconnected: '서버 연결 상태: 연결 안됨',
  serverConnectionError: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
  selectFileError: '최소 1장의 사진을 선택해주세요.',
  fileSizeError: '파일 크기는 5MB를 초과할 수 없습니다.',
  fileTypeError: '이미지 파일만 업로드 가능합니다.',
  maxFilesError: '최대 3장까지만 선택할 수 있습니다.',
  welcomeMessage: '코바늘(Crochet)로 완성된 작품 사진을 업로드하면 상세한 도안을 만들어 드립니다.'
};

// 도안 내용을 예쁘게 포맷하는 함수
const formatPattern = (text: string) => {
  return text
    .replace(/###\s*(.*)/g, '<div class="pattern-title">🌟 $1</div>')
    .replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-orange-700">✨ $1 ✨</span>')
    .replace(/\n/g, '<br/>');
};

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [pattern, setPattern] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [serverStatus, setServerStatus] = useState<boolean>(false);
  const [showUploadForm, setShowUploadForm] = useState(true);
  const [showInvalidImageModal, setShowInvalidImageModal] = useState(false);

  // HTTPS 강제 리다이렉트 및 서비스워커 완전 제거
  useEffect(() => {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      window.location.href = 'https://' + window.location.hostname + window.location.pathname + window.location.search;
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  // 서버 상태 확인
  useEffect(() => {
    const checkServer = async () => {
      try {
        console.log('=== Server Connection Debug Info ===');
        console.log('API_URL:', API_URL);
        console.log('Current hostname:', window.location.hostname);
        console.log('Current protocol:', window.location.protocol);
        console.log('User agent:', navigator.userAgent);
        
        // 항상 상대 경로로 health 체크
        console.log('Checking health endpoint directly...');
        const healthUrl = `/api/health`;
        console.log('Health URL:', healthUrl);
        
        const response = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          mode: 'cors',
          cache: 'no-cache'
        });
        
        console.log('Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          type: response.type,
          url: response.url
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.status === 'ok') {
          setServerStatus(true);
          setError('');
          console.log('✅ Server connection successful!');
        } else {
          throw new Error('Server returned non-ok status');
        }
        
      } catch (err) {
        console.error('=== Server Connection Failed ===');
        console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
        console.error('Error message:', err instanceof Error ? err.message : String(err));
        console.error('Full error:', err);
        
        setServerStatus(false);
        setError(texts.serverConnectionError);
        console.log('❌ Server connection failed');
      }
    };

    // 초기 체크
    console.log('Starting initial server check...');
    checkServer();
    
    // 정기적인 체크
    const interval = setInterval(() => {
      console.log('Running periodic server check...');
      checkServer();
    }, 30000); // 30초마다

    return () => {
      console.log('Cleaning up server check interval');
      clearInterval(interval);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // 파일 개수 체크 (최대 3개)
      if (selectedFiles.length > 3) {
        setError(texts.maxFilesError);
        return;
      }

      // 각 파일 검증
      for (const file of selectedFiles) {
        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError(texts.fileSizeError);
          return;
        }

        // 이미지 파일 타입 체크
        if (!file.type.startsWith('image/')) {
          setError(texts.fileTypeError);
          return;
        }
      }
      
      setFiles(selectedFiles);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length < 1) {
      setError(texts.selectFileError);
      return;
    }
    await handleSubmitWithFiles(files);
  };

  const handleNewPattern = () => {
    setShowUploadForm(true);
    setPattern('');
    setImageUrl('');
    setFiles([]);
    setError('');
    setShowInvalidImageModal(false);
  };

  const handleInvalidImageConfirm = () => {
    setShowInvalidImageModal(false);
    setShowUploadForm(true);
    setPattern('');
    setImageUrl('');
    setFiles([]);
    setError('');
  };

  const handleSubmitWithFiles = async (filesToSubmit: File[]) => {
    console.log('=== handleSubmitWithFiles Started ===');
    console.log('Files:', filesToSubmit.map(file => file.name));
    console.log('Server status:', serverStatus);
    
    if (!serverStatus) {
      console.log('Server not available');
      setError(texts.serverConnectionError);
      return;
    }

    console.log('Setting loading to true');
    setLoading(true);
    setError('');
    setShowUploadForm(false); // 업로드 폼 숨기기
    
    const formData = new FormData();
    for (const file of filesToSubmit) {
      formData.append('images', file);
    }

    try {
      console.log('Sending request to API...');
      // 항상 상대 경로 사용
      const response = await fetch(`/api/generate-multi-pattern`, {
        method: 'POST',
        body: formData,
      });

      console.log('API Response status:', response.status);
      const data = await response.json();
      console.log('API Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Pattern generation failed.');
      }

      if (!data.success) {
        throw new Error(data.error || 'Pattern generation failed.');
      }

      console.log('Pattern generation successful');
      setPattern(data.pattern);
      setImageUrl(data.imageUrl ? `${data.imageUrl}` : '');
      setError('');
    } catch (err) {
      console.error('Pattern generation error:', err);
      let errorMessage = 'An error occurred. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      if (errorMessage.includes('해당 이미지로는 도안을 만들 수 없습니다')) {
        setShowInvalidImageModal(true);
        setError('');
        setShowUploadForm(true); // 다시 업로드 폼 표시
      } else {
        setError(errorMessage);
        setShowUploadForm(true); // 다시 업로드 폼 표시
      }
      setPattern('');
      setImageUrl('');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12 fade-in">
          <div className="glass-card p-8 md:p-12">
            <h1 className="title-large gradient-text mb-6 text-center w-full">
              {texts.title}
            </h1>
            <div className="gentle-bounce mb-6">
              <img 
                src="/log.jpg" 
                alt="Crochet Ain" 
                className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full object-cover shadow-2xl border-4 border-white"
              />
            </div>
            {!serverStatus && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {texts.serverDisconnected}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="space-y-8">
          {/* Loading State */}
          {loading && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="glass-card p-8 text-center max-w-sm mx-4">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-4 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-lg font-medium text-slate-700">{texts.generating}</p>
              </div>
            </div>
          )}
          
          {/* Upload Form */}
          {showUploadForm && !loading && (
            <div className="glass-card p-6 md:p-8 slide-up">
              <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl p-6 mb-6 border border-rose-100">
                <p className="text-slate-700 text-center leading-relaxed">
                  {texts.welcomeMessage}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {files.length > 0 && (
                    <button
                      type="submit"
                      disabled={loading || !serverStatus}
                      className="btn-primary w-full text-lg py-4"
                    >
                      {loading ? texts.generating : texts.generatePattern}
                    </button>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="file-upload"
                    disabled={!serverStatus || loading}
                    multiple
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="input-file-label">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {files.length > 0
                      ? `선택된 파일: ${files.length}/3개`
                      : '사진 선택하기 (최대 3장)'}
                  </label>
                </div>

                {/* File Preview */}
                {files.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-800">
                      선택된 사진들 ({files.length}/3)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {files.map((file, index) => (
                        <div key={index} className="preview-card">
                          <div className="aspect-square relative">
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={`미리보기 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const newFiles = files.filter((_, i) => i !== index);
                                setFiles(newFiles);
                              }}
                              className="absolute top-2 right-2 w-8 h-8 bg-rose-400 text-white rounded-full flex items-center justify-center hover:bg-rose-500 transition-colors shadow-lg"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="p-3">
                            <p className="text-sm text-gray-600 truncate font-medium">
                              {file.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p>{error}</p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Pattern Result */}
          {pattern && !showUploadForm && !loading && (
            <div className="space-y-8 slide-up">
              {imageUrl && (
                <div className="glass-card p-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    📷 업로드된 원본 이미지
                  </h3>
                  <div className="rounded-2xl overflow-hidden shadow-lg">
                    <img 
                      src={imageUrl} 
                      alt="Original Upload" 
                      className="w-full max-w-md mx-auto block"
                    />
                  </div>
                </div>
              )}
              
              <div className="glass-card p-6 md:p-8">
                <div className="prose prose-lg max-w-none">
                  <div 
                    className="text-slate-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatPattern(pattern) }}
                  />
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button 
                    onClick={handleNewPattern} 
                    className="btn-secondary w-full md:w-auto"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {texts.newPattern}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Invalid Image Modal */}
        {showInvalidImageModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-md w-full text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">도안 생성 불가</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                해당 이미지로는 도안을 만들 수 없습니다.<br/>
                다른 이미지를 올려주세요.
              </p>
              <button 
                onClick={handleInvalidImageConfirm}
                className="btn-primary w-full"
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
