import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA Service Worker 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW 등록 성공:', registration.scope);
        
        // 업데이트 확인
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 새 버전 설치됨
                if (window.confirm('새 버전이 준비되었습니다. 업데이트하시겠습니까?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('SW 등록 실패:', error);
      });
  });
}

// PWA 설치 프롬프트
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  // 기본 설치 프롬프트 방지
  e.preventDefault();
  deferredPrompt = e;
  
  // 커스텀 설치 버튼 표시 (App.tsx에서 처리)
  window.dispatchEvent(new CustomEvent('showInstallPrompt'));
});

// 앱 설치 후 처리
window.addEventListener('appinstalled', () => {
  console.log('PWA 설치 완료');
  deferredPrompt = null;
});

// 설치 함수를 전역으로 노출
(window as any).installPWA = () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('사용자가 PWA 설치를 수락했습니다');
      } else {
        console.log('사용자가 PWA 설치를 거부했습니다');
      }
      deferredPrompt = null;
    });
  }
};

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
