// src/pages/TodaysWorkout.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateDailyLogApi, updateDailyLogApi } from './api'; // Ensure correct path
import PoseDetector from './PoseDetector'; // Ensure this path is correct

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
  // UI-only state properties
  isSupervisionUIToggled?: boolean;
  current_reps_in_ai_set?: number;
  landmarkerLoadFailed?: boolean; // For disabling button if model fails
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
        fetchedLog.completion_percentage = 100;
      }
      fetchedLog.logged_exercises = fetchedLog.logged_exercises.map(ex => ({
          ...ex,
          isSupervisionUIToggled: false,
          landmarkerLoadFailed: false,
          current_reps_in_ai_set: 0,
      }));
      setDailyLog(fetchedLog);
    } catch (err: any) {
      console.error("[FetchLog] Error:", err.response?.data || err.message);
      if (err.response && err.response.status === 401) {
        setError('Session expired. Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
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

  useEffect(() => {
    return () => { console.log("TodaysWorkout UNMOUNTING"); };
  }, []);

  const calculateOverallCompletion = useCallback((currentExercises: LoggedExercise[]): number => {
    if (!currentExercises || currentExercises.length === 0) {
      return (dailyLog?.completion_percentage === 100 && dailyLog?.logged_exercises.length === 0) ? 100 : 0;
    }
    let totalExercises = currentExercises.length;
    let sumOfIndividualExerciseProgress = 0;
    currentExercises.forEach(ex => {
      if (ex.completed_status === 'full') sumOfIndividualExerciseProgress += 100;
      else if (ex.completed_status === 'partial') {
        let targetSetsNum = 1; try { targetSetsNum = parseInt(ex.target_sets.split('-')[0], 10) || 1; } catch { /* ignore */ }
        if (targetSetsNum > 0) sumOfIndividualExerciseProgress += Math.min(100, (ex.actual_sets_completed / targetSetsNum) * 100);
      }
    });
    return totalExercises > 0 ? Math.round(sumOfIndividualExerciseProgress / totalExercises) : 100;
  }, [dailyLog?.completion_percentage, dailyLog?.logged_exercises.length]);


  const handleExerciseUpdate = (exerciseIndex: number, updatedData: Partial<LoggedExercise>) => {
    setDailyLog(prevLog => {
      if (!prevLog) return null;

      const updatedExercises = prevLog.logged_exercises.map((ex, idx) =>
        idx === exerciseIndex ? { ...ex, ...updatedData } : ex
      );

      const exerciseToUpdate = updatedExercises[exerciseIndex];
      if (exerciseToUpdate) {
        const targetSetsParts = exerciseToUpdate.target_sets.split('-').map(s => parseInt(s.trim(), 10));
        const maxTargetSets = targetSetsParts.length > 0 ? Math.max(...targetSetsParts.filter(n => !isNaN(n))) : 1;
        
        if (maxTargetSets > 0 && exerciseToUpdate.actual_sets_completed >= maxTargetSets) {
            exerciseToUpdate.completed_status = 'full';
        } else if (exerciseToUpdate.actual_sets_completed > 0) {
            exerciseToUpdate.completed_status = 'partial';
        } else {
            exerciseToUpdate.completed_status = 'pending';
        }
      }
      
      const newOverallCompletion = calculateOverallCompletion(updatedExercises);
      return { ...prevLog, logged_exercises: updatedExercises, completion_percentage: newOverallCompletion };
    });
  };

  const incrementSet = (exerciseIndex: number) => {
    if (!dailyLog) return; const ex = dailyLog.logged_exercises[exerciseIndex];
    const maxSets = parseInt(ex.target_sets.split('-').pop() || ex.target_sets, 10) || 1;
    const newSetsCompleted = Math.min(ex.actual_sets_completed + 1, maxSets);
    const newRepsPerSet = [...ex.actual_reps_per_set];
    if (newRepsPerSet.length < newSetsCompleted && newSetsCompleted <= maxSets) {
        newRepsPerSet.push(ex.target_reps_or_duration);
    }
    handleExerciseUpdate(exerciseIndex, { 
        actual_sets_completed: newSetsCompleted, 
        actual_reps_per_set: newRepsPerSet,
        current_reps_in_ai_set: 0 // Reset AI reps if manually changing sets
    });
  };

  const decrementSet = (exerciseIndex: number) => {
    if (!dailyLog) return; const ex = dailyLog.logged_exercises[exerciseIndex];
    const newSetsCompleted = Math.max(0, ex.actual_sets_completed - 1);
    const newRepsPerSet = ex.actual_reps_per_set.slice(0, newSetsCompleted);
    handleExerciseUpdate(exerciseIndex, { 
        actual_sets_completed: newSetsCompleted, 
        actual_reps_per_set: newRepsPerSet,
        current_reps_in_ai_set: 0
    });
  };

  const handleSaveProgress = async () => {
    if (!dailyLog) { setError("No workout data to save."); return; }
    setIsSaving(true); setError('');
    try {
      const finalCompletionPercentage = calculateOverallCompletion(dailyLog.logged_exercises);
      const dataToSave = {
        logged_exercises: dailyLog.logged_exercises.map(({ isSupervisionUIToggled, landmarkerLoadFailed, current_reps_in_ai_set, ...rest }) => rest),
        completion_percentage: finalCompletionPercentage,
        session_notes: dailyLog.session_notes || "",
      };
      const response = await updateDailyLogApi(dailyLog.id, dataToSave);
      let savedLogFromServer = response.data as DailyLogData;
      savedLogFromServer.logged_exercises = savedLogFromServer.logged_exercises.map(ex => ({
          ...ex,
          isSupervisionUIToggled: dailyLog.logged_exercises.find(lex => lex.original_exercise_id === ex.original_exercise_id)?.isSupervisionUIToggled || false,
          landmarkerLoadFailed: dailyLog.logged_exercises.find(lex => lex.original_exercise_id === ex.original_exercise_id)?.landmarkerLoadFailed || false,
          current_reps_in_ai_set: 0,
      }));
      setDailyLog(savedLogFromServer);
      alert("Progress saved successfully!");
    } catch (err: any) { console.error("Save error:", err.response?.data || err.message); setError(err.response?.data?.detail || "Failed to save progress."); }
    finally { setIsSaving(false); }
  };

  const handleAiRepCounted = (exerciseIndex: number, repCount: number) => {
    // This updates the UI display in real-time using a functional update
    setDailyLog(prevLog => {
        if (!prevLog) return null;
        const updatedExercises = prevLog.logged_exercises.map((ex, idx) => 
            idx === exerciseIndex ? { ...ex, current_reps_in_ai_set: repCount } : ex
        );
        return { ...prevLog, logged_exercises: updatedExercises };
    });
  };

  const handleAiSetCompleted = (exerciseIndex: number) => {
    console.log(`[Parent] AI Set Completed for index ${exerciseIndex}`);
    // Use a functional update to ensure we have the latest state
    setDailyLog(prevLog => {
        if (!prevLog) return null;
        const ex = prevLog.logged_exercises[exerciseIndex];
        if (!ex) return prevLog;

        const targetSetsParts = ex.target_sets.split('-').map(s => parseInt(s.trim(), 10));
        const maxTargetSets = targetSetsParts.length > 0 ? Math.max(...targetSetsParts.filter(n => !isNaN(n))) : 1;
        const newSetsCompleted = Math.min(ex.actual_sets_completed + 1, maxTargetSets);
        
        const newRepsPerSet = [...ex.actual_reps_per_set];
        const repsForThisSetByAI = ex.current_reps_in_ai_set || 0;
        
        while (newRepsPerSet.length < newSetsCompleted) { newRepsPerSet.push("-"); }
        newRepsPerSet[newSetsCompleted - 1] = repsForThisSetByAI;

        const updatedExercise = {
            ...ex,
            actual_sets_completed: newSetsCompleted,
            actual_reps_per_set: newRepsPerSet,
            current_reps_in_ai_set: 0, // Reset for the next set
        };
        
        // Determine status based on the new data
        if (maxTargetSets > 0 && updatedExercise.actual_sets_completed >= maxTargetSets) {
            updatedExercise.completed_status = 'full';
        } else if (updatedExercise.actual_sets_completed > 0) {
            updatedExercise.completed_status = 'partial';
        } else {
            updatedExercise.completed_status = 'pending';
        }
        
        const finalExercises = prevLog.logged_exercises.map((e, idx) => idx === exerciseIndex ? updatedExercise : e);
        const newOverallCompletion = calculateOverallCompletion(finalExercises);
        return { ...prevLog, logged_exercises: finalExercises, completion_percentage: newOverallCompletion };
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
    aiRepDisplay: {display: 'block', color: 'purple', fontStyle: 'italic', fontSize: '0.9em', marginTop: '5px'},
    progressControls: { display: 'flex', alignItems: 'center', marginTop: '10px', gap: '10px', marginBottom: '10px' },
    setButton: { padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', minWidth: '30px', textAlign: 'center', backgroundColor: '#f0f0f0'},
    actualSetsDisplay: { fontWeight: 'bold', fontSize: '1.1em', margin: '0 5px' },
    statusIcon: { fontSize: '1.2em', marginLeft: '10px'},
    supervisionSection: { marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #ccc' },
    toggleContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
    toggleLabel: { marginRight: '10px', color: '#333' },
    toggleSwitchBase: { minWidth: '80px', height: '30px', borderRadius: '15px', padding: '2px 5px', cursor: 'pointer', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9em', fontWeight: 'bold', transition: 'background-color 0.2s ease, color 0.2s ease', outline: 'none' },
    toggleSwitchActive: { backgroundColor: '#4CAF50', color: 'white', borderColor: '#388E3C' },
    toggleSwitchInactive: { backgroundColor: '#ccc', color: '#333', borderColor: '#bbb' },
    toggleSwitchError: {backgroundColor: '#dc3545', color: 'white', cursor: 'not-allowed'},
    loadingErrorContainer: { textAlign: 'center', marginTop: '50px', fontSize: '18px' } as React.CSSProperties,
    saveButton: { display: 'block', width: '100%', padding: '12px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '30px' },
  };

  const toggleExpandExercise = (index: number) => {
    const previouslyExpandedIndex = expandedExerciseIndex;
    if (previouslyExpandedIndex === index) {
      if (dailyLog?.logged_exercises[index]?.isSupervisionUIToggled) {
        handleSupervisionUIToggle(index);
      }
      setExpandedExerciseIndex(null);
    } else {
      if (previouslyExpandedIndex !== null && dailyLog?.logged_exercises[previouslyExpandedIndex]?.isSupervisionUIToggled) {
        handleSupervisionUIToggle(previouslyExpandedIndex);
      }
      setExpandedExerciseIndex(index);
    }
  };

  const handleSupervisionUIToggle = (exerciseIndex: number) => {
    if (!dailyLog) return;
    setDailyLog(prev => {
        if (!prev) return null;
        const newExercises = prev.logged_exercises.map((ex, idx) =>
            idx === exerciseIndex ? { 
                ...ex, 
                isSupervisionUIToggled: !ex.isSupervisionUIToggled, 
                landmarkerLoadFailed: !ex.isSupervisionUIToggled ? false : ex.landmarkerLoadFailed,
                current_reps_in_ai_set: 0,
            } : ex
        );
        return { ...prev, logged_exercises: newExercises };
    });
  };

  if (isLoading) return <div style={styles.loadingErrorContainer}><p>Loading Today's Workout...</p></div>;
  if (error && !dailyLog) return <div style={styles.loadingErrorContainer}><p style={{ color: 'red' }}>Error: {error}</p></div>;
  if (!dailyLog) return <div style={styles.loadingErrorContainer}><p>Could not load workout data.</p></div>;

  const isRestDayDisplay = dailyLog.logged_exercises.length === 0;

  return (
     <div style={styles.pageContainer}>
      <h1 style={styles.mainTitle}>Today's Workout</h1>
      {error && !isSaving && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
      <h2 style={styles.routineNameTitle}>Routine: {dailyLog.routine_log_name || 'N/A'}</h2>
      <p style={{textAlign: 'center', fontSize: '1.2em', marginBottom: '20px'}}>
        Overall Progress: <strong>{dailyLog.completion_percentage}%</strong>
      </p>
      <h3 style={styles.sectionTitle}>{isRestDayDisplay ? "Today is a Scheduled Rest Day!" : "Exercises for Today:"}</h3>

      {isRestDayDisplay ? (
         <div style={{textAlign: 'center', padding: '20px', backgroundColor: '#e6ffed', border: '1px solid #c3e6cb', borderRadius: '5px'}}>
            <p style={{fontSize: '1.1em', color: '#155724'}}>Enjoy your rest! You've earned it. ✅</p>
        </div>
      ) : (
        <ul style={styles.workoutList}>
          {dailyLog.logged_exercises.map((item, index) => (
            <li key={item.original_exercise_id || `exercise-${index}`} style={styles.workoutItem}>
              <div style={styles.exerciseClickableHeader} onClick={() => toggleExpandExercise(index)}>
                <span style={styles.exerciseName}>{item.exercise_name}</span>
                <span style={styles.statusIcon}>
                  {item.completed_status === 'full' ? '✅' : item.completed_status === 'partial' ? '🔶' : '◻️'}
                </span>
              </div>
              <div style={styles.targetInfo}>
                Target: {item.target_sets} sets of {item.target_reps_or_duration}
                {item.isSupervisionUIToggled && (
                    <span style={styles.aiRepDisplay}>
                        AI Reps (current set): {item.current_reps_in_ai_set || 0}
                    </span>
                )}
                {item.notes_from_routine && <em style={{display: 'block', fontSize: '0.9em', color: '#777'}}>Routine Notes: {item.notes_from_routine}</em>}
              </div>
              <div style={styles.progressControls}>
                <span>Sets Completed:</span>
                <button style={styles.setButton} onClick={() => decrementSet(index)} disabled={isSaving || item.isSupervisionUIToggled}>-</button>
                <span style={styles.actualSetsDisplay}>{item.actual_sets_completed}</span>
                <button style={styles.setButton} onClick={() => incrementSet(index)} disabled={isSaving || item.isSupervisionUIToggled}>+</button>
              </div>
              {item.actual_reps_per_set.length > 0 && (
                  <div style={{marginTop: '5px', fontSize: '0.9em'}}>
                      Reps per set: {item.actual_reps_per_set.join(' | ')}
                  </div>
              )}

              {expandedExerciseIndex === index && (
                <div style={styles.supervisionSection}>
                  <div style={styles.toggleContainer}>
                    <span style={styles.toggleLabel}>AI Supervision:</span>
                    <button
                      onClick={() => handleSupervisionUIToggle(index)}
                      style={{ ...styles.toggleSwitchBase, ...(item.isSupervisionUIToggled ? styles.toggleSwitchActive : styles.toggleSwitchInactive) }}
                      aria-pressed={!!item.isSupervisionUIToggled}
                      type="button"
                    >
                      {item.isSupervisionUIToggled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {item.isSupervisionUIToggled && (
                    <PoseDetector
                      key={`supervision-${item.original_exercise_id}`}
                      exercise={{
                        exercise_name: item.exercise_name,
                        target_reps_or_duration: item.target_reps_or_duration,
                      }}
                      isActive={item.isSupervisionUIToggled}
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