import { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export function CameraCapture({ onCapture, onCancel, isUploading }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = async () => {
    setIsStarting(true);
    setError(null);
    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('دسترسی به دوربین رد شد. لطفاً دسترسی را اجازه دهید.');
      } else if (err.name === 'NotFoundError') {
        setError('دوربین یافت نشد.');
      } else {
        setError('خطا در راه‌اندازی دوربین');
      }
    } finally {
      setIsStarting(false);
    }
  };

  const switchCamera = async () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    await startCamera();
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(imageData);

      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmCapture = () => {
    if (!capturedImage) return;

    // Convert base64 to blob
    const byteString = atob(capturedImage.split(',')[1]);
    const mimeType = capturedImage.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

    onCapture(file);
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-dark-900/50">
        <button onClick={handleClose} className="p-2 text-white">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-medium">عکس‌برداری</span>
        {!capturedImage && stream && (
          <button onClick={switchCamera} className="p-2 text-white">
            <RotateCcw className="w-6 h-6" />
          </button>
        )}
        {(capturedImage || !stream) && <div className="w-10" />}
      </div>

      {/* Camera View / Captured Image */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {error ? (
          <div className="text-center p-8">
            <Camera className="w-16 h-16 mx-auto mb-4 text-dark-500" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={startCamera} isLoading={isStarting}>
              تلاش مجدد
            </Button>
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="max-w-full max-h-full object-contain"
            />
            {isStarting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="p-6 bg-dark-900/50">
        {capturedImage ? (
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={retake}
              className="w-16 h-16 rounded-full bg-dark-800 text-white flex items-center justify-center"
              disabled={isUploading}
            >
              <RotateCcw className="w-7 h-7" />
            </button>
            <button
              onClick={confirmCapture}
              disabled={isUploading}
              className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center"
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Check className="w-10 h-10" />
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <button
              onClick={capturePhoto}
              disabled={!stream || isStarting}
              className="w-20 h-20 rounded-full bg-white border-4 border-dark-500 flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
