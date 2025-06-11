// src/pages/EvaluateWorkout.tsx (or wherever you place it)
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrainingRoutinesApi, getUserWorkoutPlanApi, updateUserWorkoutPlanApi } from './api'; // Adjust path as needed

// Define an interface for the routine data structure from the backend
interface TrainingRoutineData {
  id: number; // This is the primary key from your Django model
  routine_id: string; // Your custom identifier like "PRESET_BFB_001"
  routine_name: string;
  is_preset: boolean;
  user?: number | null; // User ID or null if it's a preset
  // Add other fields you might want to use or display briefly
  description?: string;
  experience_level?: string;
}

interface WorkoutPlanData { // Interface for the fetched workout plan
    id: number;
    current_routine: number | null; // ID of the currently selected routine
    // Add other fields if you need them from WorkoutPlan
}

const EvaluateWorkout: React.FC = () => {
  const [routines, setRoutines] = useState<TrainingRoutineData[]>([]);
  const [currentSelectedRoutineId, setCurrentSelectedRoutineId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectingRoutineId, setSelectingRoutineId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      setError('You are not logged in. Redirecting to login...');
      setLoading(false);
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Fetch in parallel
      const [routinesResponse, planResponse] = await Promise.all([
        getTrainingRoutinesApi(),
        getUserWorkoutPlanApi()
      ]);

      setRoutines(routinesResponse.data as TrainingRoutineData[]);
      const planData = planResponse.data as WorkoutPlanData;
      setCurrentSelectedRoutineId(planData.current_routine);

    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      if (err.response && err.response.status === 401) {
        setError('Session expired. Please log in again. Redirecting...');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError(err.message || 'Failed to load initial data.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]); // useCallback dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]); // useEffect will run when fetchData changes (which is once due to useCallback)

  useEffect(() => {
    const fetchRoutines = async () => {
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        setError('You are not logged in. Redirecting to login...');
        setLoading(false);
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      try {
        setLoading(true);
        const response = await getTrainingRoutinesApi();
        // Assuming response.data is an array of TrainingRoutineData
        setRoutines(response.data as TrainingRoutineData[]);
        setError('');
      } catch (err: any) {
        console.error('Failed to fetch routines:', err);
        if (err.response && err.response.status === 401) {
          setError('Session expired. Please log in again. Redirecting...');
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          setTimeout(() => navigate('/'), 3000);
        } else {
          setError(err.message || 'Failed to load routines.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRoutines();
  }, [navigate]);


  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      padding: '20px',
      fontFamily: 'sans-serif',
      maxWidth: '800px', // Added max-width for better layout
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      margin: 0,
    },
    createButton: {
      fontSize: '16px',
      padding: '8px 12px',
      border: '1px solid black',
      background: 'transparent',
      cursor: 'pointer',
      borderRadius: '4px',
    },
    routineListContainer: {},
    routineItemRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '15px',
      padding: '10px', // Add some padding to the row itself for the highlight
      borderRadius: '8px', // Match other border radiuses
      transition: 'background-color 0.3s ease', // Smooth transition for highlight
    },
    routineNameBox: {
      padding: '10px 18px',
      // border: '1px solid black', // Border can be conditional or part of highlighted style
      borderRadius: '8px',
      fontSize: '16px',
      marginRight: '15px',
      minWidth: '200px',
      textAlign: 'left',
      cursor: 'pointer',
      flexGrow: 1,
    },
    presetIndicator: {
      fontSize: '0.8em',
      color: '#555',
      display: 'block', // Make it appear on a new line within the box
      marginTop: '4px',
    },
    editButton: {
      padding: '10px 15px',
      border: '1px solid black',
      borderRadius: '8px',
      background: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      fontSize: '16px',
      flexShrink: 0, // Prevent button from shrinking
    },
    pencilIcon: {
      marginLeft: '8px',
      fontSize: '14px',
    },
    ellipsisBox: {
      padding: '10px 18px',
      border: '1px solid black',
      borderRadius: '8px',
      fontSize: '16px',
      color: '#333',
      textAlign: 'left',
      display: 'inline-block',
      minWidth: '200px',
      flexGrow: 1,
    },
    loadingErrorContainer: {
      textAlign: 'center',
      marginTop: '50px',
      fontSize: '18px',
    } as React.CSSProperties,
    selectButton: {
      padding: '8px 12px',
      border: '1px solid #28a745', // Green border
      color: '#28a745', // Green text
      background: 'transparent',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      marginLeft: '10px', // Space from edit button
      flexShrink: 0,
    },
    successMessage: {
        color: 'green',
        textAlign: 'center',
        padding: '10px',
        backgroundColor: '#e6ffed',
        border: '1px solid #c3e6cb',
        borderRadius: '4px',
        marginTop: '10px',
        marginBottom: '10px',
    } as React.CSSProperties,
    selectedRoutineRow: {
      backgroundColor: '#e6f7ff', // A light blue for highlighting
      border: '1px solid #91d5ff', // A slightly darker blue border
    },
    selectedRoutineNameBox: { // Optional: if you want specific style for name in selected row
        fontWeight: 'bold', // Example
    }
  };

  // --- Event Handlers ---
  const handleCreateRoutine = () => {
    console.log('Create new routine clicked');
    // Navigate to /workout-mod for creation (no ID needed)
    // The state for 'mode' can be passed, or the /workout-mod page can infer 'create' if no ID.
    navigate('/workout-mod', { state: { mode: 'create' } });
  };

  const handleEditRoutine = (routineDatabaseId: number, routineName: string, isPreset: boolean) => {
    console.log(`Edit clicked for routine: ${routineName} (DB ID: ${routineDatabaseId})`);
    // Navigate to /workout-mod for editing, passing the routine's database ID
    // We also pass an indicator if it's a preset, so the /workout-mod page
    // can decide if it should be a "copy and edit" flow for presets.
    navigate(`/workout-mod`, { state: { mode: 'edit', routineId: routineDatabaseId, isPreset: isPreset } });
  };

   const handleRoutineNameClick = (routineDatabaseId: number, routineName: string) => {
    console.log(`Routine name clicked for display: ${routineName} (DB ID: ${routineDatabaseId})`);
    // Navigate to /workout-display, passing the routine's database ID
    navigate(`/workout-display`, { state: { routineId: routineDatabaseId } });
  };

  const handleSelectRoutine = async (routineDbId: number) => {
    setSelectingRoutineId(routineDbId);
    setError('');
    setSuccessMessage('');
    try {
      const response = await updateUserWorkoutPlanApi({ current_routine: routineDbId });
      console.log('Workout plan updated:', response.data);
      setCurrentSelectedRoutineId(routineDbId); // Update state immediately
      setSuccessMessage(`Routine successfully selected!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to select routine:', err);
      setError(err.response?.data?.detail || err.message || 'Could not select this routine.');
    } finally {
      setSelectingRoutineId(null);
    }
  };

  

  if (loading && routines.length === 0) { // Show initial loading only if routines are not yet fetched
    return <div style={styles.loadingErrorContainer}><p>Loading routines...</p></div>;
  }

  if (error && routines.length === 0) { // Show error only if initial fetch failed and no routines to show
    return <div style={styles.loadingErrorContainer}><p style={{ color: 'red' }}>Error: {error}</p></div>;
  }

  if (loading) {
    return <div style={styles.loadingErrorContainer}><p>Loading routines...</p></div>;
  }

  if (error) {
    return <div style={styles.loadingErrorContainer}><p style={{ color: 'red' }}>Error: {error}</p></div>;
  }

  return (
     <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Workout Routines</h1>
        <button style={styles.createButton} onClick={handleCreateRoutine}>
          create +
        </button>
      </div>

      {error && !selectingRoutineId && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {successMessage && <p style={styles.successMessage}>{successMessage}</p>}

      <div style={styles.routineListContainer}>
        {routines.length === 0 && !loading && <p>No routines found. Get started by creating one!</p>}
        {routines.map((routine) => {
          const isSelected = routine.id === currentSelectedRoutineId;
          return (
            <div
              key={routine.id}
              style={{
                ...styles.routineItemRow,
                ...(isSelected ? styles.selectedRoutineRow : {}) // Apply highlight style
              }}
            >
              <div
                style={{
                    ...styles.routineNameBox,
                    border: isSelected ? 'none' : '1px solid black', // Conditional border
                    ...(isSelected ? styles.selectedRoutineNameBox : {})
                }}
                onClick={() => handleRoutineNameClick(routine.id, routine.routine_name)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleRoutineNameClick(routine.id, routine.routine_name)}
              >
                {routine.routine_name}
                {routine.is_preset && (
                  <span style={styles.presetIndicator}>(Preset)</span>
                )}
              </div>
              <button
                style={styles.editButton}
                onClick={() => handleEditRoutine(routine.id, routine.routine_name, routine.is_preset)}
              >
                {routine.is_preset ? 'Use & Edit' : 'Edit'}
                <span style={styles.pencilIcon}>✏️</span>
              </button>
              {/* Conditionally render Select button or a "Selected" indicator */}
              {isSelected ? (
                <span style={{...styles.selectButton, color: '#28a745', borderColor: '#28a745', cursor: 'default' }}>✓ Selected</span>
              ) : (
                <button
                  style={styles.selectButton}
                  onClick={() => handleSelectRoutine(routine.id)}
                  disabled={selectingRoutineId === routine.id}
                >
                  {selectingRoutineId === routine.id ? 'Selecting...' : 'Select'}
                </button>
              )}
            </div>
          );
        })}
        {/* ... (ellipsisBox for adding new routine) ... */}
         <div style={styles.routineItemRow}>
            <div
                style={{...styles.ellipsisBox, cursor: 'pointer', textAlign: 'center', border: '1px solid black'}}
                onClick={handleCreateRoutine}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRoutine()}
            >
            + Add New Routine
            </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluateWorkout;