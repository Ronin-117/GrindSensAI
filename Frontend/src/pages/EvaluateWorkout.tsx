// src/pages/EvaluateWorkout.tsx (or wherever you place it)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrainingRoutinesApi } from './api'; // Adjust path as needed

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

const EvaluateWorkout: React.FC = () => {
  const [routines, setRoutines] = useState<TrainingRoutineData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

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
      marginRight : "500px", // Center the container
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
    },
    routineNameBox: {
      padding: '10px 18px',
      border: '1px solid black',
      borderRadius: '8px',
      fontSize: '16px',
      marginRight: '15px',
      minWidth: '200px', // Adjusted width
      textAlign: 'left', // Usually better for names
      cursor: 'pointer', // If clickable to view details
      flexGrow: 1, // Allow it to take available space
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

      <div style={styles.routineListContainer}>
        {routines.length === 0 && !loading && <p>No routines found. Get started by creating one!</p>}
         {routines.map((routine) => (
          <div key={routine.id} style={styles.routineItemRow}>
            <div
              style={styles.routineNameBox}
              onClick={() => handleRoutineNameClick(routine.id, routine.routine_name)} // Ensure this uses the routine.id
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
          </div>
        ))}

        {/* The ".." item can be a placeholder for "Load More" or just visual */}
        {/* Or, if you want to make it a button to create a new one: */}
        <div style={styles.routineItemRow}>
            <div
                style={{...styles.ellipsisBox, cursor: 'pointer', textAlign: 'center'}}
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