/**
 * ImportUploader.jsx — Drag & drop / click file upload component.
 * Supports: JPG, PNG, WEBP, PDF, CSV, XLSX
 */

import React, { useState, useRef, useCallback } from 'react';
import { ImageSquare, FileText, ChartBar, Folder, TrayArrowDown, Robot } from '@phosphor-icons/react';

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];
const ACCEPTED_EXTS = '.jpg,.jpeg,.png,.webp,.pdf,.csv,.xlsx,.xls';

const FILE_TYPE_ICONS = {
  'image/jpeg': <ImageSquare size={32} />, 'image/png': <ImageSquare size={32} />, 'image/webp': <ImageSquare size={32} />,
  'application/pdf': <FileText size={32} />,
  'text/csv': <ChartBar size={32} />,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': <ChartBar size={32} />,
  'application/vnd.ms-excel': <ChartBar size={32} />,
};

export default function ImportUploader({ onUpload, isProcessing }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();

  const handleFile = useCallback((f) => {
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const onInputChange = (e) => {
    const selected = e.target.files[0];
    if (selected) handleFile(selected);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="uploader-wrap">
      {/* Drop Zone */}
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current.click()}
        aria-label="Upload portfolio file"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTS}
          onChange={onInputChange}
          style={{ display: 'none' }}
        />

        {isProcessing ? (
          <div className="uploader-processing">
            <div className="ocr-loader">
              <div className="ocr-ring" />
              <div className="ocr-ring delay-1" />
              <div className="ocr-ring delay-2" />
            </div>
            <p className="uploader-processing-text">AI is reading your portfolio…</p>
            <p className="uploader-processing-sub">OCR + Gemini extraction in progress</p>
          </div>
        ) : file ? (
          <div className="file-selected">
            {preview ? (
              <img src={preview} alt="Preview" className="file-preview-img" />
            ) : (
              <div className="file-icon-large">
                {FILE_TYPE_ICONS[file.type] || <Folder size={32} />}
              </div>
            )}
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{formatSize(file.size)}</span>
            </div>
            <button
              className="file-remove"
              onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
              aria-label="Remove file"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="uploader-empty">
            <div className="uploader-icon"><TrayArrowDown size={32} /></div>
            <p className="uploader-main-text">Drop your portfolio file here</p>
            <p className="uploader-sub-text">or click to browse</p>
            <div className="supported-formats">
              {['JPG', 'PNG', 'WEBP', 'PDF', 'CSV', 'XLSX'].map(fmt => (
                <span key={fmt} className="fmt-badge">{fmt}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Broker examples */}
      <div className="broker-support">
        <span className="broker-support-label">Supports screenshots from:</span>
        <div className="broker-chips">
          {['Groww', 'Zerodha', 'Upstox', 'Angel One', 'INDmoney', 'Paytm Money'].map(b => (
            <span key={b} className="broker-chip">{b}</span>
          ))}
        </div>
      </div>

      {/* Upload button */}
      {file && !isProcessing && (
        <div className="uploader-action">
          <button className="btn-primary btn-lg" onClick={() => onUpload(file)}>
            <span><Robot size={18} /></span> Extract with AI
          </button>
        </div>
      )}
    </div>
  );
}
