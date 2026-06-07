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
        <div className="upload-icon">📹</div>
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
          <h3>Selected Files ({selectedFiles.length})</h3>
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
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
          >
            {isUploading ? 'Uploading...' : 'Upload All'}
          </button>
        </div>
      )}
    </div>
  );
}
