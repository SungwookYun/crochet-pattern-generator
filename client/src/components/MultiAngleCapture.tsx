import React, { useRef, useEffect, useState } from 'react';
import './MultiAngleCapture.css';

interface AnglePhoto {
  angle: string;
  label: string;
  imageData: string | null;
  required: boolean;
}

interface MultiAngleCaptureProps {
  onComplete: (photos: AnglePhoto[]) => void;
  onClose: () => void;
}

const MultiAngleCapture: React.FC<MultiAngleCaptureProps> = ({ onComplete, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<AnglePhoto[]>([
    { angle: 'front', label: '정면', imageData: null, required: true },
    { angle: 'side', label: '측면', imageData: null, required: true },
    { angle: 'back', label: '후면', imageData: null, required: false },
    { angle: 'detail', label: '디테일', imageData: null, required: false },
    { angle: 'overall', label: '전체', imageData: null, required: false }
  ]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [allPhotosCompleted, setAllPhotosCompleted] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentAngle = capturedPhotos[currentAngleIndex];

  // 화면 회전 방지 기능
  useEffect(() => {
    const lockOrientation = () => {
      try {
        // 화면 회전 잠금 시도
        const screenAny = (window as any).screen;
        if (screenAny && screenAny.orientation && screenAny.orientation.lock) {
          screenAny.orientation.lock('portrait-primary').catch((err: any) => {
            console.log('Screen orientation lock failed:', err);
          });
        }
      } catch (err) {
        console.log('Screen orientation not supported:', err);
      }
    };

    const handleOrientationChange = () => {
      // 세로 모드가 아닐 때 강제로 다시 세로 모드로 변경 시도
      if ((window as any).orientation !== 0 && (window as any).orientation !== 180) {
        setTimeout(() => {
          const screenAny = (window as any).screen;
          if (screenAny && screenAny.orientation && screenAny.orientation.lock) {
            screenAny.orientation.lock('portrait-primary').catch(() => {});
          }
        }, 100);
      }
    };

    lockOrientation();
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      // 컴포넌트 언마운트 시 회전 잠금 해제
      const screenAny = (window as any).screen;
      if (screenAny && screenAny.orientation && screenAny.orientation.unlock) {
        screenAny.orientation.unlock();
      }
    };
  }, []);

  // 카메라 시작 함수
  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      setCameraError(false);
      
      // 기존 스트림이 있으면 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // 비디오가 로드된 후에 재생 시작
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error('Video play error:', err);
              setCameraError(true);
            });
          }
        };
      }
      
      console.log('Camera started successfully');
    } catch (err) {
      console.error('카메라 접근 오류:', err);
      setCameraError(true);
    }
  };

  // 카메라 정리 함수
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // 컴포넌트 마운트 시 카메라 시작
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  // 각도 변경 시 카메라 상태 확인 및 재시작
  useEffect(() => {
    const checkCameraStatus = () => {
      if (videoRef.current && !isCapturing) {
        // 비디오가 재생 중이 아니거나 스트림이 없으면 카메라 재시작
        if (videoRef.current.readyState === 0 || !streamRef.current) {
          console.log('Camera needs restart, restarting...');
          startCamera();
        }
      }
    };

    // 각도 변경 후 잠시 대기 후 카메라 상태 확인
    const timer = setTimeout(checkCameraStatus, 500);
    
    return () => clearTimeout(timer);
  }, [currentAngleIndex, isCapturing]);

  // 촬영 완료 여부 확인
  useEffect(() => {
    const requiredPhotos = capturedPhotos.filter(photo => photo.required);
    const completedRequiredPhotos = requiredPhotos.filter(photo => photo.imageData !== null);
    setAllPhotosCompleted(completedRequiredPhotos.length === requiredPhotos.length);
  }, [capturedPhotos]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && !cameraError) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context && video.readyState >= 2) { // HAVE_CURRENT_DATA 이상
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setPreviewImage(imageData);
        setIsCapturing(true);
      } else {
        console.error('Video not ready for capture');
        // 카메라 재시작 시도
        startCamera();
      }
    }
  };

  // 화면 터치로 촬영
  const handleScreenTouch = () => {
    if (!isCapturing && !cameraError && !isGenerating) {
      handleCapture();
    } else if (cameraError) {
      // 에러 상태에서 터치하면 카메라 재시작
      startCamera();
    }
  };

  const handleConfirmPhoto = () => {
    if (previewImage) {
      const updatedPhotos = [...capturedPhotos];
      updatedPhotos[currentAngleIndex].imageData = previewImage;
      setCapturedPhotos(updatedPhotos);
      
      setPreviewImage(null);
      setIsCapturing(false);
      
      // 다음 각도로 자동 이동 (마지막이 아닌 경우에만)
      if (currentAngleIndex < capturedPhotos.length - 1) {
        setCurrentAngleIndex(currentAngleIndex + 1);
      }
    }
  };

  const handleRetakePhoto = () => {
    setPreviewImage(null);
    setIsCapturing(false);
    // 카메라 재시작
    setTimeout(() => startCamera(), 100);
  };

  const handleGeneratePattern = async () => {
    const completedPhotos = capturedPhotos.filter(photo => photo.imageData !== null);
    const requiredPhotos = capturedPhotos.filter(photo => photo.required);
    const completedRequiredPhotos = requiredPhotos.filter(photo => photo.imageData !== null);

    if (completedRequiredPhotos.length < requiredPhotos.length) {
      alert('필수 각도 사진을 모두 촬영해주세요.');
      return;
    }

    try {
      console.log('=== Starting multi-angle pattern generation ===');
      console.log('Completed photos count:', completedPhotos.length);
      setIsGenerating(true);
      stopCamera(); // 카메라 정리

      // 먼저 테스트 엔드포인트 호출
      console.log('Testing API endpoint...');
      const testResponse = await fetch('/api/test-multi-angle', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Test response status:', testResponse.status);
      console.log('Test response ok:', testResponse.ok);
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('Test response data:', testData);
      } else {
        const testErrorText = await testResponse.text();
        console.log('Test error response:', testErrorText);
      }

      // FormData 생성
      const formData = new FormData();
      
      // 각 사진을 FormData에 추가
      for (const photo of completedPhotos) {
        if (photo.imageData) {
          console.log(`Adding photo: ${photo.angle}`);
          // base64를 Blob으로 변환
          const base64Data = photo.imageData.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });
          const file = new File([blob], `${photo.angle}-photo.jpg`, { type: 'image/jpeg' });
          
          console.log(`File created: ${file.name}, size: ${file.size}`);
          formData.append(photo.angle, file);
        }
      }
      
      console.log('Sending multi-angle request to /api/generate-multi-angle-pattern...');
      
      // 다각도 API 호출
      const response = await fetch('/api/generate-multi-angle-pattern', {
        method: 'POST',
        body: formData,
      });

      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response text:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      console.log('Response content-type:', contentType);

      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response received:', responseText);
        throw new Error('서버에서 올바르지 않은 응답을 받았습니다. HTML 페이지가 반환되었습니다.');
      }

      const data = await response.json();
      console.log('Multi-angle API Response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Multi-angle pattern generation failed.');
      }

      console.log('Pattern generation successful, calling onComplete...');
      onComplete(completedPhotos);
      
    } catch (error) {
      console.error('Multi-angle pattern generation error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('다각도 도안 생성 중 오류가 발생했습니다: ' + errorMessage);
      setIsGenerating(false);
      // 에러 시 카메라 다시 시작
      startCamera();
    }
  };

  const handleClose = () => {
    stopCamera(); // 카메라 정리
    onClose();
  };

  const handleThumbnailClick = (index: number) => {
    if (isGenerating) return; // 생성 중일 때는 클릭 방지
    
    setCurrentAngleIndex(index);
    setPreviewImage(null);
    setIsCapturing(false);
    // 잠시 후 카메라 상태 확인
    setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState === 0) {
        startCamera();
      }
    }, 200);
  };

  const getProgressText = () => {
    const completed = capturedPhotos.filter(photo => photo.imageData !== null).length;
    const required = capturedPhotos.filter(photo => photo.required).length;
    return `${completed}/${capturedPhotos.length} (필수: ${capturedPhotos.filter(photo => photo.required && photo.imageData !== null).length}/${required})`;
  };

  return (
    <div className="multi-angle-container">
      <div className="multi-angle-header">
        <button onClick={handleClose} className="close-button" disabled={isGenerating}>✕</button>
        <h2>다각도 촬영</h2>
        <div className="progress">{getProgressText()}</div>
      </div>

      <div className="current-angle-info">
        <h3>{currentAngle.label} 촬영</h3>
        <p className="angle-description">
          {currentAngle.angle === 'front' && '작품의 정면을 촬영해주세요'}
          {currentAngle.angle === 'side' && '작품의 측면을 촬영해주세요'}
          {currentAngle.angle === 'back' && '작품의 후면을 촬영해주세요'}
          {currentAngle.angle === 'detail' && '특별한 디테일 부분을 촬영해주세요'}
          {currentAngle.angle === 'overall' && '작품 전체를 촬영해주세요'}
        </p>
        {!currentAngle.required && (
          <p className="optional-text">(선택사항)</p>
        )}
        {isGenerating ? (
          <p className="generating-text">🎨 도안 생성 중...</p>
        ) : cameraError ? (
          <p className="camera-error">🔄 카메라 오류 - 화면을 터치하여 재시작</p>
        ) : (
          <p className="touch-guide">📸 화면을 터치하여 촬영하세요</p>
        )}
      </div>

      <div className="camera-view-large" onClick={handleScreenTouch}>
        {isCapturing && previewImage ? (
          <img src={previewImage} alt="Preview" className="preview-image" />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />
            <div className="camera-guide">
              <div className="guide-rectangle"></div>
              {isGenerating ? (
                <div className="touch-indicator generating">🎨 도안 생성 중...</div>
              ) : cameraError ? (
                <div className="touch-indicator error">🔄 터치하여 카메라 재시작</div>
              ) : (
                <div className="touch-indicator">👆 터치하여 촬영</div>
              )}
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* 촬영 확인/재촬영 버튼만 유지 */}
      {isCapturing && (
        <div className="capture-controls-only">
          <button onClick={handleRetakePhoto} className="retake-button" disabled={isGenerating}>
            다시 촬영
          </button>
          <button onClick={handleConfirmPhoto} className="confirm-button" disabled={isGenerating}>
            이 사진 사용
          </button>
        </div>
      )}

      {/* 도안 생성 버튼 - 필수 사진이 모두 완료되었을 때만 표시 */}
      {allPhotosCompleted && !isCapturing && (
        <div className="generate-pattern-section">
          <button 
            onClick={handleGeneratePattern} 
            className="generate-pattern-button"
            disabled={isGenerating}
          >
            {isGenerating ? '🎨 도안 생성 중...' : '🎨 도안 생성하기'}
          </button>
        </div>
      )}

      <div className="photo-thumbnails">
        {capturedPhotos.map((photo, index) => (
          <div 
            key={photo.angle}
            className={`thumbnail ${index === currentAngleIndex ? 'active' : ''} ${photo.imageData ? 'completed' : ''} ${isGenerating ? 'disabled' : ''}`}
            onClick={() => handleThumbnailClick(index)}
          >
            {photo.imageData ? (
              <img src={photo.imageData} alt={photo.label} />
            ) : (
              <div className="empty-thumbnail">
                <span>{photo.label}</span>
                {photo.required && <span className="required-mark">*</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiAngleCapture; 