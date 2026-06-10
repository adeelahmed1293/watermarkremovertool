import React from 'react';
import { downloadVideo, processBulkVideos } from '../api';
import './DownloadPanel.css';

export default function DownloadPanel({
  processedVideos,
  videoRegions,
  onReset,
  onError,
  isBulkMode,
}) {
  const handleDownloadSingle = (videoId, filename) => {
    const link = downloadVideo(videoId, filename);
    window.open(link, '_blank');
  };

  const handleDownloadBulkAsZip = async () => {
    try {
      const items = processedVideos.map((video) => ({
        video_id: video.video_id,
        bbox: videoRegions[video.video_id],
      }));

      const zipBlob = await processBulkVideos(items);
      
      // Create a download link from the blob
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'watermark_removed_videos.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      onError(`Download failed: ${error.message}`);
    }
  };

  return (
    <div className="download-panel">
      <h2>Step 4: Download Results</h2>

      <div className="success-message">
        <div className="success-icon-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <p>Watermark removal complete! Download your videos below.</p>
      </div>

      <div className="video-downloads">
        {processedVideos.map((video) => (
          <div key={video.video_id} className="download-item">
            <div className="video-info">
              <span className="video-name">{video.filename}</span>
              <span className="resolution">
                {video.width}x{video.height} • {video.fps.toFixed(1)} FPS
              </span>
            </div>
            <button
              onClick={() => handleDownloadSingle(video.video_id, video.filename)}
              className="download-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </button>
          </div>
        ))}
      </div>

      {isBulkMode && processedVideos.length > 1 && (
        <div className="bulk-download">
          <button onClick={handleDownloadBulkAsZip} className="download-zip-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            Download All as ZIP
          </button>
        </div>
      )}

      <div className="panel-actions">
        <button onClick={onReset} className="reset-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          Process Another Video
        </button>
      </div>
    </div>
  );
}
