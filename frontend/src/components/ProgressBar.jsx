import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({ progress = 0, status = 'processing', filename = '' }) {
  return (
    <div className="progress-item">
      <div className="progress-header">
        <span className="filename">{filename}</span>
        <span className="percentage">{progress}%</span>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="progress-status">
        {status === 'processing' && (
          <>
            <span className="spinner">⚙️</span>
            <span>Processing...</span>
          </>
        )}
        {status === 'completed' && (
          <>
            <span className="check">✓</span>
            <span>Completed</span>
          </>
        )}
      </div>
    </div>
  );
}
