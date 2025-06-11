// src/pages/WorkoutMod.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  createNewRoutineApi,
  generateWorkoutWithAIApi,
  getSpecificRoutineApi,
  updateRoutineApi,
} from './api'; // Adjust path

// Interfaces from WorkoutDisplay.tsx can be reused or defined here
// For simplicity, let's assume FullTrainingRoutineData is available or defined similarly
// Make sure it aligns with what GeminiTrainingRoutine Pydantic model will produce
// and what your Django TrainingRoutineSerializer expects for saving.
interface ExerciseData {
  id?: number; // Optional for new exercises from AI
  exercise_name: string;
  target_muscles: string[];
  sets: string;
  reps_or_duration: string;
  rest_period: string;
  notes?: string | null;
}

interface WeeklyScheduleItemData {
  id?: number; // Optional for new items from AI
  day_of_week_or_number: string;
  session_focus: string;
  exercises: ExerciseData[];
}

interface TrainingRoutineFormData {
  // Fields directly editable by user or populated by AI
  id?: number; // DB ID, present if editing
  routine_id: string; // AI might generate this, or user can set
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
  coach_response?: string | null; // This will come from AI
  is_preset?: boolean; // Should always be false when user saves
  user?: number | null;
}

const initialRoutineState: TrainingRoutineFormData = {
  routine_id: `ROUTINE_${Date.now()}`, // Default unique-ish ID
  routine_name: '',
  goal: '',
  experience_level: 'Beginner',
  training_split: 'Full Body',
  days_per_week: '3',
  description: '',
  weekly_schedule: [
    { day_of_week_or_number: 'Day 1', session_focus: '', exercises: [] },
  ],
  cardio_guidelines: '',
  flexibility_guidelines: '',
  precautions: '',
  coach_response: '',
  is_preset: false,
};


const WorkoutMod: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const mode = location.state?.mode as 'create' | 'edit' | 'view' || 'create';
  const routineIdToEdit = location.state?.routineId as number | undefined;
  const isPresetToEdit = location.state?.isPreset as boolean || false;


  const [currentRoutine, setCurrentRoutine] = useState<TrainingRoutineFormData>(initialRoutineState);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [pageTitle, setPageTitle] = useState<string>('Create New Workout Routine');

  // Fetch existing routine if in 'edit' mode
  useEffect(() => {
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
            // For editing a preset, we treat it as creating a new routine FOR THE USER
            // by copying the preset's data but clearing its DB ID and setting user-specifics.
            setCurrentRoutine({
              ...fetchedRoutine,
              id: undefined, // This will be a new routine for the user
              routine_id: `${fetchedRoutine.routine_id}_USER_${Date.now()}`, // Make user's copy unique
              is_preset: false,
              user: undefined, // Will be set by backend on save
              routine_name: `${fetchedRoutine.routine_name} (My Version)`,
              coach_response: "Customized from a preset." // Or let AI generate new based on prompt
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
        // Reset to initial state for 'create' mode
        setCurrentRoutine({...initialRoutineState, routine_id: `ROUTINE_${Date.now()}`});
        setPageTitle('Create New Workout Routine');
    }
  }, [mode, routineIdToEdit, isPresetToEdit]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentRoutine(prev => ({ ...prev, [name]: value }));
  };

  // Handlers for nested weekly_schedule and exercises (these get complex)
  // For simplicity, we'll let AI populate/modify these for now.
  // A full UI for manual editing of nested structures is a big task.

  const handlePromptSubmit = async () => {
    if (!userPrompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsAiLoading(true);
    setError('');
    try {
      // If editing, send the current state of 'currentRoutine' as context
      const routineContext = (mode === 'edit' || (mode === 'view' && userPrompt)) ? currentRoutine : null;
      const response = await generateWorkoutWithAIApi(userPrompt, routineContext);
      // The AI response should be in the shape of TrainingRoutineFormData (or GeminiTrainingRoutine)
      const aiGeneratedRoutine = response.data as TrainingRoutineFormData;

      // Merge AI response with current form, or replace it.
      // AI might not return all fields, or you might want to keep some user inputs.
      // For now, let's assume AI returns a complete structure.
      // If AI returns a routine_id, use it, otherwise keep the existing one or generate.
      setCurrentRoutine({
        ...initialRoutineState, // Reset to ensure all fields are fresh from AI if needed
        ...aiGeneratedRoutine,
        id: mode === 'edit' && !isPresetToEdit ? currentRoutine.id : undefined, // Keep DB ID if truly editing existing user routine
        routine_id: aiGeneratedRoutine.routine_id || currentRoutine.routine_id || `AI_ROUTINE_${Date.now()}`, // Ensure routine_id exists
        is_preset: false, // AI generated routines are not presets
      });
      setUserPrompt(''); // Clear prompt after submission
      setPageTitle(aiGeneratedRoutine.routine_name ? `AI Draft: ${aiGeneratedRoutine.routine_name}` : "AI Generated Routine");

    } catch (err: any) {
      console.error("AI generation error:", err);
      setError(err.response?.data?.error || err.response?.data?.detail || err.message || "AI generation failed.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveWorkout = async () => {
    setIsSaving(true);
    setError('');
    try {
      let savedRoutine;
      if (currentRoutine.id && mode === 'edit' && !isPresetToEdit) { // True edit of existing user routine
        savedRoutine = await updateRoutineApi(currentRoutine.id, currentRoutine);
      } else { // Create new (either from scratch, AI generated, or copied from preset)
        const routineToCreate = { ...currentRoutine };
        delete routineToCreate.id; // Ensure no ID is sent for creation
        savedRoutine = await createNewRoutineApi(routineToCreate);
      }
      console.log('Workout saved:', savedRoutine.data);
      alert('Workout routine saved successfully!');
      navigate('/evaluate-workout'); // Or to the display page of the saved routine
    } catch (err: any) {
      console.error("Save workout error:", err);
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message || "Failed to save workout.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Basic UI for displaying/editing the routine structure ---
  // This part is highly simplified. A real UI for this would be complex with add/remove/edit for schedules/exercises.
  const renderRoutineForm = () => (
    <div>
      <div>
        <label>Routine Name:</label>
        <input type="text" name="routine_name" value={currentRoutine.routine_name} onChange={handleInputChange} />
      </div>
      <div>
        <label>Goal:</label>
        <textarea name="goal" value={currentRoutine.goal} onChange={handleInputChange} />
      </div>
      <div>
        <label>Description:</label>
        <textarea name="description" value={currentRoutine.description} onChange={handleInputChange} />
      </div>
      {/* Add more top-level fields: experience_level, training_split, days_per_week, etc. */}

      <h3 style={{marginTop: '20px'}}>Weekly Schedule:</h3>
      {currentRoutine.weekly_schedule.map((item, scheduleIndex) => (
        <div key={`schedule-${scheduleIndex}`} style={{ border: '1px dashed #ccc', padding: '10px', marginBottom: '10px' }}>
          <div>
            <label>Day/Number:</label>
            <input
              type="text"
              value={item.day_of_week_or_number}
              onChange={(e) => {
                const newSchedule = [...currentRoutine.weekly_schedule];
                newSchedule[scheduleIndex].day_of_week_or_number = e.target.value;
                setCurrentRoutine(prev => ({ ...prev, weekly_schedule: newSchedule }));
              }}
            />
          </div>
          <div>
            <label>Session Focus:</label>
            <input
              type="text"
              value={item.session_focus}
              onChange={(e) => {
                const newSchedule = [...currentRoutine.weekly_schedule];
                newSchedule[scheduleIndex].session_focus = e.target.value;
                setCurrentRoutine(prev => ({ ...prev, weekly_schedule: newSchedule }));
              }}
            />
          </div>
          <h4>Exercises:</h4>
          {item.exercises.map((ex, exIndex) => (
            <div key={`ex-${scheduleIndex}-${exIndex}`} style={{ border: '1px dotted #eee', padding: '5px', marginLeft: '20px', marginBottom: '5px' }}>
              <input
                placeholder="Exercise Name"
                value={ex.exercise_name}
                onChange={(e) => { /* ... complex update logic ... */ }}
              />
              {/* Add inputs for sets, reps, target_muscles (maybe a multi-select or tags input) etc. */}
              {/* This becomes very complex to manage state for deeply nested editable forms */}
            </div>
          ))}
          {/* Button to add new exercise to this day */}
        </div>
      ))}
      {/* Button to add new schedule day */}

      <div style={{marginTop: '10px'}}>
        <label>Coach Response/Notes (from AI):</label>
        <textarea name="coach_response" value={currentRoutine.coach_response || ''} readOnly style={{backgroundColor: '#f0f0f0', width: '100%', minHeight: '80px'}}/>
      </div>
    </div>
  );

  // --- Original Styles from template, adapt as needed ---
  const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: { padding: '20px', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' },
    title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '25px', textAlign: 'center' },
    promptSection: { display: 'flex', alignItems: 'center', marginBottom: '25px' },
    promptLabel: { marginRight: '10px', fontSize: '16px', whiteSpace: 'nowrap' },
    promptInput: { flexGrow: 1, padding: '8px 10px', border: '1px solid black', marginRight: '10px', fontSize: '16px' },
    submitButton: { padding: '8px 15px', border: '1px solid black', background: 'transparent', cursor: 'pointer', fontSize: '16px', whiteSpace: 'nowrap' },
    detailsSection: { marginBottom: '25px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px', background: '#f9f9f9' },
    detailsTitle: { fontSize: '18px', marginBottom: '10px', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '5px'},
    saveButtonContainer: { display: 'flex', justifyContent: 'flex-end', marginTop: '20px' },
    saveButton: { padding: '10px 20px', border: '1px solid black', backgroundColor: '#007bff', color: 'white', cursor: 'pointer', fontSize: '16px', borderRadius: '5px' },
    errorText: { color: 'red', marginBottom: '10px', textAlign: 'center' },
    loadingText: { textAlign: 'center', margin: '20px', fontStyle: 'italic' }
  };

  if (isLoadingExisting) return <p style={styles.loadingText}>Loading existing routine...</p>;

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.title}>{pageTitle}</h1>

      {error && <p style={styles.errorText}>{error}</p>}

      <div style={styles.promptSection}>
        <label htmlFor="userPromptInput" style={styles.promptLabel}>
          Your Request:
        </label>
        <input
          type="text"
          id="userPromptInput"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          style={styles.promptInput}
          placeholder="e.g., Create a 3-day beginner full body routine"
          disabled={isAiLoading}
        />
        <button onClick={handlePromptSubmit} style={styles.submitButton} disabled={isAiLoading}>
          {isAiLoading ? 'Generating...' : (mode === 'create' && !currentRoutine.routine_name) ? 'Generate Routine' : 'Modify with AI'}
        </button>
      </div>

      <div style={styles.detailsSection}>
        <h2 style={styles.detailsTitle}>Workout Details (AI Generated / Your Edits)</h2>
        {currentRoutine.routine_name || currentRoutine.weekly_schedule[0]?.exercises.length > 0 ? (
          renderRoutineForm() // Render the simplified form for now
        ) : (
          <p style={{ color: '#555' }}>
            {isAiLoading ? 'AI is working...' : 'Enter a prompt and click "Generate" or "Modify", or fill in the details manually.'}
          </p>
        )}
      </div>

      <div style={styles.saveButtonContainer}>
        <button onClick={handleSaveWorkout} style={styles.saveButton} disabled={isSaving || !currentRoutine.routine_name}>
          {isSaving ? 'Saving...' : (mode === 'create' || (mode === 'edit' && isPresetToEdit)) ? 'Save New Routine' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default WorkoutMod;