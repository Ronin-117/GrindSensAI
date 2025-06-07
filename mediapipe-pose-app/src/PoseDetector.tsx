// src/PoseDetector.tsx
import { DrawingUtils, FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from 'react';
import "./PoseDetector.css";

// These are better managed with useRef to avoid issues with React's lifecycle
const PoseDetector = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
    const requestRef = useRef<number>(); // Ref to hold the animation frame ID

    const [webcamRunning, setWebcamRunning] = useState<boolean>(false);
    const [landmarkerLoaded, setLandmarkerLoaded] = useState<boolean>(false);

    // Initialize the PoseLandmarker
    useEffect(() => {
        const createPoseLandmarker = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );
            poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `/pose_landmarker_full.task`, // Using the model you specified
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numPoses: 2
            });
            setLandmarkerLoaded(true);
            console.log("PoseLandmarker created and ready.");
        };

        createPoseLandmarker();

        // Cleanup function to stop everything when the component unmounts
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const predictWebcam = async () => {
        if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) {
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext("2d")!;

        // Match canvas dimensions to video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Perform the detection
        const startTimeMs = performance.now();
        const results = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        const drawingUtils = new DrawingUtils(canvasCtx);
        
        // Draw the results
        if (results.landmarks) {
            for (const landmark of results.landmarks) {
                drawingUtils.drawLandmarks(landmark, {
                    radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1)
                });
                drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
            }
        }
        canvasCtx.restore();

        // ** THIS IS THE KEY CHANGE **
        // Call this function again to create a continuous loop
        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    const enableCam = async () => {
        if (!landmarkerLoaded || !videoRef.current) {
            return;
        }

        if (webcamRunning) {
            // ---- DISABLE LOGIC ----
            setWebcamRunning(false);
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        } else {
            // ---- ENABLE LOGIC ----
            setWebcamRunning(true);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                videoRef.current.srcObject = stream;
                
                // When the video is ready, start the prediction loop
                videoRef.current.addEventListener("loadeddata", () => {
                    requestRef.current = requestAnimationFrame(predictWebcam);
                });
            } catch (error) {
                console.error("Error accessing webcam:", error);
                setWebcamRunning(false); // Reset on error
            }
        }
    };

    return (
        <div className="pose-container">
            <div className="video-container">
                <video ref={videoRef} autoPlay playsInline className="input_video"></video>
                <canvas ref={canvasRef} className="output_canvas"></canvas>
            </div>
            <button id="webcamButton" onClick={enableCam} disabled={!landmarkerLoaded}>
                {!landmarkerLoaded ? 'LOADING MODEL...' : webcamRunning ? 'DISABLE PREDICTIONS' : 'ENABLE PREDICTIONS'}
            </button>
        </div>
    );
};

export default PoseDetector;