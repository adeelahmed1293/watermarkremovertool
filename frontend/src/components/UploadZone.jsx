import React, { useRef, useState } from 'react';
import { uploadVideos } from '../api';
import './UploadZone.css';

export default function UploadZone({ onVideosUploaded, onError }) {
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    handleFilesSelected(files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    handleFilesSelected(files);
  };

  const handleFilesSelected = (files) => {
    const videoFiles = files.filter((file) => {
      const ext = file.name.toLowerCase().split('.').pop();
      const validExts = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
      return validExts.includes(ext);
    });

    if (videoFiles.length === 0) {
      onError('No valid video files selected. Supported formats: MP4, MOV, AVI, MKV, WEBM');
      return;
    }

    if (videoFiles.some((f) => f.size > 500 * 1024 * 1024)) {
      onError('Some files exceed 500MB limit');
      return;
    }

    setSelectedFiles(videoFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      onError('No files selected');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedVideos = await uploadVideos(selectedFiles);
      onVideosUploaded(uploadedVideos);
      setSelectedFiles([]);
      setUploadProgress({});
    } catch (error) {
      onError(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="upload-zone">
      <div
        className="upload-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="upload-icon-container">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z"></path>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
        </div>
        <h2>Upload Video Files</h2>
        <p>Drag and drop your videos here or click to browse</p>
        <p className="file-info">Supported: MP4, MOV, AVI, MKV, WEBM (Max 500MB each)</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".mp4,.mov,.avi,.mkv,.webm,video/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="file-list">
          <h3>
            Selected Files <span>{selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}</span>
          </h3>
          <div className="files">
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info-item">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={isUploading}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
          >
            {isUploading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1.5s linear infinite', marginRight: '8px' }}>
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Upload & Select Region
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
