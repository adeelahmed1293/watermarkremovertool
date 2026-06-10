import React, { useState, useEffect } from 'react';
import UploadZone from './components/UploadZone';
import PreviewPanel from './components/PreviewPanel';
import ProgressBar from './components/ProgressBar';
import DownloadPanel from './components/DownloadPanel';
import { processSingleVideo, processBulkVideos, getJobStatus } from './api';
import './App.css';

export default function App() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Select, 3: Process, 4: Download
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [processingVideos, setProcessingVideos] = useState([]);
  const [videoRegions, setVideoRegions] = useState({});
  const [processedVideos, setProcessedVideos] = useState([]);
  const [errors, setErrors] = useState([]);
  const [processingStatus, setProcessingStatus] = useState({});

  const isBulkMode = uploadedVideos.length > 1;

  // Poll for status updates during processing
  useEffect(() => {
    if (step !== 3 || processingVideos.length === 0) return;

    const pollInterval = setInterval(async () => {
      const updates = {};
      for (const video of processingVideos) {
        try {
          const status = await getJobStatus(video.video_id);
          updates[video.video_id] = {
            progress: status.progress,
            status: status.status,
          };
        } catch (error) {
          // Job might not exist yet or already completed
          updates[video.video_id] = {
            progress: processingStatus[video.video_id]?.progress || 0,
            status: processingStatus[video.video_id]?.status || 'processing',
          };
        }
      }
      setProcessingStatus(updates);

      // Check if all videos are done
      const allDone = processingVideos.every(
        (v) => updates[v.video_id]?.status === 'completed'
      );
      if (allDone) {
        clearInterval(pollInterval);
        setStep(4);
      }
    }, 1000); // Poll every second

    return () => clearInterval(pollInterval);
  }, [step, processingVideos]);

  const addError = (message) => {
    const id = Date.now();
    setErrors((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setErrors((prev) => prev.filter((e) => e.id !== id));
    }, 5000);
  };

  const handleVideosUploaded = (videos) => {
    setUploadedVideos(videos);
    setStep(2);
  };

  const handleProcessingStart = async (regions) => {
    setVideoRegions(regions);
    setStep(3);
    setProcessingVideos(uploadedVideos);

    // Start processing
    try {
      if (isBulkMode) {
        const items = uploadedVideos.map((v) => ({
          video_id: v.video_id,
          bbox: regions[v.video_id],
        }));

        // Process each video sequentially
        const processed = [];
        for (const item of items) {
          try {
            await processSingleVideo(item.video_id, item.bbox);
            processed.push(
              uploadedVideos.find((v) => v.video_id === item.video_id)
            );
          } catch (error) {
            addError(`Failed to process video: ${error.message}`);
          }
        }

        setProcessedVideos(processed);
      } else {
        const video = uploadedVideos[0];
        try {
          await processSingleVideo(video.video_id, regions[video.video_id]);
          setProcessedVideos([video]);
        } catch (error) {
          addError(`Failed to process video: ${error.message}`);
          setStep(2);
          return;
        }
      }

      setStep(4);
    } catch (error) {
      addError(`Processing error: ${error.message}`);
      setStep(2);
    }
  };

  const handleReset = () => {
    setStep(1);
    setUploadedVideos([]);
    setProcessingVideos([]);
    setVideoRegions({});
    setProcessedVideos([]);
    setProcessingStatus({});
  };

  return (
    <div className="app">
      <header className="header">
        <h1>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#c084fc' }}>
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
            <line x1="7" y1="2" x2="7" y2="22"></line>
            <line x1="17" y1="2" x2="17" y2="22"></line>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="2" y1="7" x2="7" y2="7"></line>
            <line x1="2" y1="17" x2="7" y2="17"></line>
            <line x1="17" y1="17" x2="22" y2="17"></line>
            <line x1="17" y1="7" x2="22" y2="7"></line>
          </svg>
          Video Watermark Remover
        </h1>
        <p>Remove watermarks from your videos with AI-powered precision</p>
      </header>

      <div className="step-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <span>1</span>
          <p>Upload</p>
        </div>
        <div className={`step-connector ${step >= 2 ? 'active' : ''}`} />
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <span>2</span>
          <p>Select Region</p>
        </div>
        <div className={`step-connector ${step >= 3 ? 'active' : ''}`} />
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <span>3</span>
          <p>Process</p>
        </div>
        <div className={`step-connector ${step >= 4 ? 'active' : ''}`} />
        <div className={`step ${step >= 4 ? 'active' : ''}`}>
          <span>4</span>
          <p>Download</p>
        </div>
      </div>

      <main className="main-content">
        {step === 1 && (
          <UploadZone onVideosUploaded={handleVideosUploaded} onError={addError} />
        )}

        {step === 2 && (
          <PreviewPanel
            uploadedVideos={uploadedVideos}
            onProcessingStart={handleProcessingStart}
            onError={addError}
            isBulkMode={isBulkMode}
          />
        )}

        {step === 3 && (
          <div className="processing-panel">
            <h2>Step 3: Processing</h2>
            <p className="processing-subtitle">Your videos are being processed with AI inpainting. Please wait.</p>
            <div className="processing-list">
              {processingVideos.map((video) => (
                <ProgressBar
                  key={video.video_id}
                  progress={processingStatus[video.video_id]?.progress || 0}
                  status={processingStatus[video.video_id]?.status || 'processing'}
                  filename={video.filename}
                />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <DownloadPanel
            processedVideos={processedVideos}
            videoRegions={videoRegions}
            onReset={handleReset}
            onError={addError}
            isBulkMode={isBulkMode}
          />
        )}
      </main>

      {errors.length > 0 && (
        <div className="toast-container">
          {errors.map((error) => (
            <div key={error.id} className="toast error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error.message}</span>
            </div>
          ))}
        </div>
      )}

      <footer className="footer">
        <p>© 2024 Video Watermark Remover • Free & Open Source</p>
      </footer>
    </div>
  );
}
