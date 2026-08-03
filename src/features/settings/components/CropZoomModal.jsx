import React, { useState } from 'react';
import { ZoomIn, Move, Check, X, RotateCcw } from 'lucide-react';

export default function CropZoomModal({ isOpen, imageSrc, onClose, onSave }) {
  const [zoom, setZoom] = useState(1);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  if (!isOpen || !imageSrc) return null;

  const handleReset = () => {
    setZoom(1);
    setPosX(0);
    setPosY(0);
  };

  const handleSave = () => {
    // Generate transformed canvas or pass updated crop metadata
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 300, 300);
      
      const drawWidth = 300 * zoom;
      const drawHeight = (img.height / img.width) * drawWidth;
      const offsetX = (300 - drawWidth) / 2 + posX;
      const offsetY = (300 - drawHeight) / 2 + posY;
      
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      onSave(canvas.toDataURL('image/jpeg'));
      onClose();
    };
    img.src = imageSrc;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-4xl p-6 border border-white/80 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-slate-900/95 space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ZoomIn className="w-5 h-5 text-indigo-500" /> Crop & Reposition Photo
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Crop Viewport with Circle Boundary Overlay */}
        <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200/50 dark:border-slate-800 shadow-inner group">
          <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
            <img 
              src={imageSrc} 
              alt="Crop target" 
              style={{
                transform: `scale(${zoom}) translate(${posX / zoom}px, ${posY / zoom}px)`,
                transition: 'transform 0.05s ease-out'
              }}
              className="max-w-full max-h-full object-contain pointer-events-none select-none"
            />
          </div>
          
          {/* Circular Crop Guide */}
          <div className="absolute inset-0 rounded-full border-2 border-indigo-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none" />
        </div>

        {/* Controls Grid */}
        <div className="space-y-3 pt-1 text-xs">
          {/* Zoom Slider */}
          <div className="space-y-1">
            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5"><ZoomIn className="w-3.5 h-3.5 text-indigo-500" /> Zoom Level</span>
              <span>{zoom.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Pan X & Y Sliders */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Move className="w-3 h-3 text-indigo-500" /> Pan Horizontal
              </span>
              <input 
                type="range" 
                min="-100" 
                max="100"
                value={posX}
                onChange={(e) => setPosX(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Move className="w-3 h-3 text-indigo-500" /> Pan Vertical
              </span>
              <input 
                type="range" 
                min="-100" 
                max="100"
                value={posY}
                onChange={(e) => setPosY(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="py-2.5 px-4 rounded-2xl glass-pill text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Check className="w-4 h-4" /> Apply Crop & Zoom
          </button>
        </div>

      </div>
    </div>
  );
}
