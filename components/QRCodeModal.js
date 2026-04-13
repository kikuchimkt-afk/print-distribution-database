'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';

export default function QRCodeModal({ studentId, studentName, onClose }) {
  const canvasRef = useRef(null);
  const [lpUrl, setLpUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const url = `${window.location.origin}/lp/${studentId}`;
    setLpUrl(url);

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 280,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
    }
  }, [studentId]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(lpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = lpUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [lpUrl]);

  function handleDownload() {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `QR_${studentName}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }

  function handlePrint() {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head><title>QRコード - ${studentName}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;">
          <h2 style="margin-bottom:8px;">${studentName}</h2>
          <p style="color:#888;margin-bottom:24px;">宿題ページ QRコード</p>
          <img src="${dataUrl}" style="width:280px;height:280px;" />
          <p style="margin-top:16px;font-size:12px;color:#aaa;word-break:break-all;max-width:320px;text-align:center;">${lpUrl}</p>
        </body>
      </html>
    `);
    win.document.close();
    win.onload = () => { win.print(); };
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h3>📱 QRコード — {studentName}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            このQRコードを生徒に共有すると、宿題ページにアクセスできます
          </p>

          <div className="qr-canvas-wrapper">
            <canvas ref={canvasRef}></canvas>
          </div>

          <div className="qr-url-box">
            <input
              type="text"
              className="form-input"
              value={lpUrl}
              readOnly
              style={{ fontSize: 12, textAlign: 'center' }}
            />
          </div>

          <div className="qr-actions">
            <button className="btn btn-secondary" onClick={handleCopy}>
              {copied ? '✓ コピー済' : '📋 URLをコピー'}
            </button>
            <button className="btn btn-secondary" onClick={handleDownload}>
              📥 画像保存
            </button>
            <button className="btn btn-secondary" onClick={handlePrint}>
              🖨️ 印刷
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>閉じる</button>
          <a
            href={lpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            LPを開く ›
          </a>
        </div>
      </div>
    </div>
  );
}
