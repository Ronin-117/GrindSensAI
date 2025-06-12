import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createNewRoutineApi, generateWorkoutWithAIApi, getSpecificRoutineApi, updateRoutineApi } from './api';
import './WorkoutMod.css'; // Import the new stylesheet

// Interfaces remain the same
interface ExerciseData {
  id?: number;
  exercise_name: string;
  target_muscles: string[];
  sets: string;
  reps_or_duration: string;
  rest_period: string;
  notes?: string | null;
}
interface WeeklyScheduleItemData {
  id?: number;
  day_of_week_or_number: string;
  session_focus: string;
  exercises: ExerciseData[];
}
interface TrainingRoutineFormData {
  id?: number;
  routine_id: string;
  routine_name: string;
  goal: string;
  experience_level: string;
  training_split: string;
  days_per_week: string;
  description: string;
  weekly_schedule: WeeklyScheduleItemData[];
  cardio_guidelines?: string | null;
  flexibility_guidelines?: string | null;
  precautions?: string | null;
  coach_response?: string | null;
  is_preset?: boolean;
  user?: number | null;
}

const initialRoutineState: TrainingRoutineFormData = {
  routine_id: `ROUTINE_${Date.now()}`,
  routine_name: '',
  goal: '',
  experience_level: 'Beginner',
  training_split: 'Full Body',
  days_per_week: '3',
  description: '',
  weekly_schedule: [],
  cardio_guidelines: '',
  flexibility_guidelines: '',
  precautions: '',
  coach_response: '',
  is_preset: false,
};

const WorkoutMod: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode = 'create', routineId: routineIdToEdit, isPreset: isPresetToEdit } = location.state || {};
  
  const [currentRoutine, setCurrentRoutine] = useState<TrainingRoutineFormData>(initialRoutineState);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [pageTitle, setPageTitle] = useState<string>('Create New Workout Routine');

  // All logic (useEffect, handlers) remains the same.
  useEffect(() => {
    // ... same logic as before
    if ((mode === 'edit' || mode === 'view') && routineIdToEdit) {
      setPageTitle(mode === 'edit' ? 'Edit Workout Routine' : 'View Workout Routine');
      if (isPresetToEdit && mode === 'edit') {
          setPageTitle('Customize Preset Routine');
      }
      setIsLoadingExisting(true);
      setError('');
      getSpecificRoutineApi(routineIdToEdit)
        .then(response => {
          const fetchedRoutine = response.data as TrainingRoutineFormData;
          if (isPresetToEdit && mode === 'edit') {
            setCurrentRoutine({
              ...fetchedRoutine,
              id: undefined,
              routine_id: `${fetchedRoutine.routine_id}_USER_${Date.now()}`,
              is_preset: false,
              user: undefined,
              routine_name: `${fetchedRoutine.routine_name} (My Version)`,
              coach_response: "Customized from a preset."
            });
            setPageTitle(`Customize: ${fetchedRoutine.routine_name}`);
          } else {
            setCurrentRoutine(fetchedRoutine);
          }
        })
        .catch((err: any) => {
          console.error("Error fetching routine for edit:", err);
          setError(err.response?.data?.detail || err.message || "Failed to load routine.");
        })
        .finally(() => setIsLoadingExisting(false));
    } else {
        setCurrentRoutine({...initialRoutineState, routine_id: `ROUTINE_${Date.now()}`});
        setPageTitle('Create New Workout Routine');
    }
  }, [mode, routineIdToEdit, isPresetToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // ... same logic as before
    const { name, value } = e.target;
    setCurrentRoutine(prev => ({ ...prev, [name]: value }));
  };

  const handlePromptSubmit = async () => {
    // ... same logic as before
    if (!userPrompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsAiLoading(true);
    setError('');
    try {
      const routineContext = (mode === 'edit' || (mode === 'view' && userPrompt)) ? currentRoutine : null;
      const response = await generateWorkoutWithAIApi(userPrompt, routineContext);
      const aiGeneratedRoutine = response.data as TrainingRoutineFormData;
      setCurrentRoutine({
        ...initialRoutineState,
        ...aiGeneratedRoutine,
        id: mode === 'edit' && !isPresetToEdit ? currentRoutine.id : undefined,
        routine_id: aiGeneratedRoutine.routine_id || currentRoutine.routine_id || `AI_ROUTINE_${Date.now()}`,
        is_preset: false,
      });
      setUserPrompt('');
      setPageTitle(aiGeneratedRoutine.routine_name ? `AI Draft: ${aiGeneratedRoutine.routine_name}` : "AI Generated Routine");
    } catch (err: any) {
      console.error("AI generation error:", err);
      setError(err.response?.data?.error || err.response?.data?.detail || err.message || "AI generation failed.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveWorkout = async () => {
    // ... same logic as before
    setIsSaving(true);
    setError('');
    try {
      let savedRoutine;
      if (currentRoutine.id && mode === 'edit' && !isPresetToEdit) {
        savedRoutine = await updateRoutineApi(currentRoutine.id, currentRoutine);
      } else {
        const routineToCreate = { ...currentRoutine };
        delete routineToCreate.id;
        savedRoutine = await createNewRoutineApi(routineToCreate);
      }
      console.log('Workout saved:', savedRoutine.data);
      alert('Workout routine saved successfully!');
      navigate('/evaluate-workout');
    } catch (err: any) {
      console.error("Save workout error:", err);
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message || "Failed to save workout.");
    } finally {
      setIsSaving(false);
    }
  };


  const renderRoutineForm = () => (
    <div className="routine-details-form">
      {/* Basic Info */}
      <div className="form-group">
        <label htmlFor="routine_name">Routine Name</label>
        <input id="routine_name" name="routine_name" type="text" className="form-input" value={currentRoutine.routine_name} onChange={handleInputChange} />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" className="form-textarea" value={currentRoutine.description} onChange={handleInputChange} />
      </div>
      <div className="form-group">
        <label htmlFor="coach_response">Coach Response/Notes (from AI)</label>
        <textarea id="coach_response" name="coach_response" className="form-textarea coach-response-textarea" value={currentRoutine.coach_response || ''} readOnly />
      </div>

      {/* Weekly Schedule */}
      {currentRoutine.weekly_schedule.map((item, scheduleIndex) => (
        <div key={`schedule-${scheduleIndex}`} className="nested-form-section">
          <h4>{item.day_of_week_or_number || `Day ${scheduleIndex + 1}`}</h4>
          <p><strong>Focus:</strong> {item.session_focus}</p>
          {item.exercises.map((ex, exIndex) => (
            <div key={`ex-${scheduleIndex}-${exIndex}`} className="exercise-form-item">
              <strong>{ex.exercise_name}</strong>
              <p>Sets: {ex.sets}, Reps/Duration: {ex.reps_or_duration}, Rest: {ex.rest_period}</p>
              <p>Muscles: {ex.target_muscles.join(', ')}</p>
              {ex.notes && <p><em>Note: {ex.notes}</em></p>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  if (isLoadingExisting) return <div className="status-container"><p>Loading routine...</p></div>;

  return (
    <div className="mod-page-container">
      <div className="mod-content-card">
        <header className="mod-header"><h1>{pageTitle}</h1></header>
        {error && <p className="error-message">{error}</p>}
        
        <div className="mod-main-layout">
          {/* Left Column for User Input */}
          <div className="mod-input-column">
            <section className="mod-section">
              <h2 className="mod-section-title">1. Generate or Modify with AI</h2>
              <div className="form-group">
                <label htmlFor="userPromptInput">Your Request</label>
                <textarea
                  id="userPromptInput"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="form-textarea ai-prompt-textarea"
                  placeholder="e.g., Create a 4-day upper/lower split for an intermediate lifter focused on strength."
                  disabled={isAiLoading}
                />
              </div>
              <button onClick={handlePromptSubmit} className="ai-submit-btn" disabled={isAiLoading}>
                {isAiLoading ? 'Generating...' : 'Submit to AI'}
              </button>
            </section>

            <section className="mod-section">
              <h2 className="mod-section-title">2. Fine-Tune Details</h2>
              <div className="form-group">
                <label htmlFor="goal">Primary Goal</label>
                <input id="goal" name="goal" type="text" className="form-input" value={currentRoutine.goal} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label htmlFor="experience_level">Experience Level</label>
                <select id="experience_level" name="experience_level" className="form-select" value={currentRoutine.experience_level} onChange={handleInputChange}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              {/* Add more inputs like training_split, days_per_week here */}
            </section>
          </div>

          {/* Right Column for Routine Display */}
          <div className="mod-routine-column">
            <section className="mod-section">
              <h2 className="mod-section-title">3. Review Your Routine</h2>
              {currentRoutine.routine_name || currentRoutine.weekly_schedule.length > 0 ? (
                renderRoutineForm()
              ) : (
                <p className="placeholder-text">
                  {isAiLoading ? 'AI is generating your routine...' : 'Your generated routine will appear here. Or, you can start filling it out manually.'}
                </p>
              )}
            </section>
          </div>
        </div>

        <div className="save-button-container">
          <button onClick={handleSaveWorkout} className="save-routine-btn" disabled={isSaving || !currentRoutine.routine_name}>
            {isSaving ? 'Saving...' : 'Save Routine'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutMod;