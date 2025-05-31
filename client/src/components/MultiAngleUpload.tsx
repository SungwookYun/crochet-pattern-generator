import React, { useState, useRef } from 'react';
import './MultiAngleUpload.css';

interface UploadedImage {
  angle: string;
  label: string;
  file: File | null;
  preview: string | null;
  required: boolean;
}

interface MultiAngleUploadProps {
  onComplete: (pattern: string) => void;
  onClose: () => void;
}

const MultiAngleUpload: React.FC<MultiAngleUploadProps> = ({ onComplete, onClose }) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([
    { angle: 'front', label: '정면', file: null, preview: null, required: true },
    { angle: 'side', label: '측면', file: null, preview: null, required: true },
    { angle: 'back', label: '후면', file: null, preview: null, required: false }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileSelect = (angle: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setUploadedImages(prev => 
        prev.map(img => 
          img.angle === angle 
            ? { ...img, file, preview }
            : img
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleImageClick = (angle: string) => {
    if (isGenerating) return;
    fileInputRefs.current[angle]?.click();
  };

  const handleRemoveImage = (angle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGenerating) return;
    
    setUploadedImages(prev => 
      prev.map(img => 
        img.angle === angle 
          ? { ...img, file: null, preview: null }
          : img
      )
    );
  };

  const canGenerate = () => {
    const requiredImages = uploadedImages.filter(img => img.required);
    return requiredImages.every(img => img.file !== null);
  };

  const handleGeneratePattern = async () => {
    if (!canGenerate()) {
      alert('필수 이미지(정면, 측면)를 모두 업로드해주세요.');
      return;
    }

    try {
      setIsGenerating(true);

      // 업로드된 이미지들을 하나씩 압축해서 배열로 준비
      const imageArray: { angle: string; data: string }[] = [];
      
      for (const img of uploadedImages) {
        if (img.file) {
          console.log(`Converting ${img.angle} image...`);
          console.log(`Original file size: ${(img.file.size / 1024 / 1024).toFixed(2)}MB`);
          
          const base64 = await convertFileToBase64(img.file);
          
          // 압축된 크기 로깅
          const compressedSize = (base64.length * 0.75) / 1024 / 1024;
          console.log(`Compressed ${img.angle} image size: ${compressedSize.toFixed(2)}MB`);
          
          // 개별 이미지 크기 체크
          if (compressedSize > 1.5) {
            alert(`${img.label} 이미지가 너무 큽니다. 더 작은 이미지를 사용해주세요.`);
            return;
          }
          
          imageArray.push({
            angle: img.angle,
            data: base64
          });
        }
      }

      console.log(`Sending ${imageArray.length} images to API...`);
      
      // 더 간단한 JSON 구조로 전송
      const requestData = {
        images: imageArray
      };
      
      // 전체 요청 크기 체크
      const totalSize = JSON.stringify(requestData).length / 1024 / 1024;
      console.log(`Total request size: ${totalSize.toFixed(2)}MB`);
      
      if (totalSize > 3.5) {
        alert('전체 이미지 크기가 너무 큽니다. 더 작은 이미지를 사용해주세요.');
        return;
      }

      console.log('=== Sending request to API ===');
      console.log('Request URL: /api/generate-multi-angle-pattern');
      console.log('Request method: POST');
      console.log('Request size:', totalSize.toFixed(2), 'MB');
      console.log('Image count:', imageArray.length);
      
      const response = await fetch('/api/generate-multi-angle-pattern', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('=== API Response received ===');
      console.log('Response status:', response.status);
      console.log('Response statusText:', response.statusText);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('=== API Error Response ===');
        console.error('Status:', response.status);
        console.error('Error text:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      console.log('Response content-type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('=== Invalid Response Format ===');
        console.error('Expected: application/json');
        console.error('Received:', contentType);
        console.error('Response body:', responseText);
        throw new Error('서버에서 올바르지 않은 응답을 받았습니다.');
      }

      const data = await response.json();
      console.log('=== API Success Response ===');
      console.log('Success:', data.success);
      console.log('Pattern length:', data.pattern?.length || 0);
      console.log('Angle count:', data.angleCount);
      console.log('Usage:', data.usage);
      
      if (!data.success) {
        throw new Error(data.error || '도안 생성에 실패했습니다.');
      }

      console.log('Pattern generation successful');
      onComplete(data.pattern);
      
    } catch (error) {
      console.error('Pattern generation error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('도안 생성 중 오류가 발생했습니다: ' + errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // File을 압축된 base64로 변환하는 헬퍼 함수
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 더 작은 크기로 설정 (600px)
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        
        let { width, height } = img;
        
        // 비율을 유지하며 리사이즈
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 이미지를 캔버스에 그리기
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 더 강한 압축 (품질 0.5)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
        resolve(compressedBase64);
      };
      
      img.onerror = reject;
      
      // 원본 파일을 이미지로 로드
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getUploadStatus = () => {
    const uploaded = uploadedImages.filter(img => img.file !== null).length;
    const required = uploadedImages.filter(img => img.required).length;
    const requiredUploaded = uploadedImages.filter(img => img.required && img.file !== null).length;
    
    return `${uploaded}/${uploadedImages.length} (필수: ${requiredUploaded}/${required})`;
  };

  return (
    <div className="multi-angle-upload-container">
      <div className="upload-header">
        <button onClick={onClose} className="close-button" disabled={isGenerating}>✕</button>
        <h2>3차원 도안 생성</h2>
        <div className="upload-status">{getUploadStatus()}</div>
      </div>

      <div className="upload-description">
        <p>정면, 측면, 후면 사진을 업로드하여 더 정확한 3차원 도안을 생성하세요</p>
        <p className="required-note">* 정면과 측면 사진은 필수입니다</p>
      </div>

      <div className="image-upload-grid">
        {uploadedImages.map((img) => (
          <div key={img.angle} className="upload-slot">
            <div 
              className={`upload-area ${img.file ? 'has-image' : ''} ${img.required ? 'required' : ''}`}
              onClick={() => handleImageClick(img.angle)}
            >
              {img.preview ? (
                <>
                  <img src={img.preview} alt={img.label} className="preview-image" />
                  <button 
                    className="remove-button"
                    onClick={(e) => handleRemoveImage(img.angle, e)}
                    disabled={isGenerating}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📷</div>
                  <div className="upload-text">
                    <span className="upload-label">{img.label}</span>
                    {img.required && <span className="required-mark">*</span>}
                    <span className="upload-hint">클릭하여 이미지 선택</span>
                  </div>
                </div>
              )}
            </div>
            
            <input
              ref={el => { fileInputRefs.current[img.angle] = el; }}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(img.angle, file);
                }
                e.target.value = '';
              }}
              disabled={isGenerating}
            />
          </div>
        ))}
      </div>

      <div className="generate-section">
        <button 
          onClick={handleGeneratePattern}
          className="generate-button"
          disabled={!canGenerate() || isGenerating}
        >
          {isGenerating ? '🎨 3차원 도안 생성 중...' : '🎨 3차원 도안 생성하기'}
        </button>
        
        {!canGenerate() && (
          <p className="help-text">필수 이미지(정면, 측면)를 업로드해주세요</p>
        )}
      </div>
    </div>
  );
};

export default MultiAngleUpload; 