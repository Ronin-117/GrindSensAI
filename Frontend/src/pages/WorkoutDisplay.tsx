import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSpecificRoutineApi } from './api';
import './WorkoutDisplay.css'; // Import the new stylesheet

// Interfaces (FullTrainingRoutineData, etc.) remain the same
interface ExerciseData {
  id: number;
  exercise_name: string;
  target_muscles: string[];
  sets: string;
  reps_or_duration: string;
  rest_period: string;
  notes?: string | null;
}

interface WeeklyScheduleItemData {
  id: number;
  day_of_week_or_number: string;
  session_focus: string;
  exercises: ExerciseData[];
}

export interface FullTrainingRoutineData {
  id: number;
  routine_name: string;
  description: string;
  is_preset: boolean;
  goal: string;
  experience_level: string;
  training_split: string;
  days_per_week: string;
  username?: string;
  weekly_schedule: WeeklyScheduleItemData[];
  cardio_guidelines?: string | null;
  flexibility_guidelines?: string | null;
  precautions?: string | null;
  coach_response?: string | null;
}

const WorkoutDisplay: React.FC = () => {
  const [routine, setRoutine] = useState<FullTrainingRoutineData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [openDayId, setOpenDayId] = useState<number | null>(null); 
  const location = useLocation();
  const navigate = useNavigate();
  const routineIdFromState = location.state?.routineId as number | undefined;

  useEffect(() => {
    if (!routineIdFromState) {
      setError('No routine ID provided.');
      setLoading(false);
      return;
    }
    const fetchRoutineDetails = async () => {
      setLoading(true);
      try {
        const response = await getSpecificRoutineApi(routineIdFromState);
        setRoutine(response.data);
        setError('');
        if (response.data.weekly_schedule && response.data.weekly_schedule.length > 0) {
          setOpenDayId(response.data.weekly_schedule[0].id);
        }
      } catch (err: any) {
        console.error('Failed to fetch routine details:', err);
        setError(err.response?.data?.detail || 'Failed to load routine details.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoutineDetails();
  }, [routineIdFromState, navigate]);

  const handleToggleDay = (dayId: number) => {
    setOpenDayId(openDayId === dayId ? null : dayId);
  };

  if (loading) return <div className="status-container"><p>Loading routine...</p></div>;
  if (error) return <div className="status-container"><p className="error-message">Error: {error}</p></div>;
  if (!routine) return <div className="status-container"><p>No routine data found.</p></div>;

  const GuidelineSection: React.FC<{ title: string; content?: string | null }> = ({ title, content }) => {
    if (!content) return null;
    return (
      <div className="guidelines-section">
        <h3>{title}</h3>
        <p>{content}</p>
      </div>
    );
  };

  return (
    <div className="display-page-container">
      <div className="routine-details-card">
        <header className="routine-header">
          <h1 className="routine-title">
            {routine.routine_name}
            {routine.is_preset && <span className="preset-badge">PRESET</span>}
          </h1>
          <p className="routine-description">{routine.description}</p>
        </header>

        <div className="edit-button-container">
          <Link to="/workout-mod" state={{ mode: 'edit', routineId: routine.id, isPreset: routine.is_preset }} className="edit-routine-link">
            <i className="fas fa-pencil-alt"></i>
            {routine.is_preset ? 'Use & Customize' : 'Edit Routine'}
          </Link>
        </div>

        <div className="meta-info-container">
          <div className="meta-tag"><strong>Goal:</strong> {routine.goal}</div>
          <div className="meta-tag"><strong>Level:</strong> {routine.experience_level}</div>
          <div className="meta-tag"><strong>Split:</strong> {routine.training_split}</div>
          <div className="meta-tag"><strong>Days/Week:</strong> {routine.days_per_week}</div>
          {routine.username && <div className="meta-tag"><strong>By:</strong> {routine.username}</div>}
        </div>

        <h2 className="section-title">Weekly Schedule</h2>
        <div className="weekly-schedule-container">
          {routine.weekly_schedule.map((day) => (
            <div key={day.id} className="schedule-day-accordion">
              <div className={`accordion-header ${openDayId === day.id ? 'open' : ''}`} onClick={() => handleToggleDay(day.id)}>
                <div>
                  <h3>{day.day_of_week_or_number}</h3>
                  <span className="session-focus">Focus: {day.session_focus}</span>
                </div>
                <i className="fas fa-chevron-right accordion-icon"></i>
              </div>
              <div className={`accordion-content ${openDayId === day.id ? 'open' : ''}`}>
                <div className="exercise-list">
                  {day.exercises.map((exercise) => (
                    <div key={exercise.id} className="exercise-card">
                      <h4 className="exercise-card-header">{exercise.exercise_name}</h4>
                      <div className="exercise-details-grid">
                        <div className="exercise-detail-item"><strong>Target Muscles:</strong> {exercise.target_muscles.join(', ')}</div>
                        <div className="exercise-detail-item"><strong>Sets:</strong> {exercise.sets}</div>
                        <div className="exercise-detail-item"><strong>Reps/Duration:</strong> {exercise.reps_or_duration}</div>
                        <div className="exercise-detail-item"><strong>Rest:</strong> {exercise.rest_period}</div>
                      </div>
                      {exercise.notes && <p className="exercise-notes"><em>Note:</em> {exercise.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="section-title">Additional Guidelines</h2>
        <GuidelineSection title="Cardio Guidelines" content={routine.cardio_guidelines} />
        <GuidelineSection title="Flexibility Guidelines" content={routine.flexibility_guidelines} />
        <GuidelineSection title="Precautions" content={routine.precautions} />
        <GuidelineSection title="Coach's Notes / Feedback" content={routine.coach_response} />
      </div>
    </div>
  );
};

export default WorkoutDisplay;