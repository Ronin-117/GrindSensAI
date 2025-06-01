import mediapipe as mp
from util import calculate_angle


mp_pose = mp.solutions.pose

def sit_up(landmarks,stage,counter):

    hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
    knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
    ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
                landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
    
    # Calculate angle
    angle = calculate_angle(hip, knee, ankle)
    
    # Curl counter logic
    if angle > 160:
        stage = "up"
    if angle < 60 and stage == 'down':
        stage = "down"
        counter += 1
    
    return stage,counter