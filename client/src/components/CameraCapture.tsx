import React, { useRef, useEffect, useState } from 'react';
import './CameraCapture.css';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('카메라 접근 오류:', err);
      }
    };

    startCamera();

    return () => {
      // streamRef를 사용하여 안전하게 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // 캔버스 크기를 비디오 크기에 맞춤
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 비디오 프레임을 캔버스에 그리기
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 이미지 데이터를 base64로 변환
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  return (
    <div className="camera-container fullscreen">
      <div className="camera-view fullscreen">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured" className="captured-image" />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="camera-video"
            />
            <div className="camera-guide">
              <div className="guide-rectangle"></div>
            </div>
          </>
        )}
        <button onClick={onClose} className="camera-close-button">
          ✕
        </button>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {capturedImage ? (
        <div className="camera-controls">
          <button onClick={handleRetake} className="retake-button">
            다시 촬영
          </button>
          <button onClick={handleConfirm} className="confirm-button">
            예
          </button>
        </div>
      ) : (
        <button onClick={handleCapture} className="capture-button">
          촬영하기
        </button>
      )}
    </div>
  );
};

export default CameraCapture; 