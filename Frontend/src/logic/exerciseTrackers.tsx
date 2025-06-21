// src/logic/exerciseTrackers.ts

// A simple interface that matches the structure of a MediaPipe landmark
interface Landmark { x: number; y: number; z: number; visibility?: number; }

// --- Utility from util.py: Calculate Angle ---
function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}

// --- Landmark Indices Map ---
const PoseLandmarkIndices = {
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12, LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16, LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26, LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
  NOSE: 0, RIGHT_INDEX: 20, LEFT_INDEX: 19
};

export type TrackerStage = "down" | "up" | null;
export interface TrackerResult { newStage: TrackerStage; repCounted: boolean; }

function checkLandmarks(landmarks: Landmark[], ...indices: number[]): boolean {
  return indices.every(index => landmarks[index] && (landmarks[index].visibility === undefined || landmarks[index].visibility! > 0.5));
}

// --- Exercise Tracking Functions ---

// YOUR WORKING CURL LOGIC, NOW GENERIC
function bicep_curl(landmarks: Landmark[], stage: TrackerStage): TrackerResult {
  let repCounted = false;
  let newStage = stage;
  const required = [PoseLandmarkIndices.LEFT_SHOULDER, PoseLandmarkIndices.LEFT_ELBOW, PoseLandmarkIndices.LEFT_WRIST];
  if (!checkLandmarks(landmarks, ...required)) return { newStage, repCounted };

  const angle = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
  if (angle > 160) newStage = "down";
  if (angle < 40 && newStage === 'down') {
    newStage = "up";
    repCounted = true;
  }
  return { newStage, repCounted };
}

// YOUR SQUAT LOGIC, PORTED
function squat(landmarks: Landmark[], stage: TrackerStage): TrackerResult {
  let repCounted = false;
  let newStage = stage;
  const required = [PoseLandmarkIndices.LEFT_HIP, PoseLandmarkIndices.LEFT_KNEE, PoseLandmarkIndices.LEFT_ANKLE];
  if (!checkLandmarks(landmarks, ...required)) return { newStage, repCounted };

  const kneeAngle = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
  if (kneeAngle > 160) newStage = "up"; 
  if (kneeAngle < 100 && newStage === 'up') { 
    newStage = "down";
    repCounted = true;
  }
  return { newStage, repCounted };
}

// YOUR SHOULDER PRESS LOGIC, PORTED
function shoulder_press(landmarks: Landmark[], stage: TrackerStage): TrackerResult {
    let repCounted = false;
    let newStage = stage;
    const required = [PoseLandmarkIndices.RIGHT_INDEX, PoseLandmarkIndices.LEFT_INDEX, PoseLandmarkIndices.NOSE];
    if (!checkLandmarks(landmarks, ...required)) return { newStage, repCounted };

    const right_index_y = landmarks[PoseLandmarkIndices.RIGHT_INDEX].y;
    const left_index_y = landmarks[PoseLandmarkIndices.LEFT_INDEX].y;
    const nose_y = landmarks[PoseLandmarkIndices.NOSE].y;

    if (right_index_y < nose_y && left_index_y < nose_y) newStage = "up"; 
    if (right_index_y > nose_y && left_index_y > nose_y && newStage === 'up') {
        newStage = "down";
        repCounted = true;
    }
    return { newStage, repCounted };
}


// --- Function Mapper ---
export const EXERCISE_TRACKER_MAP: { [key: string]: (landmarks: Landmark[], stage: TrackerStage) => TrackerResult } = {
  "curl": bicep_curl,
  "bicep curl": bicep_curl,
  "dumbbell bicep curl": bicep_curl,
  "squat": squat,
  "bodyweight squats": squat,
  "goblet squats": squat,
  "shoulder press": shoulder_press,
  "dumbbell shoulder press": shoulder_press,
  "overhead press": shoulder_press,
};