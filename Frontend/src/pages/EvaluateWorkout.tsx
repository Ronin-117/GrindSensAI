import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteTrainingRoutineApi, getTrainingRoutinesApi, getUserWorkoutPlanApi, updateUserWorkoutPlanApi } from './api';
import './EvaluateWorkout.css';

interface TrainingRoutineData {
  id: number;
  routine_id: string;
  routine_name: string;
  is_preset: boolean;
  user?: number | null;
  description?: string;
  experience_level?: string;
}

interface WorkoutPlanData {
  id: number;
  current_routine: number | null;
}

const EvaluateWorkout: React.FC = () => {
  const [routines, setRoutines] = useState<TrainingRoutineData[]>([]);
  const [currentSelectedRoutineId, setCurrentSelectedRoutineId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectingRoutineId, setSelectingRoutineId] = useState<number | null>(null);
  const [deletingRoutineId, setDeletingRoutineId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const [routinesResponse, planResponse] = await Promise.all([
        getTrainingRoutinesApi(),
        getUserWorkoutPlanApi(),
      ]);
      setRoutines(routinesResponse.data);
      setCurrentSelectedRoutineId(planResponse.data.current_routine);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Redirecting...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(err.message || 'Failed to load initial data.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateRoutine = () => navigate('/workout-mod', { state: { mode: 'create' } });

  const handleEditRoutine = (routineId: number, isPreset: boolean) => {
    navigate(`/workout-mod`, { state: { mode: 'edit', routineId, isPreset } });
  };

  const handleDeleteRoutine = async (routineId: number, routineName: string) => {
    if (!window.confirm(`Are you sure you want to delete the routine "${routineName}"? This action cannot be undone.`)) {
      return; 
    }

    setDeletingRoutineId(routineId); 
    setError('');
    setSuccessMessage('');

    try {
      await deleteTrainingRoutineApi(routineId);

      setRoutines(prevRoutines => prevRoutines.filter(r => r.id !== routineId));

      if (currentSelectedRoutineId === routineId) {
        setCurrentSelectedRoutineId(null);
      }

      setSuccessMessage(`Routine "${routineName}" was successfully deleted.`);
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err: any) {
      console.error('Failed to delete routine:', err);
      setError(err.response?.data?.detail || err.message || 'Could not delete this routine.');
    } finally {
      setDeletingRoutineId(null); 
    }
  };

  const handleRoutineNameClick = (routineId: number) => {
    navigate(`/workout-display`, { state: { routineId } });
  };

  const handleSelectRoutine = async (routineDbId: number) => {
    setSelectingRoutineId(routineDbId);
    setError('');
    setSuccessMessage('');
    try {
      await updateUserWorkoutPlanApi({ current_routine: routineDbId });
      setCurrentSelectedRoutineId(routineDbId);
      setSuccessMessage(`Routine successfully selected!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to select routine:', err);
      setError(err.response?.data?.detail || err.message || 'Could not select this routine.');
    } finally {
      setSelectingRoutineId(null);
    }
  };
  
  if (loading && routines.length === 0) {
    return <div className="status-container"><p>Loading routines...</p></div>;
  }
  if (error && routines.length === 0) {
    return <div className="status-container"><p className="error-message">Error: {error}</p></div>;
  }

  return (
    <div className="evaluate-page-container">
      <div className="routines-content-card">
        <header className="routines-header">
          <h1>Workout Routines</h1>
          <button className="create-routine-btn" onClick={handleCreateRoutine}>
            <i className="fas fa-plus"></i>
            Create New
          </button>
        </header>

        <div className="feedback-message-container">
          {error && !selectingRoutineId && <p className="error-message">{error}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}
        </div>

        <div className="routine-list">
          {routines.length > 0 ? (
            routines.map((routine) => {
              const isSelected = routine.id === currentSelectedRoutineId;
              return (
                <div key={routine.id} className={`routine-item ${isSelected ? 'selected' : ''}`}>
                  <div className="routine-info" onClick={() => handleRoutineNameClick(routine.id)}>
                    <h2 className="routine-name">{routine.routine_name}</h2>
                    {routine.is_preset && <span className="preset-tag">Preset</span>}
                  </div>
                  <div className="routine-actions">
                    <button className="action-btn btn-edit" onClick={() => handleEditRoutine(routine.id, routine.is_preset)}>
                      <i className="fas fa-pencil-alt"></i>
                      {routine.is_preset ? 'Use & Edit' : 'Edit'}
                    </button>

                    {!routine.is_preset && ( 
                      <button 
                        className="action-btn btn-delete" 
                        onClick={() => handleDeleteRoutine(routine.id, routine.routine_name)}
                        disabled={deletingRoutineId === routine.id}
                      >
                        {deletingRoutineId === routine.id ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-trash-alt"></i>
                        )}
                        Delete
                      </button>
                    )}

                    {isSelected ? (
                      <span className="selected-indicator"><i className="fas fa-check"></i>Selected</span>
                    ) : (
                      <button
                        className="action-btn btn-select"
                        onClick={() => handleSelectRoutine(routine.id)}
                        disabled={selectingRoutineId === routine.id}
                      >
                        {selectingRoutineId === routine.id ? 'Selecting...' : 'Select'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p>No routines found. Get started by creating one!</p>
          )}
          <div className="add-new-routine-card" onClick={handleCreateRoutine}>
            + Add New Routine
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluateWorkout;