import React, { useState } from 'react';
import CanvasSelector from './CanvasSelector';
import './PreviewPanel.css';

export default function PreviewPanel({
  uploadedVideos,
  onProcessingStart,
  onError,
  isBulkMode,
}) {
  const [videoRegions, setVideoRegions] = useState({});
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const currentVideo = uploadedVideos[currentVideoIndex];

  const handleBboxConfirmed = (bbox, applyToAll) => {
    const newRegions = { ...videoRegions };
    newRegions[currentVideo.video_id] = bbox;

    if (applyToAll && isBulkMode) {
      uploadedVideos.forEach((video) => {
        newRegions[video.video_id] = bbox;
      });
    }

    setVideoRegions(newRegions);

    // Move to next video if not all confirmed
    if (!isBulkMode && currentVideoIndex < uploadedVideos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else if (!isBulkMode && currentVideoIndex === uploadedVideos.length - 1) {
      // All videos processed
      onProcessingStart(newRegions);
    }
  };

  const handleStartProcessing = () => {
    const allConfirmed = uploadedVideos.every((v) => videoRegions[v.video_id]);

    if (!allConfirmed) {
      onError('Please confirm region for all videos');
      return;
    }

    onProcessingStart(videoRegions);
  };

  const nextVideo = () => {
    if (currentVideoIndex < uploadedVideos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const prevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const allConfirmed = uploadedVideos.every((v) => videoRegions[v.video_id]);

  return (
    <div className="preview-panel">
      <h2>Step 2: Select Watermark Region</h2>

      {isBulkMode && (
        <div className="video-counter">
          Video {currentVideoIndex + 1} of {uploadedVideos.length}
        </div>
      )}

      <CanvasSelector
        key={currentVideo.video_id}
        video={currentVideo}
        onBboxConfirmed={handleBboxConfirmed}
        onError={onError}
        isBulkMode={isBulkMode}
      />

      <div className="confirmation-status">
        {videoRegions[currentVideo.video_id] ? (
          <span className="confirmed">✓ Region confirmed for this video</span>
        ) : (
          <span className="pending">⚠ Select region for this video</span>
        )}
      </div>

      {isBulkMode && uploadedVideos.length > 1 && (
        <div className="video-navigation">
          <button onClick={prevVideo} disabled={currentVideoIndex === 0}>
            ← Previous Video
          </button>
          <button onClick={nextVideo} disabled={currentVideoIndex === uploadedVideos.length - 1}>
            Next Video →
          </button>
        </div>
      )}

      <div className="panel-actions">
        {isBulkMode ? (
          <button
            onClick={handleStartProcessing}
            disabled={!allConfirmed}
            className="start-processing-btn"
          >
            {allConfirmed ? 'Start Processing All Videos' : 'Complete all videos first'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
