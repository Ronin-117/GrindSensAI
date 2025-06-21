// src/pages/PoseDetector.tsx
import { DrawingUtils, FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EXERCISE_TRACKER_MAP } from '../logic/exerciseTrackers';
import './PoseDetector.css';

interface LandmarkPoint { x: number; y: number; z: number; visibility?: number; }

interface PoseDetectorProps {
  exercise: {
    exercise_name: string;
    target_reps_or_duration: string;
  };
  isActive: boolean; 
  onRepCounted: (repCount: number) => void;
  onSetCompleted: () => void;
}

const PoseDetector: React.FC<PoseDetectorProps> = ({
  exercise,
  isActive, 
  onRepCounted,
  onSetCompleted
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
    const animationFrameIdRef = useRef<number>();

    const [landmarkerLoaded, setLandmarkerLoaded] = useState<boolean>(false);
    const [statusText, setStatusText] = useState("Initializing...");

    const stageRef = useRef<"down" | "up" | null>(null);
    const repCounterRef = useRef<number>(0);
    const targetRepsRef = useRef<number>(11);

    useEffect(() => {
        const repsMatch = exercise.target_reps_or_duration.match(/\d+/);
        targetRepsRef.current = repsMatch && repsMatch[0] ? parseInt(repsMatch[0], 10) : 10;
        console.log(`[PoseDetector] Target reps for ${exercise.exercise_name} set to: ${targetRepsRef.current}`);
    }, [exercise.target_reps_or_duration, exercise.exercise_name]);

    useEffect(() => {
        const createPoseLandmarker = async () => {
            try {
                setStatusText("Loading AI Model...");
                const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm");
                poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numPoses: 1
                });
                setLandmarkerLoaded(true);
                setStatusText("Model loaded. Ready for supervision.");
                console.log("PoseLandmarker created and ready.");
            } catch (e: any) {
                console.error("Error creating PoseLandmarker:", e);
                setStatusText("Error loading AI model.");
            }
        };
        createPoseLandmarker();
        return () => { 
            poseLandmarkerRef.current?.close();
        };
    }, []);

    const predictWebcam = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const landmarker = poseLandmarkerRef.current;

        if (!isActive || !video || !canvas || !landmarker) return;

        if (video.readyState < 2 || video.paused) {
            animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
            return;
        }

        const canvasCtx = canvas.getContext("2d")!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const startTimeMs = performance.now();
        const results = landmarker.detectForVideo(video, startTimeMs);

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        const drawingUtils = new DrawingUtils(canvasCtx);
        
        if (results.landmarks && results.landmarks.length > 0) {
            const personLandmarks = results.landmarks[0] as LandmarkPoint[];
            const trackerFunc = EXERCISE_TRACKER_MAP[exercise.exercise_name.toLowerCase()];
            if (trackerFunc) {
              const { newStage, repCounted } = trackerFunc(personLandmarks, stageRef.current);
              stageRef.current = newStage;
              if (repCounted) {
                  repCounterRef.current += 1;
                  onRepCounted(repCounterRef.current);
                  if (repCounterRef.current >= targetRepsRef.current) {
                      console.log(`[PoseDetector] Set completed for ${exercise.exercise_name}! Notifying parent.`);
                        onSetCompleted(); 
                        repCounterRef.current = 0; 
                        stageRef.current = null;
                        onRepCounted(0);
                  }
              }
            } else {
                setStatusText(`No tracker for "${exercise.exercise_name}"`);
            }
            
            for (const landmark of results.landmarks) {
                drawingUtils.drawLandmarks(landmark, { radius: 2, fillColor: '#FFFFFF' });
                drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: '#007bff' });
            }
        }
        canvasCtx.restore();

        if (isActive) animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
    }, [isActive, exercise.exercise_name, onRepCounted, onSetCompleted]);

    const handleVideoPlay = () => {
        if (isActive) {
            animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !landmarkerLoaded) return;

        const stopWebcam = () => {
            console.log("Stopping webcam and predictions.");
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            const stream = video.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            setStatusText("Supervision OFF");
        };

        const startWebcam = async () => {
            console.log("Starting webcam...");
            setStatusText("Starting camera...");
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;
                setStatusText(" ");
            } catch (error) {
                console.error("Error accessing webcam:", error);
                setStatusText("Camera access denied.");
            }
        };

        if (isActive) {
            startWebcam();
        } else {
            stopWebcam();
        }

        return () => { 
            stopWebcam();
        };
    }, [isActive, landmarkerLoaded]);

    return (
        <div className="pose-container">
            <div className="video-container">
                <video ref={videoRef} autoPlay playsInline muted onPlaying={handleVideoPlay} className="input_video"></video>
                <canvas ref={canvasRef} className="output_canvas"></canvas>
            </div>
            <p >{landmarkerLoaded ? statusText : "Loading AI Model..."}</p>
        </div>
    );
};

export default PoseDetector;