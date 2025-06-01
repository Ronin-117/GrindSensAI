import mediapipe as mp
from util import calculate_angle


mp_pose = mp.solutions.pose

def curl_l(landmarks,stage,counter):

    shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
    elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
    wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
    
    # Calculate angle
    angle = calculate_angle(shoulder, elbow, wrist)
    
    # Curl counter logic
    if angle > 160:
        stage = "down"
    if angle < 40 and stage == 'down':
        stage = "up"
        counter += 1
    
    return stage,counter