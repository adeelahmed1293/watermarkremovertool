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
        <div className="video-counter-wrapper">
          <div className="video-counter">
            Video {currentVideoIndex + 1} of {uploadedVideos.length}
          </div>
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
          <span className="confirmed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Region confirmed for this video
          </span>
        ) : (
          <span className="pending">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Select region for this video
          </span>
        )}
      </div>

      {isBulkMode && uploadedVideos.length > 1 && (
        <div className="video-navigation">
          <button onClick={prevVideo} disabled={currentVideoIndex === 0}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Previous Video
          </button>
          <button onClick={nextVideo} disabled={currentVideoIndex === uploadedVideos.length - 1}>
            Next Video
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px', verticalAlign: 'middle' }}>
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            {allConfirmed ? 'Start Processing All Videos' : 'Confirm all regions first'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
