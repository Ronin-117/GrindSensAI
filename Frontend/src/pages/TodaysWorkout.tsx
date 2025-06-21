import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateDailyLogApi, updateDailyLogApi } from './api';
import PoseDetector from './PoseDetector';
import './TodaysWorkout.css';

// Interfaces remain the same
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
  isSupervisionUIToggled?: boolean;
  current_reps_in_ai_set?: number;
}

interface DailyLogData {
  id: number;
  date: string;
  routine_log_name: string;
  logged_exercises: LoggedExercise[];
  completion_percentage: number;
}

const TodaysWorkout: React.FC = () => {
  const [dailyLog, setDailyLog] = useState<DailyLogData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  const getTodayDateString = () => new Date().toISOString().split('T')[0];
  const fetchTodaysWorkoutLog = useCallback(async () => {
    setIsLoading(true); setError('');
    const todayStr = getTodayDateString();
    try {
      const response = await getOrCreateDailyLogApi(todayStr);
      let fetchedLog = response.data as DailyLogData;
      fetchedLog.logged_exercises = fetchedLog.logged_exercises.map(ex => ({
          ...ex, isSupervisionUIToggled: false, current_reps_in_ai_set: 0,
      }));
      setDailyLog(fetchedLog);
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not load today's workout.");
    } finally { setIsLoading(false); }
  }, []);
  useEffect(() => { fetchTodaysWorkoutLog(); }, [fetchTodaysWorkoutLog]);
  const calculateOverallCompletion = useCallback(
    (currentExercises: LoggedExercise[]): number => {
    if (!currentExercises || currentExercises.length === 0) {
      return (dailyLog?.completion_percentage === 100 && dailyLog?.logged_exercises.length === 0) ? 100 : 0;
    }
    let totalExercises = currentExercises.length;
    let sumOfIndividualExerciseProgress = 0;
    currentExercises.forEach(ex => {
      if (ex.completed_status === 'full') sumOfIndividualExerciseProgress += 100;
      else if (ex.completed_status === 'partial') {
        let targetSetsNum = 1; try { targetSetsNum = parseInt(ex.target_sets.split('-')[0], 10) || 1; } catch { }
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
        current_reps_in_ai_set: 0
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
        logged_exercises: dailyLog.logged_exercises.map(({ isSupervisionUIToggled, current_reps_in_ai_set, ...rest }) => rest),
        completion_percentage: finalCompletionPercentage,
      };
      await updateDailyLogApi(dailyLog.id, dataToSave);
    } catch (err: any) { setError("Failed to save progress."); }
    finally { setIsSaving(false); }
  };
  const handleAiRepCounted = (exerciseIndex: number, repCount: number) => { 
    setDailyLog(prevLog => {
        if (!prevLog) return null;
        const updatedExercises = prevLog.logged_exercises.map((ex, idx) => 
            idx === exerciseIndex ? { ...ex, current_reps_in_ai_set: repCount } : ex
        );
        return { ...prevLog, logged_exercises: updatedExercises };
    });
  };
  const handleAiSetCompleted = (exerciseIndex: number) => { 
    setDailyLog(prevLog => {
        if (!prevLog) return null;
        const ex = prevLog.logged_exercises[exerciseIndex];
        if (!ex) return prevLog;
        const maxTargetSets = parseInt(ex.target_sets.split('-').pop() || ex.target_sets, 10) || 1;
        const newSetsCompleted = Math.min(ex.actual_sets_completed + 1, maxTargetSets);
        const newRepsPerSet = [...ex.actual_reps_per_set];
        const repsForThisSetByAI = ex.current_reps_in_ai_set || 0;
        while (newRepsPerSet.length < newSetsCompleted) { newRepsPerSet.push("-"); }
        newRepsPerSet[newSetsCompleted - 1] = repsForThisSetByAI;
        const updatedExercise = {
            ...ex,
            actual_sets_completed: newSetsCompleted,
            actual_reps_per_set: newRepsPerSet,
            current_reps_in_ai_set: 0,
        };
        if (updatedExercise.actual_sets_completed >= maxTargetSets) {
            updatedExercise.completed_status = 'full';
        } else if (updatedExercise.actual_sets_completed > 0) {
            updatedExercise.completed_status = 'partial';
        }
        const finalExercises = prevLog.logged_exercises.map((e, idx) => idx === exerciseIndex ? updatedExercise : e);
        const newOverallCompletion = calculateOverallCompletion(finalExercises);
        return { ...prevLog, logged_exercises: finalExercises, completion_percentage: newOverallCompletion };
    });
  };

  const toggleExpandExercise = (index: number) => {
    setExpandedExerciseIndex(prevIndex => (prevIndex === index ? null : index));
  };

  const handleSupervisionUIToggle = (e: React.ChangeEvent<HTMLInputElement>, exerciseIndex: number) => {
    const isChecked = e.target.checked;
    setDailyLog(prev => {
        if (!prev) return null;
        const newExercises = prev.logged_exercises.map((ex, idx) =>
            idx === exerciseIndex ? { ...ex, isSupervisionUIToggled: isChecked, current_reps_in_ai_set: 0 } : ex
        );
        return { ...prev, logged_exercises: newExercises };
    });
  };
  
  if (isLoading) return <div className="status-container"><p>Loading Today's Workout...</p></div>;
  if (error && !dailyLog) return <div className="status-container"><p className="error-message">{error}</p></div>;
  if (!dailyLog) return <div className="status-container"><p>Could not load workout data.</p></div>;

  const isRestDay = dailyLog.logged_exercises.length === 0;

  return (
    <div className="today-page-container">
      <div className="workout-content-card">
        <header className="workout-header">
          <h1>Today's Workout</h1>
          <p className="routine-name">Routine: {dailyLog.routine_log_name || 'N/A'}</p>
        </header>

        <div className="progress-bar-container">
          <p className="progress-bar-label">Overall Progress</p>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${dailyLog.completion_percentage}%` }}>
              {dailyLog.completion_percentage > 10 && `${dailyLog.completion_percentage}%`}
            </div>
          </div>
        </div>

        <h2 className="section-title">{isRestDay ? "Today is a Scheduled Rest Day!" : "Exercises for Today:"}</h2>
        {error && !isSaving && <p className="error-message">{error}</p>}

        {isRestDay ? (
          <div className="rest-day-display"><p>Enjoy your rest! You've earned it. ✅</p></div>
        ) : (
          <div className="exercise-list-container">
            {dailyLog.logged_exercises.map((item, index) => (
              <div key={item.original_exercise_id} className={`exercise-accordion ${expandedExerciseIndex === index ? 'expanded' : ''}`}>
                <div className="accordion-header" onClick={() => toggleExpandExercise(index)}>
                  <h3>{item.exercise_name}</h3>
                  <span className="status-icon">
                    {item.completed_status === 'full' ? '☑️' : item.completed_status === 'partial' ? '🔷' : '◻️'}
                  </span>
                </div>
                <div className="accordion-summary" onClick={() => toggleExpandExercise(index)}>
                  <p>Target: {item.target_sets} sets of {item.target_reps_or_duration}</p>
                  {item.isSupervisionUIToggled && (
                    <span className="ai-rep-display">AI Reps (current set): {item.current_reps_in_ai_set || 0}</span>
                  )}
                </div>
                <div className={`accordion-content ${expandedExerciseIndex === index ? 'expanded' : ''}`}>
                  {item.notes_from_routine && <p><em>Notes: {item.notes_from_routine}</em></p>}
                  <div className="progress-controls">
                    <span>Sets Completed:</span>
                    <button onClick={() => decrementSet(index)} disabled={isSaving || item.isSupervisionUIToggled}>-</button>
                    <span className="sets-display">{item.actual_sets_completed}</span>
                    <button onClick={() => incrementSet(index)} disabled={isSaving || item.isSupervisionUIToggled}>+</button>
                  </div>
                  {item.actual_reps_per_set.length > 0 && <p>Reps per set: {item.actual_reps_per_set.join(' | ')}</p>}
                  <div className="supervision-toggle-container">
                    <span>AI Supervision</span>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={!!item.isSupervisionUIToggled} onChange={(e) => handleSupervisionUIToggle(e, index)} />
                      <span className="slider"></span>
                    </label>
                  </div>
                  {item.isSupervisionUIToggled && (
                    <PoseDetector
                      exercise={{ exercise_name: item.exercise_name, target_reps_or_duration: item.target_reps_or_duration }}
                      isActive={item.isSupervisionUIToggled}
                      onRepCounted={(count) => handleAiRepCounted(index, count)}
                      onSetCompleted={() => handleAiSetCompleted(index)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleSaveProgress} className="save-progress-btn" disabled={isSaving || isRestDay}>
          {isSaving ? 'Saving...' : (isRestDay ? "Rest Day Logged" : "Save Today's Progress")}
        </button>
      </div>
    </div>
  );
};
export default TodaysWorkout;