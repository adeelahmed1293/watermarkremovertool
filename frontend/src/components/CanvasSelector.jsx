import React, { useRef, useState, useEffect } from 'react';
import { previewRemoval, getPreviewImageUrl, getThumbnailUrl } from '../api';
import './CanvasSelector.css';

export default function CanvasSelector({
  video,
  onBboxConfirmed,
  onError,
  isBulkMode,
  onApplyToAll,
}) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [bbox, setBbox] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState(null);
  const [applyToAll, setApplyToAll] = useState(false);

  useEffect(() => {
    // Load thumbnail and set up canvas
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;

      // Calculate canvas dimensions based on image
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const maxWidth = canvas.parentElement.offsetWidth - 20;
      const maxHeight = 400;

      let displayWidth = img.width;
      let displayHeight = img.height;

      // Scale down if too large
      if (displayWidth > maxWidth) {
        const ratio = maxWidth / displayWidth;
        displayWidth = maxWidth;
        displayHeight = img.height * ratio;
      }

      if (displayHeight > maxHeight) {
        const ratio = maxHeight / displayHeight;
        displayHeight = maxHeight;
        displayWidth = img.width * ratio;
      }

      canvas.width = displayWidth;
      canvas.height = displayHeight;
      setCanvasDimensions({
        displayWidth,
        displayHeight,
        actualWidth: img.width,
        actualHeight: img.height,
      });

      // Draw image on canvas
      const ctx = canvas.getContext('2d');
      if (ctx && img.complete) {
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
      }
      
      console.log('Thumbnail loaded:', img.width, 'x', img.height);
    };

    img.onerror = () => {
      console.error('Failed to load thumbnail:', getThumbnailUrl(video.video_id));
      onError('Failed to load thumbnail');
    };

    // Load the thumbnail
    const thumbUrl = getThumbnailUrl(video.video_id);
    console.log('Loading thumbnail from:', thumbUrl);
    img.src = thumbUrl;
  }, [video, onError]);

  const scaleToActual = (displayX, displayY, displayW, displayH) => {
    if (!canvasDimensions) return null;

    const { displayWidth, displayHeight, actualWidth, actualHeight } = canvasDimensions;
    const scaleX = actualWidth / displayWidth;
    const scaleY = actualHeight / displayHeight;

    return {
      x: Math.round(displayX * scaleX),
      y: Math.round(displayY * scaleY),
      width: Math.round(displayW * scaleX),
      height: Math.round(displayH * scaleY),
    };
  };

  const drawRectangle = (fromX, fromY, toX, toY) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Redraw image
    const img = imageRef.current;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw rectangle
    const x = Math.min(fromX, toX);
    const y = Math.min(fromY, toY);
    const width = Math.abs(toX - fromX);
    const height = Math.abs(toY - fromY);

    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);

    return { x, y, width, height };
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPos) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const displayBbox = drawRectangle(startPos.x, startPos.y, x, y);
    setBbox(displayBbox);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handlePreview = async () => {
    if (!bbox || bbox.width === 0 || bbox.height === 0) {
      onError('Please draw a selection first');
      return;
    }

    const actualBbox = scaleToActual(bbox.x, bbox.y, bbox.width, bbox.height);
    if (!actualBbox) {
      onError('Invalid bounding box');
      return;
    }

    setIsLoadingPreview(true);
    try {
      const result = await previewRemoval(video.video_id, actualBbox);
      setPreview(result);
    } catch (error) {
      onError(`Preview failed: ${error.message}`);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleClear = () => {
    setBbox(null);
    setPreview(null);
    setStartPos(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  const handleConfirm = () => {
    if (!bbox || bbox.width === 0 || bbox.height === 0) {
      onError('Please draw a selection first');
      return;
    }

    const actualBbox = scaleToActual(bbox.x, bbox.y, bbox.width, bbox.height);
    if (!actualBbox) {
      onError('Invalid bounding box');
      return;
    }

    onBboxConfirmed(actualBbox, applyToAll);
  };

  return (
    <div className="canvas-selector">
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="selection-canvas"
        />
        {bbox && (
          <div className="bbox-display">
            <p>X: {bbox.x}px | Y: {bbox.y}px | W: {bbox.width}px | H: {bbox.height}px</p>
          </div>
        )}
      </div>

      {preview && (
        <div className="preview-section">
          <h3>Preview Result</h3>
          <div className="preview-comparison">
            <div className="preview-item">
              <p>Original</p>
              <img src={getThumbnailUrl(video.video_id)} alt="Original" />
            </div>
            <div className="preview-item">
              <p>Preview</p>
              <img src={getPreviewImageUrl(video.video_id)} alt="Preview" />
            </div>
          </div>
        </div>
      )}

      <div className="actions">
        <button onClick={handlePreview} disabled={isLoadingPreview}>
          {isLoadingPreview ? 'Generating Preview...' : 'Preview Removal'}
        </button>
        <button onClick={handleClear}>Clear Selection</button>
        <button onClick={handleConfirm} className="confirm-btn">
          Confirm Region
        </button>
      </div>

      {isBulkMode && (
        <div className="bulk-option">
          <label>
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
            />
            Apply same region to all videos
          </label>
        </div>
      )}
    </div>
  );
}
