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

def curl_r(landmarks,stage,counter):

    shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
    elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
    wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
    
    # Calculate angle
    angle = calculate_angle(shoulder, elbow, wrist)
    
    # Curl counter logic
    if angle > 160:
        stage = "down"
    if angle < 40 and stage == 'down':
        stage = "up"
        counter += 1
    
    return stage,counter

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

def shoulder_press(landmarks,stage,counter):
    right_index = landmarks[mp_pose.PoseLandmark.RIGHT_INDEX.value].y
    left_index = landmarks[mp_pose.PoseLandmark.LEFT_INDEX.value].y
    nose = landmarks[mp_pose.PoseLandmark.NOSE.value].y
    
    if right_index > nose and left_index > nose:
        stage = "up"
    if right_index < nose and left_index < nose and stage == 'up':
        stage = "down"
        counter += 1
    
    return stage,counter

def lateral_raise(landmarks,stage,counter): #can be used for FRONT RAISE AS WELL
    right_index = landmarks[mp_pose.PoseLandmark.RIGHT_INDEX.value].y
    left_index = landmarks[mp_pose.PoseLandmark.LEFT_INDEX.value].y
    right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y

    if right_index > right_shoulder and left_index > right_shoulder:
        stage = "up"
    if right_index < right_shoulder and left_index < right_shoulder and stage == 'up':
        stage = "down"
        counter += 1
    
    return stage,counter

def squat(landmarks,stage,counter):
    right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y
    right_knee = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y

    if right_hip > right_knee:
        stage = "up"
    if right_hip < right_knee and stage == 'up':
        stage = "down"
        counter += 1
    
    return stage,counter

def sit_up(landmarks,stage,counter):
    nose = landmarks[mp_pose.PoseLandmark.NOSE.value].y
    right_knee = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y

    if right_knee > nose:
        stage = "up"
    if right_knee < nose and stage == 'up':
        stage = "down"
        counter += 1
    
    return stage,counter

def leg_raise(landmarks,stage,counter): #not sure if its working
    nose = [landmarks[mp_pose.PoseLandmark.NOSE.value].x,
            landmarks[mp_pose.PoseLandmark.NOSE.value].y]
    right_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x,
                landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
    right_foot_index = [landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value].x,
                landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value].y]
    
    # Calculate angle
    angle = calculate_angle(nose, right_knee, right_foot_index)

    # counter logic
    if angle > 160:
        stage = "down"
    if angle < 100 and stage == 'down':
        stage = "up"
        counter += 1









