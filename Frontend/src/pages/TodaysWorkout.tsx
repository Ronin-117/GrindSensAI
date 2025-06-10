// src/pages/TodaysWorkout.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateDailyLogApi, updateDailyLogApi } from './api'; // Ensure correct path
import PoseDetector from './PoseDetector';

// Interfaces for the data structures
interface LoggedExercise {
  original_exercise_id: number;
  exercise_name: string;
  target_muscles: string[];
  target_sets: string;
  target_reps_or_duration: string;
  notes_from_routine?: string | null;
  completed_status: 'pending' | 'partial' | 'full' | 'skipped';
  actual_sets_completed: number;
  actual_reps_per_set: (number | string)[];
  actual_duration_seconds?: number | null;
  weight_used_per_set?: (number | string)[];
  user_notes_for_exercise?: string;
  isSupervisionUIToggled?: boolean; // Flag to show/hide supervision UI for this exercise
}

interface DailyLogData {
  id: number;
  date: string;
  routine_log_name: string;
  routine_used: number | null;
  logged_exercises: LoggedExercise[];
  completion_percentage: number;
  session_notes?: string | null;
  workout_plan: number;
}

const TodaysWorkout: React.FC = () => {
  console.log("TodaysWorkout MOUNTED");
  const [dailyLog, setDailyLog] = useState<DailyLogData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<number | null>(null);

  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  const fetchTodaysWorkoutLog = useCallback(async () => {
    console.log("[FetchLog] Called");
    setIsLoading(true); setError('');
    const todayStr = getTodayDateString();
    try {
      const response = await getOrCreateDailyLogApi(todayStr);
      let fetchedLog = response.data as DailyLogData;
      console.log("[FetchLog] Received log from API:", fetchedLog);
      if (fetchedLog.logged_exercises.length === 0 && fetchedLog.completion_percentage !== 100) {
        fetchedLog.completion_percentage = 100; // Treat as completed rest day if backend didn't
      }
      // Initialize UI state for supervision toggle for each exercise
      fetchedLog.logged_exercises = fetchedLog.logged_exercises.map(ex => ({
          ...ex,
          isSupervisionUIToggled: false, // Initialize the toggle state
      }));
      setDailyLog(fetchedLog);
    } catch (err: any) {
      console.error("[FetchLog] Error:", err.response?.data || err.message);
      if (err.response && err.response.status === 401) {
        setError('Session expired. Redirecting to login...');
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError(err.response?.data?.error || err.message || "Could not load today's workout.");
      }
      setDailyLog(null);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchTodaysWorkoutLog();
  }, [fetchTodaysWorkoutLog]);

  // Simpler unmount cleanup for TodaysWorkout
  useEffect(() => {
    return () => {
      console.log("TodaysWorkout UNMOUNTING");
      // No direct MediaPipe cleanup here, ExerciseSupervision handles its own
    };
  }, []);

  // Function to recalculate and set overall completion percentage
  const calculateAndUpdateOverallCompletion = useCallback((currentExercises: LoggedExercise[]): number => {
    if (!currentExercises || currentExercises.length === 0) {
        return 100; // Rest day or no exercises, consider 100%
    }
    
    let totalExercises = currentExercises.length;
    let sumOfIndividualExerciseProgress = 0;

    currentExercises.forEach(ex => {
        if (ex.completed_status === 'full') {
            sumOfIndividualExerciseProgress += 100;
        } else if (ex.completed_status === 'partial') {
            let targetSetsNum = 1;
            try { targetSetsNum = parseInt(ex.target_sets.split('-')[0], 10) || 1; }
            catch { /* ignore */ }
            if (targetSetsNum > 0) {
                 sumOfIndividualExerciseProgress += Math.min(100, (ex.actual_sets_completed / targetSetsNum) * 100);
            }
        }
    });
    const newPercentage = totalExercises > 0 ? Math.round(sumOfIndividualExerciseProgress / totalExercises) : (dailyLog?.completion_percentage || 0); // Fallback for safety
    
    // Update dailyLog state directly with the new percentage if it has changed
    setDailyLog(prevLog => {
        if (!prevLog || prevLog.completion_percentage === newPercentage) return prevLog; // No change needed
        return {...prevLog, completion_percentage: newPercentage };
    });
    return newPercentage;
  }, [dailyLog?.completion_percentage]); // Dependency on dailyLog's completion_percentage to avoid stale closures

  const handleExerciseUpdate = (exerciseIndex: number, updatedExerciseData: Partial<LoggedExercise>) => {
    if (!dailyLog) return;

    // Create a new array with the updated exercise
    const updatedExercises = dailyLog.logged_exercises.map((ex, idx) =>
        idx === exerciseIndex ? { ...ex, ...updatedExerciseData } : ex
    );
    const exerciseToUpdate = updatedExercises[exerciseIndex]; // Get the fully merged exercise

    // Update completed_status for the modified exercise
    let targetSetsNum = 1;
    try { targetSetsNum = parseInt(exerciseToUpdate.target_sets.split('-')[0], 10) || 1; }
    catch { targetSetsNum = 1; }

    if (exerciseToUpdate.actual_sets_completed >= targetSetsNum) {
        exerciseToUpdate.completed_status = 'full';
    } else if (exerciseToUpdate.actual_sets_completed > 0) {
        exerciseToUpdate.completed_status = 'partial';
    } else {
        exerciseToUpdate.completed_status = 'pending';
    }
    
    // Update the dailyLog state with the modified exercises array
    // and then trigger overall completion calculation
    setDailyLog(prevLog => {
        if (!prevLog) return null;
        const newLogState = { ...prevLog, logged_exercises: updatedExercises };
        // Recalculate overall completion based on the new exercises array
        const newOverallCompletion = calculateAndUpdateOverallCompletion(newLogState.logged_exercises);
        return { ...newLogState, completion_percentage: newOverallCompletion };
    });
  };

  const incrementSet = (exerciseIndex: number) => {
    if (!dailyLog) return; const ex = dailyLog.logged_exercises[exerciseIndex];
    const maxSets = parseInt(ex.target_sets.split('-').pop() || ex.target_sets, 10) || 1;
    const newSetsCompleted = Math.min(ex.actual_sets_completed + 1, maxSets);
    const newRepsPerSet = [...ex.actual_reps_per_set];
    if (newRepsPerSet.length < newSetsCompleted && newSetsCompleted <= maxSets) {
        newRepsPerSet.push(ex.target_reps_or_duration); // Add placeholder for reps
    }
    handleExerciseUpdate(exerciseIndex, { actual_sets_completed: newSetsCompleted, actual_reps_per_set: newRepsPerSet });
  };

  const decrementSet = (exerciseIndex: number) => {
    if (!dailyLog) return; const ex = dailyLog.logged_exercises[exerciseIndex];
    const newSetsCompleted = Math.max(0, ex.actual_sets_completed - 1);
    const newRepsPerSet = ex.actual_reps_per_set.slice(0, newSetsCompleted);
    handleExerciseUpdate(exerciseIndex, { actual_sets_completed: newSetsCompleted, actual_reps_per_set: newRepsPerSet });
  };

  const handleSaveProgress = async () => {
    if (!dailyLog) { setError("No workout data to save."); return; }
    setIsSaving(true); setError('');
    try {
      // Ensure completion percentage is up-to-date based on current exercise states
      const finalCompletionPercentage = calculateAndUpdateOverallCompletion(dailyLog.logged_exercises);

      const dataToSave = {
        logged_exercises: dailyLog.logged_exercises.map(({ isSupervisionUIToggled, ...rest }) => rest), // Strip UI state
        completion_percentage: finalCompletionPercentage,
        session_notes: dailyLog.session_notes || "",
      };
      const response = await updateDailyLogApi(dailyLog.id, dataToSave);
      // Update dailyLog with the response from the server to ensure consistency,
      // re-adding the UI toggle state.
      let savedLogFromServer = response.data as DailyLogData;
      savedLogFromServer.logged_exercises = savedLogFromServer.logged_exercises.map(ex => ({
          ...ex,
          isSupervisionUIToggled: dailyLog.logged_exercises.find(lex => lex.original_exercise_id === ex.original_exercise_id)?.isSupervisionUIToggled || false,
      }));
      setDailyLog(savedLogFromServer);
      alert("Progress saved successfully!");
    } catch (err: any) {
      console.error("Save error:", err.response?.data || err.message);
      setError(err.response?.data?.detail || "Failed to save progress.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiRepCounted = (exerciseIndex: number, repCount: number) => {
    // This updates the UI display in real-time
    handleExerciseUpdate(exerciseIndex, { current_reps_in_ai_set: repCount }, false);
  };

  const handleAiSetCompleted = (exerciseIndex: number) => {
    if (!dailyLog) return;
    console.log(`[Parent] AI Set Completed for index ${exerciseIndex}`);
    const ex = dailyLog.logged_exercises[exerciseIndex];
    const maxSets = parseInt(ex.target_sets.split('-').pop() || ex.target_sets, 10) || 1;
    const newSetsCompleted = Math.min(ex.actual_sets_completed + 1, maxSets);
    const newRepsPerSet = [...ex.actual_reps_per_set];
    const repsForThisSet = ex.current_reps_in_ai_set || 0;
    while (newRepsPerSet.length < newSetsCompleted) newRepsPerSet.push("-");
    newRepsPerSet[newSetsCompleted - 1] = repsForThisSet;
    handleExerciseUpdate(exerciseIndex, {
      actual_sets_completed: newSetsCompleted,
      actual_reps_per_set: newRepsPerSet,
      current_reps_in_ai_set: 0,
    });
  };

  const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: { padding: '20px', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' ,marginRight : "auto"},
    mainTitle: { fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' },
    routineNameTitle: { fontSize: '18px', fontWeight: 'normal', marginBottom: '20px', color: '#555', textAlign: 'center' },
    sectionTitle: { fontSize: '20px', fontWeight: '600', marginTop: '30px', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' },
    workoutList: { listStyle: 'none', padding: 0, marginBottom: '30px' },
    workoutItem: { padding: '15px', border: '1px solid #e0e0e0', borderRadius: '5px', marginBottom: '10px', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'},
    exerciseClickableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' },
    exerciseName: { fontSize: '1.1em', fontWeight: 'bold', color: '#333' },
    targetInfo: { fontSize: '0.9em', color: '#666', marginBottom: '10px' },
    progressControls: { display: 'flex', alignItems: 'center', marginTop: '10px', gap: '10px', marginBottom: '10px' },
    setButton: { padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', minWidth: '30px', textAlign: 'center', backgroundColor: '#f0f0f0'},
    actualSetsDisplay: { fontWeight: 'bold', fontSize: '1.1em', margin: '0 5px' },
    statusIcon: { fontSize: '1.2em', marginLeft: '10px'},
    supervisionSection: { marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #ccc' },
    toggleContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
    toggleLabel: { marginRight: '10px', color: '#333' },
    toggleSwitchBase: { width: '80px', height: '30px', borderRadius: '15px', padding: '2px 5px', cursor: 'pointer', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9em', fontWeight: 'bold', transition: 'background-color 0.2s ease, color 0.2s ease', outline: 'none' },
    toggleSwitchActive: { backgroundColor: '#4CAF50', color: 'white', borderColor: '#388E3C' },
    toggleSwitchInactive: { backgroundColor: '#ccc', color: '#333', borderColor: '#bbb' },
    loadingErrorContainer: { textAlign: 'center', marginTop: '50px', fontSize: '18px' } as React.CSSProperties,
    saveButton: { display: 'block', width: '100%', padding: '12px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '30px' },
  };

  const toggleExpandExercise = (index: number) => {
    console.log("[ToggleExpand] Index:", index, "Current expanded:", expandedExerciseIndex);
    const previouslyExpandedIndex = expandedExerciseIndex;

    if (previouslyExpandedIndex === index) {
      if (dailyLog?.logged_exercises[index]?.isSupervisionUIToggled) {
        console.log("[ToggleExpand] Collapsing AND supervision UI was ON. Turning UI toggle OFF for index:", index);
        handleSupervisionUIToggle(index); // Turn off UI toggle before collapsing
      }
      setExpandedExerciseIndex(null);
    } else {
      if (previouslyExpandedIndex !== null && dailyLog?.logged_exercises[previouslyExpandedIndex]?.isSupervisionUIToggled) {
        console.log("[ToggleExpand] Different exercise's supervision UI was ON. Turning UI toggle OFF for old index:", previouslyExpandedIndex);
        handleSupervisionUIToggle(previouslyExpandedIndex);
      }
      setExpandedExerciseIndex(index);
    }
  };

  // Handler for the Supervision UI Toggle button
  const handleSupervisionUIToggle = (exerciseIndex: number) => {
    if (!dailyLog) return;
    console.log(`[UIToggle] Clicked for index ${exerciseIndex}. Current toggle state: ${dailyLog.logged_exercises[exerciseIndex]?.isSupervisionUIToggled}`);
    setDailyLog(prev => {
        if (!prev) return null;
        const newExercises = prev.logged_exercises.map((ex, idx) =>
            idx === exerciseIndex ? { ...ex, isSupervisionUIToggled: !ex.isSupervisionUIToggled } : ex
        );
        return { ...prev, logged_exercises: newExercises };
    });
  };


  if (isLoading) return <div style={styles.loadingErrorContainer}><p>Loading Today's Workout...</p></div>;
  if (error && !dailyLog) return <div style={styles.loadingErrorContainer}><p style={{ color: 'red' }}>Error: {error}</p></div>;
  if (!dailyLog) return <div style={styles.loadingErrorContainer}><p>Could not load workout data. Please check your plan or login.</p></div>;

  const isRestDayDisplay = dailyLog.logged_exercises.length === 0 && dailyLog.completion_percentage === 100;

  return (
     <div style={styles.pageContainer}>
      <h1 style={styles.mainTitle}>Today's Workout</h1>
      {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
      <h2 style={styles.routineNameTitle}>Routine: {dailyLog.routine_log_name || 'N/A'}</h2>
      <p style={{textAlign: 'center', fontSize: '1.2em', marginBottom: '20px'}}>
        Overall Progress: <strong>{dailyLog.completion_percentage}%</strong>
      </p>
      <h3 style={styles.sectionTitle}>
        {isRestDayDisplay ? "Today is a Scheduled Rest Day!" : "Exercises for Today:"}
      </h3>
      {isRestDayDisplay ? (
         <div style={{textAlign: 'center', padding: '20px', backgroundColor: '#e6ffed', border: '1px solid #c3e6cb', borderRadius: '5px'}}>
            <p style={{fontSize: '1.1em', color: '#155724'}}>Enjoy your rest! You've earned it. ✅</p>
        </div>
      ) : (
        <ul style={styles.workoutList}>
          {dailyLog.logged_exercises.map((item, index) => (
            <li key={item.original_exercise_id || `exercise-${index}-${Math.random()}`} style={styles.workoutItem}>
              <div style={styles.exerciseClickableHeader} onClick={() => toggleExpandExercise(index)}>
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
                <button style={styles.setButton} onClick={() => decrementSet(index)} disabled={isSaving || item.isSupervisionUIToggled}>-</button>
                <span style={styles.actualSetsDisplay}>{item.actual_sets_completed}</span>
                <button style={styles.setButton} onClick={() => incrementSet(index)} disabled={isSaving || item.isSupervisionUIToggled}>+</button>
              </div>

              {expandedExerciseIndex === index && (
                <div style={styles.supervisionSection}>
                  <div style={styles.toggleContainer}>
                    <span style={styles.toggleLabel}>AI Supervision:</span>
                    <button
                      onClick={() => handleSupervisionUIToggle(index)}
                      style={{
                        ...styles.toggleSwitchBase,
                        ...(item?.isSupervisionUIToggled ? styles.toggleSwitchActive : styles.toggleSwitchInactive),
                      }}
                      aria-pressed={!!item?.isSupervisionUIToggled}
                      type="button"
                    >
                      {item?.isSupervisionUIToggled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {item?.isSupervisionUIToggled && dailyLog && (
                    <PoseDetector
                      key={`supervision-${item.original_exercise_id}`}
                      exercise={{
                        exercise_name: item.exercise_name,
                        target_reps_or_duration: item.target_reps_or_duration,
                      }}
                      isActive={item.isSupervisionUIToggled} // The crucial prop
                      onRepCounted={(count) => handleAiRepCounted(index, count)}
                      onSetCompleted={() => handleAiSetCompleted(index)}
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <button onClick={handleSaveProgress} style={styles.saveButton} disabled={isSaving || isRestDayDisplay}>
        {isSaving ? 'Saving...' : (isRestDayDisplay ? "Rest Day Logged" : "Save Today's Progress")}
      </button>
    </div>
  );
};
export default TodaysWorkout;