// src/PoseDetector.tsx
import { DrawingUtils, FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from 'react';
import "./PoseDetector.css";

// Define a simple interface for type safety
interface LandmarkPoint { x: number; y: number; z: number; }

function calculateAngle(a: LandmarkPoint, b: LandmarkPoint, c: LandmarkPoint): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
}

const PoseDetector = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
    const requestRef = useRef<number>();

    const [webcamRunning, setWebcamRunning] = useState<boolean>(false);
    const [landmarkerLoaded, setLandmarkerLoaded] = useState<boolean>(false);

    // --- START: THE KEY CHANGE ---
    // The count MUST be state to trigger UI updates.
    const [curlCount, setCurlCount] = useState(0);
    // The stage MUST be a ref to be updated synchronously inside the animation loop.
    const curlStageRef = useRef<'down' | 'up'>('down');
    // --- END: THE KEY CHANGE ---

    useEffect(() => {
        const createPoseLandmarker = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );
            poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `/pose_landmarker_full.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numPoses: 2
            });
            setLandmarkerLoaded(true);
            console.log("PoseLandmarker created and ready.");
        };

        createPoseLandmarker();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const predictWebcam = async () => {
        if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) {
            requestRef.current = requestAnimationFrame(predictWebcam);
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext("2d")!;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const startTimeMs = performance.now();
        const results = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        const drawingUtils = new DrawingUtils(canvasCtx);
        
        if (results.landmarks && results.landmarks.length > 0) {
            const personLandmarks = results.landmarks[0]; 
            const shoulder = personLandmarks[11];
            const elbow = personLandmarks[13];
            const wrist = personLandmarks[15];

            if (shoulder && elbow && wrist) {
                const angle = calculateAngle(shoulder, elbow, wrist);
                
                // --- CORRECTED COUNTER LOGIC USING THE REF ---
                if (angle < 30 && curlStageRef.current === 'down') {
                    // Update the count (this will cause a re-render)
                    setCurlCount(prevCount => prevCount + 1);
                    // Immediately update the ref's current value. This is synchronous.
                    curlStageRef.current = 'up';
                }
                
                if (angle > 160 && curlStageRef.current === 'up') {
                    // Reset the stage ref. This is also synchronous.
                    curlStageRef.current = 'down';
                }
            }
            
            for (const landmark of results.landmarks) {
                drawingUtils.drawLandmarks(landmark, { radius: 2 });
                drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
            }
        }
        canvasCtx.restore();

        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    const enableCam = async () => {
        if (!landmarkerLoaded || !videoRef.current) return;

        if (webcamRunning) {
            setWebcamRunning(false);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setCurlCount(0); // Reset count state
            curlStageRef.current = 'down'; // Reset stage ref
        } else {
            setWebcamRunning(true);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                videoRef.current.srcObject = stream;
                
                videoRef.current.addEventListener("loadeddata", () => {
                    requestRef.current = requestAnimationFrame(predictWebcam);
                });
            } catch (error) {
                console.error("Error accessing webcam:", error);
                setWebcamRunning(false);
            }
        }
    };

    return (
        <div className="pose-container">
            <div className="video-container">
                <video ref={videoRef} autoPlay playsInline className="input_video"></video>
                <canvas ref={canvasRef} className="output_canvas"></canvas>
            </div>
            <div className="counter-box">CURLS: {curlCount}</div>
            <button id="webcamButton" onClick={enableCam} disabled={!landmarkerLoaded}>
                {!landmarkerLoaded ? 'LOADING MODEL...' : webcamRunning ? 'DISABLE PREDICTIONS' : 'ENABLE PREDICTIONS'}
            </button>
        </div>
    );
};

export default PoseDetector;