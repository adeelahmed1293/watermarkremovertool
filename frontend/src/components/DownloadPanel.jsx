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
        <span className="success-icon">🎉</span>
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
              ⬇️ Download
            </button>
          </div>
        ))}
      </div>

      {isBulkMode && processedVideos.length > 1 && (
        <div className="bulk-download">
          <button onClick={handleDownloadBulkAsZip} className="download-zip-btn">
            📦 Download All as ZIP
          </button>
        </div>
      )}

      <div className="panel-actions">
        <button onClick={onReset} className="reset-btn">
          Process Another Video
        </button>
      </div>
    </div>
  );
}
