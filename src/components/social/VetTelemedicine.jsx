import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  MessageSquare,
  Send,
  Settings,
  Monitor,
  Upload,
  X,
  Camera,
  Volume2,
  Clock,
  AlertCircle,
  Check,
  Loader2,
  ChevronDown,
  Paperclip,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { supabase, isOnlineMode } from '../../config/supabase';

// Available veterinary professionals
const AVAILABLE_VETS = [
  {
    id: 1,
    name: 'Dr. Jennifer Park',
    title: 'Emergency Veterinarian',
    specialty: 'Emergency & Critical Care',
    available: true,
    rating: 4.9,
    responseTime: '< 2 min',
    avatar: null,
    yearsExperience: 12,
  },
  {
    id: 2,
    name: 'Dr. Michael Chen',
    title: 'Veterinary Surgeon',
    specialty: 'Surgery & Orthopedics',
    available: true,
    rating: 4.8,
    responseTime: '< 5 min',
    avatar: null,
    yearsExperience: 15,
  },
  {
    id: 3,
    name: 'Nurse Sarah Williams',
    title: 'Veterinary Nurse Practitioner',
    specialty: 'General Health & Wellness',
    available: true,
    rating: 5.0,
    responseTime: '< 1 min',
    avatar: null,
    yearsExperience: 8,
  },
  {
    id: 4,
    name: 'Dr. Robert Kim',
    title: 'Veterinary Dermatologist',
    specialty: 'Skin & Allergies',
    available: false,
    rating: 4.7,
    responseTime: '< 10 min',
    avatar: null,
    yearsExperience: 10,
  },
];

// Common concerns quick access
const QUICK_CONCERNS = [
  { icon: '🤢', label: 'Vomiting', urgent: true },
  { icon: '🦴', label: 'Limping', urgent: false },
  { icon: '🔥', label: 'Fever', urgent: true },
  { icon: '😰', label: 'Anxiety', urgent: false },
  { icon: '🦷', label: 'Dental', urgent: false },
  { icon: '🩹', label: 'Wound', urgent: true },
  { icon: '💊', label: 'Medication', urgent: false },
  { icon: '🍽️', label: 'Diet', urgent: false },
];

// Format time for call duration
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Pre-call Setup Component
function PreCallSetup({ vet, onJoinCall, onCancel }) {
  const [cameraPermission, setCameraPermission] = useState(null);
  const [micPermission, setMicPermission] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [cameras, setCameras] = useState([]);
  const [mics, setMics] = useState([]);
  const [previewStream, setPreviewStream] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState(null);
  const previewRef = useRef(null);

  // Check permissions and get devices
  useEffect(() => {
    async function checkPermissions() {
      setIsChecking(true);
      setError(null);

      try {
        // Request camera and microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setCameraPermission(true);
        setMicPermission(true);
        setPreviewStream(stream);

        // Get available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        const audioDevices = devices.filter(d => d.kind === 'audioinput');

        setCameras(videoDevices);
        setMics(audioDevices);

        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
        if (audioDevices.length > 0) {
          setSelectedMic(audioDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Permission error:', err);
        if (err.name === 'NotAllowedError') {
          setError('Camera and microphone access was denied. Please allow access in your browser settings.');
          setCameraPermission(false);
          setMicPermission(false);
        } else if (err.name === 'NotFoundError') {
          setError('No camera or microphone found. Please connect a device and try again.');
        } else {
          setError('Failed to access camera/microphone. Please check your device settings.');
        }
      } finally {
        setIsChecking(false);
      }
    }

    checkPermissions();

    return () => {
      // Cleanup preview stream
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update preview when stream changes
  useEffect(() => {
    if (previewRef.current && previewStream) {
      previewRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  // Handle device change
  const handleDeviceChange = async (type, deviceId) => {
    if (type === 'camera') {
      setSelectedCamera(deviceId);
    } else {
      setSelectedMic(deviceId);
    }

    // Update stream with new device
    try {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: type === 'camera' ? { deviceId: { exact: deviceId } } : { deviceId: selectedCamera ? { exact: selectedCamera } : undefined },
        audio: type === 'mic' ? { deviceId: { exact: deviceId } } : { deviceId: selectedMic ? { exact: selectedMic } : undefined },
      });

      setPreviewStream(newStream);
    } catch (err) {
      console.error('Device change error:', err);
    }
  };

  const handleJoin = () => {
    onJoinCall({
      stream: previewStream,
      camera: selectedCamera,
      mic: selectedMic,
      vet,
    });
  };

  const getAvatarEmoji = (specialty) => {
    const emojiMap = {
      'Emergency & Critical Care': '🚨',
      'Surgery & Orthopedics': '🩺',
      'General Health & Wellness': '💚',
      'Skin & Allergies': '🧴',
    };
    return emojiMap[specialty] || '👩‍⚕️';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl bg-white/20 p-3 rounded-full">
                {getAvatarEmoji(vet.specialty)}
              </div>
              <div>
                <h3 className="text-xl font-bold">Joining call with</h3>
                <p className="text-white/90">{vet.name}</p>
                <p className="text-sm text-white/70">{vet.specialty}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isChecking ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Checking camera and microphone...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden">
                <video
                  ref={previewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  {cameraPermission && (
                    <span className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                      <Camera className="w-3 h-3" /> Camera ready
                    </span>
                  )}
                  {micPermission && (
                    <span className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                      <Mic className="w-3 h-3" /> Mic ready
                    </span>
                  )}
                </div>
              </div>

              {/* Device Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Camera className="w-4 h-4 inline mr-2" />
                    Camera
                  </label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => handleDeviceChange('camera', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {cameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mic className="w-4 h-4 inline mr-2" />
                    Microphone
                  </label>
                  <select
                    value={selectedMic}
                    onChange={(e) => handleDeviceChange('mic', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {mics.map((mic) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `Microphone ${mics.indexOf(mic) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Tips for a great call:</h5>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>- Find a quiet, well-lit area</li>
                  <li>- Have your pet nearby if possible</li>
                  <li>- Prepare any relevant health records or photos</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={!cameraPermission || !micPermission || isChecking}
            className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            <Video className="w-5 h-5" />
            Join Call
          </button>
        </div>
      </motion.div>
    </div>
  );
}

PreCallSetup.propTypes = {
  vet: PropTypes.object.isRequired,
  onJoinCall: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

// Video Call Component
function VideoCall({ vet, localStream, onEndCall, roomId }) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [sharedFiles, setSharedFiles] = useState([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const signalingChannelRef = useRef(null);
  const screenStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize WebRTC connection
  useEffect(() => {
    // Set local video
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    // Initialize peer connection
    initializePeerConnection();

    // Start call timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      cleanupCall();
    };
  }, [localStream, roomId]);

  const initializePeerConnection = async () => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // ICE servers configuration (STUN/TURN)
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          // In production, add TURN servers for NAT traversal
          // { urls: 'turn:turn.example.com', username: '...', credential: '...' }
        ],
      };

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local tracks to connection
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream);
        });
      }

      // Handle incoming tracks (remote video)
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setIsConnecting(false);
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && signalingChannelRef.current) {
          // Send candidate to signaling server
          signalingChannelRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            roomId,
          }));
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setIsConnecting(false);
        } else if (peerConnection.connectionState === 'failed') {
          setConnectionError('Connection failed. Please try again.');
        }
      };

      // Setup signaling via Supabase Realtime
      if (isOnlineMode) {
        const channel = supabase.channel(`video-call-${roomId}`)
          .on('broadcast', { event: 'signal' }, async ({ payload }) => {
            try {
              if (payload.type === 'offer') {
                await peerConnection.setRemoteDescription(payload.offer);
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                channel.send({
                  type: 'broadcast',
                  event: 'signal',
                  payload: { type: 'answer', answer },
                });
              } else if (payload.type === 'answer') {
                await peerConnection.setRemoteDescription(payload.answer);
              } else if (payload.type === 'ice-candidate') {
                await peerConnection.addIceCandidate(payload.candidate);
              }
            } catch (err) {
              console.error('Signaling error:', err);
            }
          })
          .subscribe();

        signalingChannelRef.current = channel;

        // Create and send offer (initiator)
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'offer', offer },
        });
      } else {
        // Demo mode - simulate remote video with a placeholder
        setTimeout(() => {
          setIsConnecting(false);
          // In demo mode, we won't have a real remote stream
        }, 2000);
      }
    } catch (err) {
      console.error('Peer connection error:', err);
      setConnectionError('Failed to establish connection. Please try again.');
      setIsConnecting(false);
    }
  };

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (signalingChannelRef.current) {
      supabase.removeChannel(signalingChannelRef.current);
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }

        // Restore camera video
        if (peerConnectionRef.current && localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        }
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;

        // Replace video track with screen track
        const screenTrack = screenStream.getVideoTracks()[0];
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        // Handle screen share stop
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error('Screen share error:', err);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: 'user',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Send via signaling channel
    if (signalingChannelRef.current) {
      signalingChannelRef.current.send({
        type: 'broadcast',
        event: 'chat',
        payload: message,
      });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload images or PDFs only.');
      return;
    }

    // Add to shared files
    const fileData = {
      id: Date.now(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
    };

    setSharedFiles(prev => [...prev, fileData]);

    // Add message about shared file
    const message = {
      id: Date.now(),
      sender: 'user',
      content: `Shared file: ${file.name}`,
      timestamp: new Date().toISOString(),
      file: fileData,
    };

    setMessages(prev => [...prev, message]);
  };

  const handleEndCall = () => {
    cleanupCall();
    onEndCall({
      duration: callDuration,
      messages,
      sharedFiles,
    });
  };

  const getAvatarEmoji = (specialty) => {
    const emojiMap = {
      'Emergency & Critical Care': '🚨',
      'Surgery & Orthopedics': '🩺',
      'General Health & Wellness': '💚',
      'Skin & Allergies': '🧴',
    };
    return emojiMap[specialty] || '👩‍⚕️';
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex">
      {/* Main video area */}
      <div className={`flex-1 flex flex-col ${showChat ? 'pr-80' : ''}`}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{getAvatarEmoji(vet.specialty)}</div>
              <div>
                <h3 className="font-bold">{vet.name}</h3>
                <p className="text-sm text-white/70">{vet.specialty}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatDuration(callDuration)}</span>
              </div>
              {isConnecting && (
                <span className="flex items-center gap-2 bg-yellow-500/80 px-3 py-1.5 rounded-full text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </span>
              )}
              {connectionError && (
                <span className="flex items-center gap-2 bg-red-500/80 px-3 py-1.5 rounded-full text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {connectionError}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Video container */}
        <div className="flex-1 relative">
          {/* Remote video (large) */}
          <div className="absolute inset-0 bg-gray-800">
            {isConnecting ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <div className="text-8xl mb-4">{getAvatarEmoji(vet.specialty)}</div>
                  <p className="text-xl font-medium">{vet.name}</p>
                  <p className="text-white/70">Connecting...</p>
                </div>
              </div>
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            {/* Placeholder for demo mode */}
            {!isOnlineMode && !isConnecting && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <div className="text-8xl mb-4">{getAvatarEmoji(vet.specialty)}</div>
                  <p className="text-xl font-medium">{vet.name}</p>
                  <p className="text-white/70">Demo Mode - No remote connection</p>
                </div>
              </div>
            )}
          </div>

          {/* Local video (picture-in-picture) */}
          <div className="absolute bottom-24 right-4 w-48 aspect-video bg-gray-700 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
            />
            {!isVideoEnabled && (
              <div className="flex items-center justify-center h-full text-white">
                <VideoOff className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Shared files overlay */}
          {sharedFiles.length > 0 && (
            <div className="absolute top-20 left-4 bg-black/60 rounded-xl p-3 max-w-xs">
              <p className="text-white text-sm font-medium mb-2">Shared Files</p>
              <div className="space-y-2">
                {sharedFiles.slice(-3).map((file) => (
                  <div key={file.id} className="flex items-center gap-2 text-white/80 text-sm">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Control bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-center gap-4">
            {/* Mic toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-colors ${
                isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isAudioEnabled ? (
                <Mic className="w-6 h-6 text-white" />
              ) : (
                <MicOff className="w-6 h-6 text-white" />
              )}
            </motion.button>

            {/* Video toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors ${
                isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isVideoEnabled ? (
                <Video className="w-6 h-6 text-white" />
              ) : (
                <VideoOff className="w-6 h-6 text-white" />
              )}
            </motion.button>

            {/* Screen share */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition-colors ${
                isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Monitor className="w-6 h-6 text-white" />
            </motion.button>

            {/* File upload */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Upload className="w-6 h-6 text-white" />
            </motion.button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Chat toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowChat(!showChat)}
              className={`p-4 rounded-full transition-colors relative ${
                showChat ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <MessageSquare className="w-6 h-6 text-white" />
              {messages.length > 0 && !showChat && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {messages.length}
                </span>
              )}
            </motion.button>

            {/* End call */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Chat sidebar */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">Chat</h4>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2 ${
                        msg.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      {msg.file && (
                        <a
                          href={msg.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 mt-2 text-xs underline"
                        >
                          <Paperclip className="w-3 h-3" />
                          {msg.file.name}
                        </a>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

VideoCall.propTypes = {
  vet: PropTypes.object.isRequired,
  localStream: PropTypes.object,
  onEndCall: PropTypes.func.isRequired,
  roomId: PropTypes.string.isRequired,
};

// Call Summary Component
function CallSummary({ vet, summary, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check className="w-10 h-10 text-green-500" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Call Ended
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Consultation with {vet.name}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <span className="text-gray-600 dark:text-gray-400">Duration</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">
              {formatDuration(summary.duration)}
            </span>
          </div>

          {summary.messages.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <span className="text-gray-600 dark:text-gray-400">Chat messages</span>
              <span className="font-semibold text-gray-800 dark:text-gray-100">
                {summary.messages.length}
              </span>
            </div>
          )}

          {summary.sharedFiles.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <span className="text-gray-600 dark:text-gray-400">Files shared</span>
              <span className="font-semibold text-gray-800 dark:text-gray-100">
                {summary.sharedFiles.length}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            A summary of this consultation has been saved to your pet's health records.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Done
        </button>
      </motion.div>
    </div>
  );
}

CallSummary.propTypes = {
  vet: PropTypes.object.isRequired,
  summary: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

// Main VetTelemedicine Component
function VetTelemedicine() {
  const { isAuthenticated, isOnlineMode } = useAuth();
  const { hasFeature } = useSubscription();

  const [consultationType, setConsultationType] = useState('chat');
  const [selectedVet, setSelectedVet] = useState(null);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [showPreCall, setShowPreCall] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [callSummary, setCallSummary] = useState(null);
  const [roomId, setRoomId] = useState(null);

  const availableVets = AVAILABLE_VETS.filter(v => v.available);

  const handleStartVideoCall = (vet) => {
    setSelectedVet(vet);
    setShowPreCall(true);
  };

  const handleJoinCall = (callData) => {
    setLocalStream(callData.stream);
    setRoomId(`room-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    setShowPreCall(false);
    setInCall(true);
  };

  const handleEndCall = (summary) => {
    setInCall(false);
    setCallSummary(summary);
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  };

  const handleCloseSummary = () => {
    setCallSummary(null);
    setSelectedVet(null);
    setRoomId(null);
  };

  const getAvatarEmoji = (specialty) => {
    const emojiMap = {
      'Emergency & Critical Care': '🚨',
      'Surgery & Orthopedics': '🩺',
      'General Health & Wellness': '💚',
      'Skin & Allergies': '🧴',
    };
    return emojiMap[specialty] || '👩‍⚕️';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            24/7 Veterinary Care
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Licensed professionals available anytime
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            {availableVets.length} vets online
          </span>
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-4 border-2 border-red-400 dark:border-red-600">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🚨</span>
          <div className="flex-1">
            <h4 className="font-bold text-red-800 dark:text-red-300">Emergency? Get help now</h4>
            <p className="text-sm text-red-700 dark:text-red-400">
              Connect with emergency vet in under 60 seconds
            </p>
          </div>
          <button
            onClick={() => {
              const emergencyVet = availableVets.find(v => v.specialty === 'Emergency & Critical Care') || availableVets[0];
              if (emergencyVet) handleStartVideoCall(emergencyVet);
            }}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold"
          >
            Emergency Call
          </button>
        </div>
      </div>

      {/* Consultation Type Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
          Choose Consultation Type
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setConsultationType('chat')}
            className={`p-6 rounded-xl transition-all ${
              consultationType === 'chat'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <MessageSquare className={`w-10 h-10 mx-auto mb-2 ${consultationType === 'chat' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
            <div className="font-semibold">Chat</div>
            <div className="text-sm mt-1 opacity-80">Text-based</div>
          </button>

          <button
            onClick={() => setConsultationType('video')}
            className={`p-6 rounded-xl transition-all ${
              consultationType === 'video'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <Video className={`w-10 h-10 mx-auto mb-2 ${consultationType === 'video' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
            <div className="font-semibold">Video Call</div>
            <div className="text-sm mt-1 opacity-80">Face-to-face</div>
          </button>

          <button
            onClick={() => setConsultationType('phone')}
            className={`p-6 rounded-xl transition-all ${
              consultationType === 'phone'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <Phone className={`w-10 h-10 mx-auto mb-2 ${consultationType === 'phone' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
            <div className="font-semibold">Phone</div>
            <div className="text-sm mt-1 opacity-80">Voice only</div>
          </button>
        </div>
      </div>

      {/* Quick Concerns */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
          Quick Concerns
        </h4>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_CONCERNS.map((concern, index) => (
            <button
              key={index}
              onClick={() => setSelectedConcern(concern)}
              className={`p-4 rounded-xl transition-all hover:shadow-md ${
                selectedConcern?.label === concern.label
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : concern.urgent
                    ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700'
                    : 'bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <div className="text-3xl mb-2">{concern.icon}</div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {concern.label}
              </div>
              {concern.urgent && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">Urgent</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Available Vets */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
          Available Now
        </h4>
        <div className="space-y-4">
          {AVAILABLE_VETS.map((vet) => (
            <motion.div
              key={vet.id}
              whileHover={{ scale: 1.01 }}
              className={`rounded-xl p-4 border ${
                vet.available
                  ? 'bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/10 dark:to-green-900/10 border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl bg-white dark:bg-gray-800 p-2 rounded-full">
                  {getAvatarEmoji(vet.specialty)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-gray-800 dark:text-gray-100">{vet.name}</h5>
                    {vet.available ? (
                      <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                        Offline
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{vet.title}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{vet.specialty}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-yellow-500 flex items-center gap-1">
                      <span>★</span> {vet.rating}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Response: {vet.responseTime}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {vet.yearsExperience}+ years exp
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {/* Handle chat */}}
                    disabled={!vet.available}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Chat
                  </button>
                  <button
                    onClick={() => handleStartVideoCall(vet)}
                    disabled={!vet.available}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Video Call
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6">
        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4">
          Consultation Pricing
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <MessageSquare className="w-8 h-8 text-blue-500 mb-2" />
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">Chat Consultation</h5>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">$29</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">per consultation</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <Video className="w-8 h-8 text-blue-500 mb-2" />
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">Video Consultation</h5>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">$59</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">per consultation</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-purple-400">
            <span className="text-2xl">♾️</span>
            <h5 className="font-semibold text-gray-800 dark:text-gray-100 mt-2">Unlimited Plan</h5>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">$99</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">per month</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Best value!</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
          Premium Features
        </h4>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-100">24/7 Availability</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Licensed vets available anytime, day or night</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-100">Health Records Integration</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Vets have access to your pet's complete history</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-100">Prescription Service</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Get prescriptions sent directly to your pharmacy</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-100">Follow-up Care</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Free follow-ups within 48 hours</div>
            </div>
          </li>
        </ul>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showPreCall && selectedVet && (
          <PreCallSetup
            vet={selectedVet}
            onJoinCall={handleJoinCall}
            onCancel={() => {
              setShowPreCall(false);
              setSelectedVet(null);
            }}
          />
        )}
      </AnimatePresence>

      {inCall && selectedVet && (
        <VideoCall
          vet={selectedVet}
          localStream={localStream}
          onEndCall={handleEndCall}
          roomId={roomId}
        />
      )}

      <AnimatePresence>
        {callSummary && selectedVet && (
          <CallSummary
            vet={selectedVet}
            summary={callSummary}
            onClose={handleCloseSummary}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default VetTelemedicine;
