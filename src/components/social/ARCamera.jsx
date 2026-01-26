import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Zap,
  ZapOff,
  Image,
  X,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Crown,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { uploadFile, compressImage } from '../../services/storageService';
import { STORAGE_BUCKETS } from '../../config/supabase';

// AR Filter definitions
const AR_FILTERS = [
  {
    id: 'none',
    name: 'None',
    emoji: '',
    premium: false,
    overlays: [],
  },
  {
    id: 'dog-ears',
    name: 'Dog Ears',
    emoji: '',
    premium: false,
    overlays: [
      { type: 'ear-left', x: 0.25, y: 0.05, width: 0.15, height: 0.2 },
      { type: 'ear-right', x: 0.6, y: 0.05, width: 0.15, height: 0.2 },
    ],
  },
  {
    id: 'cat-whiskers',
    name: 'Cat Whiskers',
    emoji: '',
    premium: false,
    overlays: [
      { type: 'whiskers', x: 0.2, y: 0.4, width: 0.6, height: 0.2 },
      { type: 'cat-ears', x: 0.15, y: 0.02, width: 0.7, height: 0.25 },
    ],
  },
  {
    id: 'sunglasses',
    name: 'Sunglasses',
    emoji: '',
    premium: false,
    overlays: [
      { type: 'sunglasses', x: 0.15, y: 0.25, width: 0.7, height: 0.15 },
    ],
  },
  {
    id: 'party-hat',
    name: 'Party Hat',
    emoji: '',
    premium: true,
    overlays: [
      { type: 'party-hat', x: 0.25, y: -0.1, width: 0.5, height: 0.4 },
    ],
  },
  {
    id: 'heart-eyes',
    name: 'Heart Eyes',
    emoji: '',
    premium: true,
    overlays: [
      { type: 'heart-left', x: 0.2, y: 0.25, width: 0.15, height: 0.15 },
      { type: 'heart-right', x: 0.65, y: 0.25, width: 0.15, height: 0.15 },
    ],
  },
  {
    id: 'crown',
    name: 'Royal Crown',
    emoji: '',
    premium: true,
    overlays: [
      { type: 'crown', x: 0.2, y: -0.05, width: 0.6, height: 0.25 },
    ],
  },
  {
    id: 'bone-frame',
    name: 'Bone Frame',
    emoji: '',
    premium: true,
    overlays: [
      { type: 'frame-bone', x: 0, y: 0, width: 1, height: 1 },
    ],
  },
  {
    id: 'paw-frame',
    name: 'Paw Frame',
    emoji: '',
    premium: true,
    overlays: [
      { type: 'frame-paw', x: 0, y: 0, width: 1, height: 1 },
    ],
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    emoji: '',
    premium: true,
    overlays: [
      { type: 'rainbow', x: 0, y: 0, width: 1, height: 0.4 },
    ],
  },
];

// Draw filter overlays on canvas
function drawFilterOverlay(ctx, filter, width, height) {
  if (!filter || filter.id === 'none') return;

  ctx.save();

  filter.overlays.forEach((overlay) => {
    const x = overlay.x * width;
    const y = overlay.y * height;
    const w = overlay.width * width;
    const h = overlay.height * height;

    switch (overlay.type) {
      case 'ear-left':
      case 'ear-right': {
        // Draw dog ear
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        const earCenterX = x + w / 2;
        const earTopY = y;
        const earBottomY = y + h;
        ctx.moveTo(earCenterX, earTopY);
        ctx.bezierCurveTo(
          earCenterX - w * 0.6, earTopY + h * 0.3,
          earCenterX - w * 0.4, earBottomY,
          earCenterX, earBottomY
        );
        ctx.bezierCurveTo(
          earCenterX + w * 0.4, earBottomY,
          earCenterX + w * 0.6, earTopY + h * 0.3,
          earCenterX, earTopY
        );
        ctx.fill();
        // Inner ear
        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.ellipse(earCenterX, y + h * 0.5, w * 0.2, h * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'cat-ears': {
        // Draw cat ears
        ctx.fillStyle = '#FFA07A';
        // Left ear
        ctx.beginPath();
        ctx.moveTo(x + w * 0.15, y + h);
        ctx.lineTo(x + w * 0.25, y);
        ctx.lineTo(x + w * 0.35, y + h);
        ctx.closePath();
        ctx.fill();
        // Right ear
        ctx.beginPath();
        ctx.moveTo(x + w * 0.65, y + h);
        ctx.lineTo(x + w * 0.75, y);
        ctx.lineTo(x + w * 0.85, y + h);
        ctx.closePath();
        ctx.fill();
        // Inner ears
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.2, y + h * 0.8);
        ctx.lineTo(x + w * 0.25, y + h * 0.3);
        ctx.lineTo(x + w * 0.3, y + h * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + w * 0.7, y + h * 0.8);
        ctx.lineTo(x + w * 0.75, y + h * 0.3);
        ctx.lineTo(x + w * 0.8, y + h * 0.8);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'whiskers': {
        // Draw whiskers
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        // Left whiskers
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x + w * 0.35, y + h * (0.3 + i * 0.2));
          ctx.lineTo(x, y + h * (0.2 + i * 0.3));
          ctx.stroke();
        }
        // Right whiskers
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x + w * 0.65, y + h * (0.3 + i * 0.2));
          ctx.lineTo(x + w, y + h * (0.2 + i * 0.3));
          ctx.stroke();
        }
        // Nose
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y + h * 0.2);
        ctx.lineTo(x + w * 0.45, y + h * 0.4);
        ctx.lineTo(x + w * 0.55, y + h * 0.4);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'sunglasses': {
        // Draw sunglasses
        ctx.fillStyle = '#000';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        // Left lens
        ctx.beginPath();
        ctx.roundRect(x, y, w * 0.4, h, 10);
        ctx.fill();
        ctx.stroke();
        // Right lens
        ctx.beginPath();
        ctx.roundRect(x + w * 0.6, y, w * 0.4, h, 10);
        ctx.fill();
        ctx.stroke();
        // Bridge
        ctx.beginPath();
        ctx.moveTo(x + w * 0.4, y + h * 0.5);
        ctx.lineTo(x + w * 0.6, y + h * 0.5);
        ctx.stroke();
        // Gradient reflection
        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, w * 0.4 - 4, h * 0.4, 8);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x + w * 0.6 + 2, y + 2, w * 0.4 - 4, h * 0.4, 8);
        ctx.fill();
        break;
      }

      case 'party-hat': {
        // Draw party hat
        const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
        gradient.addColorStop(0, '#FF69B4');
        gradient.addColorStop(0.5, '#FFD700');
        gradient.addColorStop(1, '#00CED1');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y);
        ctx.lineTo(x + w * 0.2, y + h);
        ctx.lineTo(x + w * 0.8, y + h);
        ctx.closePath();
        ctx.fill();
        // Pom pom
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y, w * 0.08, 0, Math.PI * 2);
        ctx.fill();
        // Stripes
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 4;
        for (let i = 1; i < 4; i++) {
          const ratio = i / 4;
          const lineY = y + h * ratio;
          const lineWidth = w * ratio;
          ctx.beginPath();
          ctx.moveTo(x + w * 0.5 - lineWidth * 0.3, lineY);
          ctx.lineTo(x + w * 0.5 + lineWidth * 0.3, lineY);
          ctx.stroke();
        }
        break;
      }

      case 'heart-left':
      case 'heart-right': {
        // Draw heart
        ctx.fillStyle = '#FF1493';
        const heartX = x + w / 2;
        const heartY = y + h / 2;
        const heartSize = Math.min(w, h) * 0.8;
        ctx.beginPath();
        ctx.moveTo(heartX, heartY + heartSize * 0.3);
        ctx.bezierCurveTo(
          heartX, heartY,
          heartX - heartSize * 0.5, heartY,
          heartX - heartSize * 0.5, heartY + heartSize * 0.3
        );
        ctx.bezierCurveTo(
          heartX - heartSize * 0.5, heartY + heartSize * 0.6,
          heartX, heartY + heartSize * 0.8,
          heartX, heartY + heartSize
        );
        ctx.bezierCurveTo(
          heartX, heartY + heartSize * 0.8,
          heartX + heartSize * 0.5, heartY + heartSize * 0.6,
          heartX + heartSize * 0.5, heartY + heartSize * 0.3
        );
        ctx.bezierCurveTo(
          heartX + heartSize * 0.5, heartY,
          heartX, heartY,
          heartX, heartY + heartSize * 0.3
        );
        ctx.fill();
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(heartX - heartSize * 0.2, heartY + heartSize * 0.3, heartSize * 0.1, heartSize * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'crown': {
        // Draw crown
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x, y + h * 0.4);
        ctx.lineTo(x + w * 0.15, y + h * 0.6);
        ctx.lineTo(x + w * 0.3, y);
        ctx.lineTo(x + w * 0.5, y + h * 0.4);
        ctx.lineTo(x + w * 0.7, y);
        ctx.lineTo(x + w * 0.85, y + h * 0.6);
        ctx.lineTo(x + w, y + h * 0.4);
        ctx.lineTo(x + w, y + h);
        ctx.closePath();
        ctx.fill();
        // Jewels
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + w * 0.3, y + h * 0.35, w * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y + h * 0.55, w * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(x + w * 0.7, y + h * 0.35, w * 0.04, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'frame-bone': {
        // Draw bone frame border
        ctx.strokeStyle = '#F5DEB3';
        ctx.lineWidth = 20;
        ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);
        // Corner bones
        const boneSize = 40;
        const drawBone = (bx, by, angle) => {
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(angle);
          ctx.fillStyle = '#F5DEB3';
          // Bone shaft
          ctx.fillRect(-boneSize / 2, -5, boneSize, 10);
          // Bone ends
          ctx.beginPath();
          ctx.arc(-boneSize / 2, 0, 8, 0, Math.PI * 2);
          ctx.arc(boneSize / 2, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };
        drawBone(40, 40, Math.PI / 4);
        drawBone(w - 40, 40, -Math.PI / 4);
        drawBone(40, h - 40, -Math.PI / 4);
        drawBone(w - 40, h - 40, Math.PI / 4);
        break;
      }

      case 'frame-paw': {
        // Draw paw print frame
        ctx.strokeStyle = '#DEB887';
        ctx.lineWidth = 15;
        ctx.setLineDash([30, 20]);
        ctx.strokeRect(x + 15, y + 15, w - 30, h - 30);
        ctx.setLineDash([]);
        // Paw prints in corners
        const drawPaw = (px, py, scale = 1) => {
          ctx.fillStyle = '#8B4513';
          // Main pad
          ctx.beginPath();
          ctx.ellipse(px, py, 12 * scale, 15 * scale, 0, 0, Math.PI * 2);
          ctx.fill();
          // Toe pads
          const toes = [
            { dx: -12, dy: -18 },
            { dx: -4, dy: -22 },
            { dx: 4, dy: -22 },
            { dx: 12, dy: -18 },
          ];
          toes.forEach((toe) => {
            ctx.beginPath();
            ctx.ellipse(px + toe.dx * scale, py + toe.dy * scale, 5 * scale, 6 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
          });
        };
        drawPaw(50, 50);
        drawPaw(w - 50, 50);
        drawPaw(50, h - 50);
        drawPaw(w - 50, h - 50);
        break;
      }

      case 'rainbow': {
        // Draw rainbow
        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        const arcHeight = h * 0.8;
        const arcWidth = w * 0.8;
        const centerX = x + w / 2;
        const centerY = y + h;
        colors.forEach((color, i) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 15;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, arcWidth * (1 - i * 0.1), arcHeight * (1 - i * 0.1), 0, Math.PI, 0);
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
        break;
      }

      default:
        break;
    }
  });

  ctx.restore();
}

function ARCamera({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  const { hasFeature, currentTier } = useSubscription();
  const { isAuthenticated, profile } = useAuth();

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(AR_FILTERS[0]);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCarouselIndex, setFilterCarouselIndex] = useState(0);

  const isPremium = hasFeature('social') || currentTier !== 'free';
  const canAccessFilter = (filter) => !filter.premium || isPremium;

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);

      // Check for camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      let errorMessage = 'Failed to access camera';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support requested settings.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser. Try using Chrome or Safari.';
      }

      setCameraError(errorMessage);
      setCameraActive(false);
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setCameraActive(false);
  }, []);

  // Flip camera
  const flipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // Toggle flash (if supported)
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.();

    if (capabilities?.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled }],
        });
        setFlashEnabled(!flashEnabled);
      } catch (err) {
        console.error('Flash toggle error:', err);
      }
    }
  }, [flashEnabled]);

  // Render overlay on canvas
  const renderOverlay = useCallback(() => {
    if (!videoRef.current || !overlayCanvasRef.current || !cameraActive) return;

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Match canvas size to video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw filter overlay
    if (selectedFilter && selectedFilter.id !== 'none') {
      drawFilterOverlay(ctx, selectedFilter, canvas.width, canvas.height);
    }

    animationFrameRef.current = requestAnimationFrame(renderOverlay);
  }, [cameraActive, selectedFilter]);

  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw video frame
    if (facingMode === 'user') {
      // Mirror for selfie camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Reset transform
    if (facingMode === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Draw filter overlay
    if (selectedFilter && selectedFilter.id !== 'none') {
      drawFilterOverlay(ctx, selectedFilter, canvas.width, canvas.height);
    }

    // Flash effect
    if (flashEnabled) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Get image data
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

    const newPhoto = {
      id: Date.now(),
      dataUrl: imageDataUrl,
      filter: selectedFilter.name,
      timestamp: new Date().toISOString(),
    };

    setCapturedPhotos((prev) => [newPhoto, ...prev]);

    // Visual feedback
    setTimeout(() => setIsCapturing(false), 200);

    // Callback for parent component
    if (onCapture) {
      onCapture(newPhoto);
    }
  }, [cameraActive, facingMode, flashEnabled, selectedFilter, onCapture]);

  // Upload photo to storage
  const uploadPhoto = useCallback(async (photo) => {
    if (!isAuthenticated || !profile?.id) {
      return { error: new Error('Must be signed in to upload') };
    }

    setUploading(true);

    try {
      // Convert data URL to blob
      const response = await fetch(photo.dataUrl);
      const blob = await response.blob();

      // Compress image
      const compressedBlob = await compressImage(blob, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
      });

      // Create file
      const file = new File([compressedBlob], `ar-photo-${photo.id}.jpg`, {
        type: 'image/jpeg',
      });

      // Upload to storage
      const result = await uploadFile(file, STORAGE_BUCKETS.PET_PHOTOS, `${profile.id}/ar-photos`, {
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: 10 * 1024 * 1024,
      });

      return result;
    } catch (err) {
      console.error('Upload error:', err);
      return { error: err };
    } finally {
      setUploading(false);
    }
  }, [isAuthenticated, profile?.id]);

  // Delete photo
  const deletePhoto = useCallback((photoId) => {
    setCapturedPhotos((prev) => prev.filter((p) => p.id !== photoId));
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(null);
    }
  }, [selectedPhoto]);

  // Download photo
  const downloadPhoto = useCallback((photo) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = `ar-photo-${photo.id}.jpg`;
    link.click();
  }, []);

  // Effect to start/stop camera
  useEffect(() => {
    if (cameraActive) {
      renderOverlay();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraActive, renderOverlay]);

  // Effect to restart camera when facing mode changes
  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
  }, [facingMode, cameraActive, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Filter carousel navigation
  const scrollFilters = (direction) => {
    const maxIndex = Math.max(0, AR_FILTERS.length - 5);
    setFilterCarouselIndex((prev) => {
      if (direction === 'left') {
        return Math.max(0, prev - 1);
      }
      return Math.min(maxIndex, prev + 1);
    });
  };

  // Premium upgrade prompt
  if (!isPremium && !isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-8xl mb-4">📸</div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            AR Camera Experience
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Take fun photos with AR filters and effects
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 text-center">
          <Crown className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Premium Feature
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sign in and upgrade to Premium to access AR Camera with unlimited filters,
            photo capture, and cloud storage.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {AR_FILTERS.slice(1, 5).map((filter) => (
              <div
                key={filter.id}
                className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
              >
                <span className="text-2xl">{filter.emoji}</span>
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {filter.name}
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Free users can preview the camera with basic filters
          </p>
        </div>

        {/* Preview mode - limited functionality */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4">
            Try Basic Filters (Preview)
          </h4>
          <button
            onClick={startCamera}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Start Camera Preview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        AR Camera
      </h3>

      {/* Camera View */}
      <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          style={{ display: cameraActive ? 'block' : 'none' }}
        />

        {/* Overlay canvas for AR filters */}
        <canvas
          ref={overlayCanvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          style={{ display: cameraActive ? 'block' : 'none' }}
        />

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Capture flash effect */}
        <AnimatePresence>
          {isCapturing && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white z-10"
            />
          )}
        </AnimatePresence>

        {/* Camera inactive state */}
        {!cameraActive && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Camera className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-4">Camera is off</p>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-white text-gray-800 rounded-full font-bold hover:bg-gray-100 transition-all"
            >
              Start Camera
            </button>
          </div>
        )}

        {/* Camera error state */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
            <AlertCircle className="w-16 h-16 mb-4 text-red-400" />
            <p className="text-lg font-medium mb-2 text-center">Camera Error</p>
            <p className="text-sm text-gray-300 text-center mb-4">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-white text-gray-800 rounded-full font-bold hover:bg-gray-100 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Camera controls overlay */}
        {cameraActive && (
          <>
            {/* Top controls */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <button
                onClick={stopCamera}
                className="p-3 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-all"
              >
                <CameraOff className="w-5 h-5" />
              </button>

              <div className="flex gap-2">
                <button
                  onClick={toggleFlash}
                  className={`p-3 backdrop-blur-sm rounded-full transition-all ${
                    flashEnabled
                      ? 'bg-yellow-500 text-black'
                      : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                >
                  {flashEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={flipCamera}
                  className="p-3 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-all"
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-4">
              {/* Main controls */}
              <div className="flex items-center gap-6">
                {/* Gallery button */}
                <button
                  onClick={() => setShowGallery(true)}
                  className="p-4 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-all relative"
                >
                  <Image className="w-6 h-6" />
                  {capturedPhotos.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {capturedPhotos.length}
                    </span>
                  )}
                </button>

                {/* Capture button */}
                <motion.button
                  onClick={capturePhoto}
                  whileTap={{ scale: 0.9 }}
                  className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <div className="w-16 h-16 bg-white border-4 border-gray-300 rounded-full" />
                </motion.button>

                {/* Filter indicator */}
                <div className="p-4 bg-black/50 backdrop-blur-sm text-white rounded-full">
                  <span className="text-2xl">{selectedFilter.emoji || '✨'}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filter Carousel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100">AR Filters</h4>
          {!isPremium && (
            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
              <Lock className="w-3 h-3" />
              <span>Premium filters locked</span>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => scrollFilters('left')}
            disabled={filterCarouselIndex === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white dark:bg-gray-700 rounded-full shadow-md disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="overflow-hidden mx-8">
            <motion.div
              className="flex gap-3"
              animate={{ x: -filterCarouselIndex * 80 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {AR_FILTERS.map((filter) => {
                const isLocked = !canAccessFilter(filter);
                const isSelected = selectedFilter.id === filter.id;

                return (
                  <motion.button
                    key={filter.id}
                    onClick={() => !isLocked && setSelectedFilter(filter)}
                    disabled={isLocked}
                    whileHover={{ scale: isLocked ? 1 : 1.05 }}
                    whileTap={{ scale: isLocked ? 1 : 0.95 }}
                    className={`
                      flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center
                      transition-all relative
                      ${isSelected
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                        : isLocked
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    <span className="text-xl">{filter.emoji || (filter.id === 'none' ? '🚫' : '✨')}</span>
                    <span className="text-[10px] mt-1 truncate w-full px-1">{filter.name}</span>
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                        <Lock className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          <button
            onClick={() => scrollFilters('right')}
            disabled={filterCarouselIndex >= AR_FILTERS.length - 5}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white dark:bg-gray-700 rounded-full shadow-md disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowGallery(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Gallery header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  Captured Photos ({capturedPhotos.length})
                </h4>
                <button
                  onClick={() => setShowGallery(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Gallery content */}
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                {capturedPhotos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No photos captured yet</p>
                    <p className="text-sm mt-1">Take some AR photos to see them here</p>
                  </div>
                ) : selectedPhoto ? (
                  // Single photo view
                  <div className="space-y-4">
                    <button
                      onClick={() => setSelectedPhoto(null)}
                      className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back to gallery
                    </button>
                    <img
                      src={selectedPhoto.dataUrl}
                      alt="Captured"
                      className="w-full rounded-xl"
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Filter: {selectedPhoto.filter}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(selectedPhoto.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadPhoto(selectedPhoto)}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        {isAuthenticated && (
                          <button
                            onClick={() => uploadPhoto(selectedPhoto)}
                            disabled={uploading}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            {uploading ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <span className="text-sm font-medium px-2">Save to Cloud</span>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => deletePhoto(selectedPhoto.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Grid view
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {capturedPhotos.map((photo) => (
                      <motion.div
                        key={photo.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedPhoto(photo)}
                        className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={photo.dataUrl}
                          alt="Captured"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="text-white font-medium">View</span>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded">
                          {photo.filter}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">AR Camera Tips</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>- Good lighting improves filter quality</li>
          <li>- Use front camera for selfies with your pet</li>
          <li>- Captured photos are saved locally until uploaded</li>
          <li>- Premium users get access to all filters and cloud storage</li>
        </ul>
      </div>
    </div>
  );
}

ARCamera.propTypes = {
  onCapture: PropTypes.func,
};

export default ARCamera;
