// src/components/ExerciseSupervision.tsx
import { DrawingUtils, FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ExerciseDataForSupervision { // Subset of LoggedExercise needed here
  original_exercise_id: number;
  exercise_name: string;
  // Add any other exercise-specific data needed for constraints later
}

interface ExerciseSupervisionProps {
  exercise: ExerciseDataForSupervision;
  isActive: boolean; // Is this supervision component currently active?
  onSupervisionError?: (error: Error) => void; // Optional error callback
  // onLandmarks?: (landmarks: any) => void; // Optional: Callback to send landmarks out
}

const ExerciseSupervision: React.FC<ExerciseSupervisionProps> = ({
  exercise,
  isActive,
  onSupervisionError,
  // onLandmarks,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isLandmarkerLoaded, setIsLandmarkerLoaded] = useState<boolean>(false);
  const [isCameraInitializing, setIsCameraInitializing] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>('');

  const createPoseLandmarker = useCallback(async () => {
    console.log(`[Supervision-${exercise.exercise_name}] Creating PoseLandmarker...`);
    setIsCameraInitializing(true); // Indicate model loading as part of init
    setLocalError('');
    try {
      const visionModule = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
      );
      const landmarker = await PoseLandmarker.createFromOptions(visionModule, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1
      });
      poseLandmarkerRef.current = landmarker;
      setIsLandmarkerLoaded(true);
      console.log(`[Supervision-${exercise.exercise_name}] PoseLandmarker SUCCESS.`);
    } catch (e: any) {
      console.error(`[Supervision-${exercise.exercise_name}] PoseLandmarker FAILED:`, e);
      setLocalError(`Failed to load AI model: ${e.message}`);
      if (onSupervisionError) onSupervisionError(e);
    } finally {
      setIsCameraInitializing(false);
    }
  }, [exercise.exercise_name, onSupervisionError]);

  const predictWebcam = useCallback(async () => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const poseLandmarker = poseLandmarkerRef.current;

    if (!isActive || !videoElement || !canvasElement || !poseLandmarker || !mediaStreamRef.current?.active) {
      // console.log(`[Supervision-${exercise.exercise_name}] Predict loop stopping/not starting.`);
      return;
    }
    if (videoElement.readyState < HTMLMediaElement.HAVE_METADATA || videoElement.paused || videoElement.ended) {
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) return;

    if (canvasElement.width !== videoElement.videoWidth) canvasElement.width = videoElement.videoWidth;
    if (canvasElement.height !== videoElement.videoHeight) canvasElement.height = videoElement.videoHeight;

    const startTimeMs = performance.now();
    const results = poseLandmarker.detectForVideo(videoElement, startTimeMs);

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    const drawingUtils = new DrawingUtils(canvasCtx);
    if (results.landmarks && results.landmarks.length > 0) {
      for (const landmark of results.landmarks) {
        drawingUtils.drawLandmarks(landmark, { radius: (data) => DrawingUtils.lerp(data.from!.z!, -0.15, 0.1, 5, 1) });
        drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
      }
      // if (onLandmarks) onLandmarks(results.landmarks); // Send landmarks out
    }
    canvasCtx.restore();

    if (isActive && mediaStreamRef.current?.active) { // Check isActive again before queuing next frame
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [exercise.exercise_name, isActive/*, onLandmarks*/]);


  // Effect to start/stop webcam and prediction loop based on `isActive` and `isLandmarkerLoaded`
  useEffect(() => {
    const videoElement = videoRef.current;

    const startSupervision = async () => {
      if (!videoElement) return;
      console.log(`[Supervision-${exercise.exercise_name}] StartSupervision called. Landmarker loaded: ${isLandmarkerLoaded}`);
      setLocalError('');
      setIsCameraInitializing(true);

      if (!isLandmarkerLoaded && !poseLandmarkerRef.current) {
        await createPoseLandmarker(); // This will set isLandmarkerLoaded and clear isCameraInitializing
        // The effect will re-run once isLandmarkerLoaded changes
        return;
      }
      // If landmarker is now loaded (or was already)
      if (poseLandmarkerRef.current) {
         try {
            console.log(`[Supervision-${exercise.exercise_name}] Requesting camera...`);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            mediaStreamRef.current = stream;
            videoElement.srcObject = stream;
            await videoElement.play();
            console.log(`[Supervision-${exercise.exercise_name}] Video playing. Starting prediction loop.`);
            setIsCameraInitializing(false); // Camera is ready
            animationFrameRef.current = requestAnimationFrame(predictWebcam);
          } catch (err: any) {
            console.error(`[Supervision-${exercise.exercise_name}] Camera/Setup error:`, err);
            setLocalError(`Camera error: ${err.message}`);
            if (onSupervisionError) onSupervisionError(err);
            setIsCameraInitializing(false);
            if (mediaStreamRef.current) { // Cleanup stream if obtained but play failed
                 mediaStreamRef.current.getTracks().forEach(track => track.stop());
                 mediaStreamRef.current = null;
            }
            if (videoElement) videoElement.srcObject = null;
          }
      } else {
          console.log(`[Supervision-${exercise.exercise_name}] Landmarker still not ready after attempt.`);
          setIsCameraInitializing(false); // Stop initializing if landmarker failed
      }
    };

    const stopSupervision = () => {
      console.log(`[Supervision-${exercise.exercise_name}] Stopping supervision.`);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (videoElement) videoElement.srcObject = null;
      setIsCameraInitializing(false); // Ensure this is reset
    };

    if (isActive) {
      startSupervision();
    } else {
      stopSupervision();
    }

    // Cleanup for this effect: if isActive becomes false, stopSupervision is called.
    // Also, if component unmounts while isActive, this cleanup will run.
    return () => {
      stopSupervision();
    };
  }, [isActive, isLandmarkerLoaded, exercise.exercise_name, createPoseLandmarker, predictWebcam, onSupervisionError]);


  // Cleanup PoseLandmarker instance on component unmount
  useEffect(() => {
    return () => {
      console.log(`[Supervision-${exercise.exercise_name}] Unmounting. Closing PoseLandmarker.`);
      poseLandmarkerRef.current?.close();
      poseLandmarkerRef.current = null;
      // Stream and animation frame should be cleaned up by the other effect's cleanup
    };
  }, [exercise.exercise_name]); // Re-run if exercise changes, though not typical for this component


  // --- Styles (can be moved to a separate CSS file or use CSS-in-JS) ---
  const styles: { [key: string]: React.CSSProperties } = {
    container: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    cameraCanvasContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '320px', height: '240px', border: '1px solid black', backgroundColor: '#333', position: 'relative', margin: '10px auto', overflow: 'hidden' },
    videoFeed: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' /* Mirror display */ },
    canvasOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' /* Mirror display */ },
    statusText: { fontStyle: 'italic', color: '#555', textAlign: 'center', minHeight: '20px' }
  };


  let statusMessage = "";
  if (isCameraInitializing && !isLandmarkerLoaded) statusMessage = "Loading AI Model...";
  else if (isCameraInitializing && isLandmarkerLoaded) statusMessage = "Initializing camera...";
  else if (!isActive) statusMessage = "Supervision is OFF.";
  else if (isActive && !mediaStreamRef.current?.active) statusMessage = "Starting camera..."; // After landmarker is loaded
  else if (isActive && mediaStreamRef.current?.active) statusMessage = "Supervision ON - Pose Detected!";


  return (
    <div style={styles.container}>
      {localError && <p style={{ color: 'red', textAlign: 'center' }}>Error: {localError}</p>}
      <div style={styles.cameraCanvasContainer}>
        <video ref={videoRef} style={styles.videoFeed} autoPlay playsInline muted />
        <canvas ref={canvasRef} style={styles.canvasOverlay} />
      </div>
      <p style={styles.statusText}>{statusMessage}</p>
    </div>
  );
};

export default ExerciseSupervision;