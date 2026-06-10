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
            <span className="spinner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
            </span>
            <span>Processing...</span>
          </>
        )}
        {status === 'completed' && (
          <>
            <span className="check">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span>Completed</span>
          </>
        )}
      </div>
    </div>
  );
}
