// filepath: (e.g., src/pages/TodaysWorkout.tsx or src/components/TodaysWorkout.tsx)
import React, { useEffect, useRef, useState } from 'react';

interface WorkoutItem {
  id: string;
  name: string;
  currentReps: number;
  targetReps: number;
  isCompleted: boolean;
}

const TodaysWorkout = () => {
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([
    { id: '1', name: 'cbcwvbcuiuwbviw', currentReps: 21, targetReps: 100, isCompleted: false },
    { id: '2', name: 'wbciicwiebcibe', currentReps: 100, targetReps: 100, isCompleted: true },
    { id: '3', name: 'qjncjqicbqibcqw', currentReps: 10, targetReps: 100, isCompleted: false },
  ]);

  const [isAISupervisionOn, setIsAISupervisionOn] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null); // Ref to hold current stream for cleanup

  // Effect to handle assigning the stream to the video element
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      if (cameraStream) {
        console.log("Attempting to assign stream to video element:", cameraStream);
        videoElement.srcObject = cameraStream;
        // Attempt to play, catch errors if autoplay doesn't work smoothly
        videoElement.play().catch(error => {
          console.error("Error attempting to play video:", error);
          // Common errors: NotAllowedError (autoplay policy), NotSupportedError
        });
      } else {
        console.log("Clearing stream from video element.");
        videoElement.srcObject = null;
      }
    }
  }, [cameraStream]); // Re-run this effect when cameraStream changes

  const toggleAISupervision = async () => {
    if (!isAISupervisionOn) {
      try {
        console.log("Turning ON AI supervision: Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        console.log("Camera access granted, stream obtained:", stream);
        activeStreamRef.current = stream; // Store for cleanup
        setCameraStream(stream);
        setIsAISupervisionOn(true);
      } catch (err: any) {
        console.error("Error accessing camera:", err.name, err.message, err);
        alert(`Could not access camera: ${err.name} - ${err.message}\n\nPlease ensure you have granted camera permissions and are on HTTPS (or localhost).`);
        setCameraStream(null);
        activeStreamRef.current = null;
        setIsAISupervisionOn(false);
      }
    } else {
      console.log("Turning OFF AI supervision: Stopping camera stream...");
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => {
          console.log("Stopping track:", track.label);
          track.stop();
        });
      }
      setCameraStream(null);
      activeStreamRef.current = null;
      setIsAISupervisionOn(false);
    }
  };

  // Effect for component unmount cleanup
  useEffect(() => {
    // This function will be called when the component unmounts
    return () => {
      console.log("TodaysWorkout component unmounting. Cleaning up camera stream if active.");
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
        activeStreamRef.current = null;
        console.log("Camera stream stopped during unmount.");
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: {
      padding: '20px',
      fontFamily: 'sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
    },
    mainTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 'normal',
      marginBottom: '10px',
      color: '#333',
    },
    workoutList: {
      listStyle: 'none',
      padding: 0,
      marginBottom: '30px',
    },
    workoutItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #eee',
    },
    workoutName: {
      flexGrow: 1,
      marginRight: '10px',
      color: '#333',
    },
    workoutStatus: {
      fontSize: '20px',
      marginRight: '10px',
      width: '25px',
      textAlign: 'center',
    },
    workoutProgress: {
      minWidth: '60px',
      textAlign: 'right',
      color: '#555',
    },
    controlsContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '20px', // Added some margin
    },
    toggleContainer: {
      display: 'flex',
      alignItems: 'center',
    },
    toggleLabel: {
      marginRight: '10px',
      color: '#333',
    },
    toggleSwitch: {
      width: '50px',
      height: '26px',
      backgroundColor: '#ccc',
      borderRadius: '13px',
      padding: '2px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      transition: 'background-color 0.2s ease',
    },
    toggleSwitchActive: {
      backgroundColor: '#4CAF50', // Green when active
    },
    toggleKnob: {
      width: '22px',
      height: '22px',
      backgroundColor: 'white',
      borderRadius: '50%',
      transition: 'transform 0.2s ease',
    },
    toggleKnobActive: {
      transform: 'translateX(24px)',
    },
    cameraViewContainer: {
      width: '200px',
      height: '150px',
      border: '2px solid black',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#e0e0e0', // Slightly darker placeholder background
      overflow: 'hidden',
    },
    cameraIconPlaceholder: {
      fontSize: '50px',
      color: '#aaa',
    },
    videoFeed: {
      width: '100%',
      height: '100%',
      objectFit: 'cover', // Ensures video covers the container, might crop
      display: 'block', // Can sometimes help with layout
    },
  };

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.mainTitle}>Today's workout</h1>

      <h2 style={styles.sectionTitle}>workout details</h2>
      <ul style={styles.workoutList}>
        {workoutItems.map(item => (
          <li key={item.id} style={styles.workoutItem}>
            <span style={styles.workoutName}>{item.name}</span>
            <span style={styles.workoutStatus}>
              {item.isCompleted ? '✓' : '✗'}
            </span>
            <span style={styles.workoutProgress}>
              {item.currentReps}/{item.targetReps}
            </span>
          </li>
        ))}
      </ul>

      <div style={styles.controlsContainer}>
        <div style={styles.toggleContainer}>
          <span style={styles.toggleLabel}>toggle AI supervision</span>
          <div
            style={{
              ...styles.toggleSwitch,
              ...(isAISupervisionOn ? styles.toggleSwitchActive : {}),
            }}
            onClick={toggleAISupervision}
            role="switch"
            aria-checked={isAISupervisionOn}
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleAISupervision(); }}
          >
            <div
              style={{
                ...styles.toggleKnob,
                ...(isAISupervisionOn ? styles.toggleKnobActive : {}),
              }}
            />
          </div>
        </div>

        <div style={styles.cameraViewContainer}>
          {/*
            The video element is always rendered but its srcObject is controlled.
            This can be more stable than conditionally rendering the video tag itself.
            If isAISupervisionOn is false, cameraStream should be null, and videoRef.current.srcObject will be null.
            The placeholder is shown if AI supervision is OFF.
            If AI supervision is ON, the video tag is used.
          */}
          {isAISupervisionOn ? (
            <video
              ref={videoRef}
              style={styles.videoFeed}
              autoPlay
              playsInline
              muted // Muting is often essential for autoplay to work without user gesture
            />
          ) : (
            <span style={styles.cameraIconPlaceholder}></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodaysWorkout;