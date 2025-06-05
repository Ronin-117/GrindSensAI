// src/pages/TodaysWorkout.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateDailyLogApi, updateDailyLogApi, /* getUserWorkoutPlanApi - if not getting plan via log */ } from './api';

// Interfaces for the data structures
interface LoggedExercise {
  original_exercise_id: number;
  exercise_name: string;
  target_muscles: string[];
  target_sets: string; // e.g., "3" or "2-3" - needs parsing for target number
  target_reps_or_duration: string; // e.g., "8-12 reps" or "30s"
  notes_from_routine?: string | null;
  completed_status: 'pending' | 'partial' | 'full' | 'skipped';
  actual_sets_completed: number;
  actual_reps_per_set: (number | string)[]; // Can be number of reps or duration string
  actual_duration_seconds?: number | null;
  weight_used_per_set?: (number | string)[];
  user_notes_for_exercise?: string;
}

interface DailyLogData {
  id: number; // DB ID of the DailyWorkoutLog
  date: string; // YYYY-MM-DD
  routine_log_name: string;
  routine_used: number | null; // ID of TrainingRoutine
  logged_exercises: LoggedExercise[];
  completion_percentage: number;
  session_notes?: string | null;
  workout_plan: number; // ID of WorkoutPlan
}

const TodaysWorkout: React.FC = () => {
  const [dailyLog, setDailyLog] = useState<DailyLogData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  // AI Supervision state (from your template)
  const [isAISupervisionOn, setIsAISupervisionOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);


  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const fetchTodaysWorkoutLog = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const todayStr = getTodayDateString();
    try {
      const response = await getOrCreateDailyLogApi(todayStr);
      let fetchedLog = response.data as DailyLogData;
      if (fetchedLog.logged_exercises.length === 0) {
        fetchedLog.completion_percentage = 100; // Treat as completed rest day
      }
      setDailyLog(response.data as DailyLogData);
    } catch (err: any) {
      console.error("Error fetching/creating today's log:", err);
      if (err.response && err.response.status === 401) {
        setError('Session expired. Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(err.response?.data?.error || err.message || "Could not load today's workout.");
      }
      setDailyLog(null); // Ensure log is cleared on error
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchTodaysWorkoutLog();
  }, [fetchTodaysWorkoutLog]);

  // --- AI Supervision (from your template) ---
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      if (cameraStream) videoElement.srcObject = cameraStream; else videoElement.srcObject = null;
      if(cameraStream) videoElement.play().catch(e => console.error("Video play error:", e));
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => { // Cleanup on unmount
      if (activeStreamRef.current) activeStreamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  const toggleAISupervision = async () => { /* ... your existing logic ... */ };
  // --- End AI Supervision ---



  const calculateActiveWorkoutCompletion = useCallback((): number => {
    if (!dailyLog || dailyLog.logged_exercises.length === 0) {
        // If there are no exercises, we don't calculate percentage here.
        // The initial fetchTodaysWorkoutLog sets it to 100 if applicable.
        // Or, if exercises were dynamically removed and list became empty, return 0.
        return dailyLog?.completion_percentage || 0; // Return existing or 0
    }

    let totalExercises = dailyLog.logged_exercises.length;
    let completedExercises = 0;
    let sumOfIndividualExerciseProgress = 0;

    dailyLog.logged_exercises.forEach(ex => {
        // Simple: if status is 'full', it's 100% for that exercise for now.
        // More complex: calculate based on sets/reps completed vs target.
        if (ex.completed_status === 'full') {
            sumOfIndividualExerciseProgress += 100;
            completedExercises++;
        } else if (ex.completed_status === 'partial') {
            // Crude partial: assume 50% if any work done
            // Better: (actual_sets / target_sets_numeric) * 100
            let targetSetsNum = parseInt(ex.target_sets.split('-')[0], 10) || 1; // Get min target sets
            if(targetSetsNum > 0) {
                 sumOfIndividualExerciseProgress += (ex.actual_sets_completed / targetSetsNum) * 100;
            }
            if (ex.actual_sets_completed > 0) completedExercises++; // Count as 'worked on'
        }
    });
    return Math.round(sumOfIndividualExerciseProgress / totalExercises);
  }, [dailyLog]);


  // --- Handle Exercise Progress Update ---
  const handleExerciseUpdate = (exerciseIndex: number, updatedExerciseData: Partial<LoggedExercise>) => {
    if (!dailyLog) return;

    const updatedExercises = [...dailyLog.logged_exercises];
    const exerciseToUpdate = { ...updatedExercises[exerciseIndex], ...updatedExerciseData };

    let targetSetsNum = 1;
    try { targetSetsNum = parseInt(exerciseToUpdate.target_sets.split('-')[0], 10) || 1; }
    catch { /* default to 1 */ }

    if (exerciseToUpdate.actual_sets_completed >= targetSetsNum) {
        exerciseToUpdate.completed_status = 'full';
    } else if (exerciseToUpdate.actual_sets_completed > 0) {
        exerciseToUpdate.completed_status = 'partial';
    } else {
        exerciseToUpdate.completed_status = 'pending';
    }
    updatedExercises[exerciseIndex] = exerciseToUpdate;

    // Recalculate based on the new state of exercises IF there are exercises
    const newOverallCompletionPercentage = dailyLog.logged_exercises.length > 0
        ? calculateActiveWorkoutCompletion() // This function will now use the updated dailyLog internally
        : 100; // If exercises were somehow removed and list is now empty, treat as rest (or 0 if preferred)

    setDailyLog(prevLog => {
        if (!prevLog) return null;
        const newLogState = {
            ...prevLog,
            logged_exercises: updatedExercises,
        };
        // Update completion percentage based on whether exercises exist
        if (newLogState.logged_exercises.length > 0) {
            // Need to pass the updated exercises to the calculation for immediate accuracy
            const tempLogForCalc = {...newLogState};
            newLogState.completion_percentage = calculateActiveWorkoutCompletion(tempLogForCalc); // Pass updated state
        } else {
            newLogState.completion_percentage = 100; // Assuming empty means rest
        }
        return newLogState;
    });
  };

  const incrementSet = (exerciseIndex: number) => {
    if (!dailyLog) return;
    const ex = dailyLog.logged_exercises[exerciseIndex];
    // You'd need to parse ex.target_sets to get max sets
    const maxSets = parseInt(ex.target_sets.split('-').pop() || ex.target_sets, 10) || 1;
    const newSetsCompleted = Math.min(ex.actual_sets_completed + 1, maxSets);

    // For simplicity, when a set is incremented, let's assume they did the target reps for that set.
    // A real app would have inputs for reps and weight for each set.
    const newRepsPerSet = [...ex.actual_reps_per_set];
    if (newRepsPerSet.length < newSetsCompleted) {
        // Add a placeholder for reps of the new set (e.g., target reps)
        newRepsPerSet.push(ex.target_reps_or_duration); // Or a default/user input
    }

    handleExerciseUpdate(exerciseIndex, {
        actual_sets_completed: newSetsCompleted,
        actual_reps_per_set: newRepsPerSet
    });
  };

    const decrementSet = (exerciseIndex: number) => {
        if (!dailyLog) return;
        const ex = dailyLog.logged_exercises[exerciseIndex];
        const newSetsCompleted = Math.max(0, ex.actual_sets_completed - 1);
        const newRepsPerSet = ex.actual_reps_per_set.slice(0, newSetsCompleted);

        handleExerciseUpdate(exerciseIndex, {
            actual_sets_completed: newSetsCompleted,
            actual_reps_per_set: newRepsPerSet
        });
    };


  // --- Handle Saving Progress ---
   const handleSaveProgress = async () => {
    if (!dailyLog) { setError("No workout data to save."); return; }
    setIsSaving(true); setError('');
    try {
      let finalCompletionPercentage = dailyLog.completion_percentage;
      // If exercises exist, recalculate completion one last time before saving
      // This ensures the value is based on the latest state if `handleExerciseUpdate` didn't run last
      if (dailyLog.logged_exercises.length > 0) {
          finalCompletionPercentage = calculateActiveWorkoutCompletion(); // Use state 'dailyLog' for calculation
      } else {
          finalCompletionPercentage = 100; // Rest day is 100%
      }

      const dataToSave = {
        logged_exercises: dailyLog.logged_exercises,
        completion_percentage: finalCompletionPercentage,
        session_notes: dailyLog.session_notes || "",
      };
      await updateDailyLogApi(dailyLog.id, dataToSave);
      alert("Progress saved successfully!");
      setDailyLog(prev => prev ? ({...prev, completion_percentage: finalCompletionPercentage}) : null);
    } catch (err: any) { /* ... error handling ... */ }
    finally { setIsSaving(false); }
  };


  // --- Styles (from your template, with additions) ---
  const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: { padding: '20px', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' ,marginRight : "500px"},
    mainTitle: { fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' },
    routineNameTitle: { fontSize: '18px', fontWeight: 'normal', marginBottom: '20px', color: '#555', textAlign: 'center' },
    sectionTitle: { fontSize: '20px', fontWeight: '600', marginTop: '30px', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' },
    workoutList: { listStyle: 'none', padding: 0, marginBottom: '30px' },
    workoutItem: {
      padding: '15px',
      border: '1px solid #e0e0e0',
      borderRadius: '5px',
      marginBottom: '10px',
      backgroundColor: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    exerciseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    exerciseName: { fontSize: '1.1em', fontWeight: 'bold', color: '#333' },
    targetInfo: { fontSize: '0.9em', color: '#666', marginBottom: '10px' },
    progressControls: { display: 'flex', alignItems: 'center', marginTop: '10px', gap: '10px' },
    setButton: {
      padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer',
      minWidth: '30px', textAlign: 'center', backgroundColor: '#f0f0f0'
    },
    actualSetsDisplay: { fontWeight: 'bold', fontSize: '1.1em', margin: '0 5px' },
    statusIcon: { fontSize: '1.2em', marginLeft: '10px'},
    // ... (your AI supervision styles) ...
    controlsContainer: { /* ... */ }, toggleContainer: { /* ... */ }, toggleLabel: { /* ... */ },
    toggleSwitch: { /* ... */ }, toggleSwitchActive: { /* ... */ }, toggleKnob: { /* ... */ },
    toggleKnobActive: { /* ... */ }, cameraViewContainer: { /* ... */ },
    cameraIconPlaceholder: { /* ... */ }, videoFeed: { /* ... */ },
    saveButton: {
        display: 'block', width: '100%', padding: '12px', fontSize: '18px', fontWeight: 'bold',
        backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '30px'
    },
    loadingErrorContainer: { textAlign: 'center', marginTop: '50px', fontSize: '18px' } as React.CSSProperties,
  };


  if (isLoading) {
    return <div style={styles.loadingErrorContainer}><p>Loading Today's Workout...</p></div>;
  }

  if (error) {
    return <div style={styles.loadingErrorContainer}><p style={{ color: 'red' }}>Error: {error}</p></div>;
  }

  if (!dailyLog) {
    return <div style={styles.loadingErrorContainer}><p>Could not load workout for today. Please check your plan and routine selection.</p></div>;
  }

  const isRestDayDisplay = dailyLog.logged_exercises.length === 0; 

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.mainTitle}>Today's Workout</h1>
      <h2 style={styles.routineNameTitle}>Routine: {dailyLog.routine_log_name || 'N/A'}</h2>
      <p style={{textAlign: 'center', fontSize: '1.2em', marginBottom: '20px'}}>
        Overall Progress: <strong>{dailyLog.completion_percentage}%</strong>
      </p>


      <h3 style={styles.sectionTitle}>Exercises for Today:</h3>
      <ul style={styles.workoutList}>
        {dailyLog.logged_exercises.map((item, index) => (
          <li key={item.original_exercise_id || `exercise-${index}`} style={styles.workoutItem}>
            <div style={styles.exerciseHeader}>
                <span style={styles.exerciseName}>{item.exercise_name}</span>
                <span style={styles.statusIcon}>
                    {item.completed_status === 'full' ? '✅' : item.completed_status === 'partial' ? '🔶' : '◻️'}
                </span>
            </div>
            <div style={styles.targetInfo}>
              Target: {item.target_sets} sets of {item.target_reps_or_duration}
              {item.notes_from_routine && <em style={{display: 'block', fontSize: '0.9em', color: '#777'}}>Routine Notes: {item.notes_from_routine}</em>}
            </div>
            <div style={styles.progressControls}>
              <span>Sets Completed:</span>
              <button style={styles.setButton} onClick={() => decrementSet(index)} disabled={isSaving}>-</button>
              <span style={styles.actualSetsDisplay}>{item.actual_sets_completed}</span>
              <button style={styles.setButton} onClick={() => incrementSet(index)} disabled={isSaving}>+</button>
            </div>
            {/* Here you could add inputs for reps/weight per set if actual_sets_completed > 0 */}
            {item.actual_reps_per_set.length > 0 && (
                <div style={{marginTop: '5px', fontSize: '0.9em'}}>
                    Reps per set: {item.actual_reps_per_set.join(', ')}
                </div>
            )}
             {/* TODO: Add input for user_notes_for_exercise */}
          </li>
        ))}
      </ul>

      <button onClick={handleSaveProgress} style={styles.saveButton} disabled={isSaving}>
        {isSaving ? 'Saving...' : "Save Today's Progress"}
      </button>

      {/* AI Supervision Section (from your template) */}
      <h3 style={styles.sectionTitle}>AI Supervision</h3>
      <div style={styles.controlsContainer}>
        <div style={styles.toggleContainer}>
          <span style={styles.toggleLabel}>Toggle AI supervision</span>
          {/* ... toggle switch JSX ... */}
        </div>
        <div style={styles.cameraViewContainer}>
          {/* ... camera view JSX ... */}
        </div>
      </div>
    </div>
  );
};

export default TodaysWorkout;