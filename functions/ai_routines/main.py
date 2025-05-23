from google import genai
from google.genai import types
from typing import List, Optional
from pydantic import BaseModel, Field


GEMINI_API=None
try :
    from config import GEMINI_API
except Exception :
    GEMINI_API = "YOUR API CODE HERE"


class Exercise(BaseModel):
    exercise_name: str = Field(..., description="Name of the exercise.")
    target_muscles: List[str] = Field(..., description="Primary muscle groups targeted by the exercise.")
    sets: str = Field(..., description="Number of sets to perform (e.g., '2-3', '3-4').")
    reps_or_duration: str = Field(..., description="Number of repetitions or duration of the exercise (e.g., '8-12 reps', 'Hold for 20-30 seconds').")
    rest_period: str = Field(..., description="Rest time between sets (e.g., '60-90 seconds').")
    notes: Optional[str] = Field(None, description="Additional notes or tips for performing the exercise.")

class WeeklyScheduleItem(BaseModel):
    day_of_week_or_number: str = Field(..., description="Specifies the day or sequence number for this part of the schedule (e.g., 'Workout Day', 'Day 1 & 3: Upper Body').")
    session_focus: str = Field(..., description="The main focus of this training session (e.g., 'Full Body Strength', 'Upper Body Strength & Hypertrophy').")
    exercises: List[Exercise] = Field(..., description="List of exercises to be performed in this session.")

class TrainingRoutine(BaseModel):
    routine_id: str = Field(..., description="A unique identifier for the training routine.")
    routine_name: str = Field(..., description="The name of the training routine.")
    goal: str = Field(..., description="The primary goal of this training routine (e.g., 'Build foundational strength and muscle').")
    experience_level: str = Field(..., description="Target experience level for this routine (e.g., 'Beginner', 'Intermediate').")
    training_split: str = Field(..., description="The type of training split used (e.g., 'Full Body', 'Upper/Lower').")
    days_per_week: str = Field(..., description="Recommended number of training days per week (e.g., '2-3', '4').")
    description: str = Field(..., description="A brief description of the training routine.")
    weekly_schedule: List[WeeklyScheduleItem] = Field(..., description="The detailed weekly schedule of workouts.")
    cardio_guidelines: Optional[str] = Field(None, description="General guidelines for cardiovascular exercise alongside this routine.")
    flexibility_guidelines: Optional[str] = Field(None, description="General guidelines for flexibility work.")
    precautions: Optional[str] = Field(None, description="Important precautions or warnings for this routine.")
    Coach_response: str = Field(..., description="if the user asked any suggetions, tell whether it is good or not , its reason, altrenative if ist bad and reason")

# class TrainingRoutinesCollection(BaseModel):
#     training_routines: List[TrainingRoutine] = Field(..., description="A collection of different training routines.")


client = genai.Client(api_key=GEMINI_API)
chat = client.chats.create(model="gemini-2.0-flash",
                            config={
                                "system_instruction":"You are a physical training coach. make sure to give workout routine that are healthy for the user",
                                "response_mime_type": "application/json",
                                "response_schema": TrainingRoutine,
                            },
                        )

response = chat.send_message("can you give me a calestenics training routine. do you think 10 reps of inclined pushup and 20 reps of curl up a good idea")
print(response.text)

