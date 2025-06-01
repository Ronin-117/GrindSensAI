// src/pages/WorkoutDisplay.tsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSpecificRoutineApi } from './api'; // Adjust path as needed

// Define interfaces for the nested data structures
interface ExerciseData {
  id: number;
  exercise_name: string;
  target_muscles: string[]; // Assuming this is an array of strings
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

export interface FullTrainingRoutineData { // Export if needed elsewhere
  id: number;
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
  is_preset: boolean;
  user?: number | null; // User ID or null if it's a preset
  username?: string; // Username if available from serializer
}


const WorkoutDisplay: React.FC = () => {
  const [routine, setRoutine] = useState<FullTrainingRoutineData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();

  const routineIdFromState = location.state?.routineId as number | undefined;

  useEffect(() => {
    if (!routineIdFromState) {
      setError('No routine ID provided. Cannot display routine.');
      setLoading(false);
      // Optionally navigate back or to a routines list
      // setTimeout(() => navigate('/routines'), 3000);
      return;
    }

    const fetchRoutineDetails = async () => {
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        setError('You are not logged in. Redirecting to login...');
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        setLoading(true);
        const response = await getSpecificRoutineApi(routineIdFromState);
        setRoutine(response.data as FullTrainingRoutineData); // Type assertion
        setError('');
      } catch (err: any) {
        console.error('Failed to fetch routine details:', err);
        if (err.response && err.response.status === 401) {
          setError('Session expired. Please log in again. Redirecting...');
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          setTimeout(() => navigate('/login'), 3000);
        } else if (err.response && err.response.status === 404) {
          setError(`Routine with ID ${routineIdFromState} not found.`);
        }
        else {
          setError(err.message || 'Failed to load routine details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRoutineDetails();
  }, [routineIdFromState, navigate]);


  // --- Styling (can be moved to a separate CSS file or use CSS-in-JS) ---
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      maxWidth: '900px',
      margin: '20px auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9',
      marginRight : "500px",
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      borderBottom: '2px solid #007bff',
      paddingBottom: '15px',
    },
    routineName: {
      fontSize: '2.2em',
      fontWeight: 'bold',
      color: '#333',
      margin: '0 0 10px 0',
    },
    presetBadge: {
      display: 'inline-block',
      backgroundColor: '#007bff',
      color: 'white',
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '0.7em',
      marginLeft: '10px',
      verticalAlign: 'middle',
    },
    metaInfoContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '15px',
      marginBottom: '30px',
      padding: '15px',
      backgroundColor: '#fff',
      borderRadius: '5px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    metaItem: {
      fontSize: '0.95em',
    },
    metaLabel: {
      fontWeight: 'bold',
      color: '#555',
    },
    sectionTitle: {
      fontSize: '1.6em',
      fontWeight: '600',
      color: '#0056b3',
      marginTop: '30px',
      marginBottom: '15px',
      borderBottom: '1px solid #ddd',
      paddingBottom: '8px',
    },
    scheduleItem: {
      marginBottom: '25px',
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '5px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    },
    scheduleHeader: {
      fontSize: '1.3em',
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '10px',
    },
    sessionFocus: {
      fontSize: '1.1em',
      fontStyle: 'italic',
      color: '#444',
      marginBottom: '15px',
    },
    exerciseTable: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '10px',
    } as React.CSSProperties, // Important for borderCollapse
    th: {
      backgroundColor: '#f0f8ff', // Light blue
      color: '#333',
      padding: '10px',
      textAlign: 'left',
      borderBottom: '2px solid #add8e6', // Light blue border
      fontSize: '0.9em',
      textTransform: 'capitalize',
    } as React.CSSProperties,
    td: {
      padding: '10px',
      borderBottom: '1px solid #eee',
      fontSize: '0.9em',
      verticalAlign: 'top',
    } as React.CSSProperties,
    notes: {
      fontSize: '0.85em',
      color: '#666',
      marginTop: '5px',
      whiteSpace: 'pre-wrap',
    } as React.CSSProperties,
    guidelinesSection: {
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#e9ecef',
      borderRadius: '5px',
    },
    guidelinesTitle: {
        fontSize: '1.1em',
        fontWeight: 'bold',
        marginBottom: '8px',
    },
    loadingErrorContainer: {
      textAlign: 'center',
      marginTop: '50px',
      fontSize: '18px',
    } as React.CSSProperties,
     editButtonContainer: {
        textAlign: 'right', // Aligns button to the right
        marginTop: '20px',
        marginBottom: '10px',
    } as React.CSSProperties,
    editButton: {
        padding: '10px 20px',
        fontSize: '1em',
        color: 'white',
        backgroundColor: '#007bff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        textDecoration: 'none', // For Link component
    } as React.CSSProperties,
  };


  if (loading) {
    return <div style={styles.loadingErrorContainer}><p>Loading routine details...</p></div>;
  }

  if (error) {
    return <div style={styles.loadingErrorContainer}><p style={{ color: 'red' }}>Error: {error}</p></div>;
  }

  if (!routine) {
    return <div style={styles.loadingErrorContainer}><p>No routine data found.</p></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.routineName}>
          {routine.routine_name}
          {routine.is_preset && <span style={styles.presetBadge}>PRESET</span>}
        </h1>
        <p style={{fontSize: '1.1em', color: '#555'}}>{routine.description}</p>
      </div>

       <div style={styles.editButtonContainer}>
            <Link
                to={`/workout-mod`}
                state={{ mode: 'edit', routineId: routine.id, isPreset: routine.is_preset }}
                style={styles.editButton}
            >
                {routine.is_preset ? 'Use & Customize This Routine' : 'Edit This Routine'}
            </Link>
        </div>


      <div style={styles.metaInfoContainer}>
        <div style={styles.metaItem}><span style={styles.metaLabel}>Goal:</span> {routine.goal}</div>
        <div style={styles.metaItem}><span style={styles.metaLabel}>Experience Level:</span> {routine.experience_level}</div>
        <div style={styles.metaItem}><span style={styles.metaLabel}>Training Split:</span> {routine.training_split}</div>
        <div style={styles.metaItem}><span style={styles.metaLabel}>Days Per Week:</span> {routine.days_per_week}</div>
        {routine.username && <div style={styles.metaItem}><span style={styles.metaLabel}>Created By:</span> {routine.username}</div>}
      </div>


      <h2 style={styles.sectionTitle}>Weekly Schedule</h2>
      {routine.weekly_schedule.map((item) => (
        <div key={item.id} style={styles.scheduleItem}>
          <h3 style={styles.scheduleHeader}>{item.day_of_week_or_number}</h3>
          <p style={styles.sessionFocus}>Focus: {item.session_focus}</p>
          <table style={styles.exerciseTable}>
            <thead>
              <tr>
                <th style={styles.th}>Exercise</th>
                <th style={styles.th}>Target Muscles</th>
                <th style={styles.th}>Sets</th>
                <th style={styles.th}>Reps/Duration</th>
                <th style={styles.th}>Rest</th>
              </tr>
            </thead>
            <tbody>
              {item.exercises.map((exercise) => (
                <tr key={exercise.id}>
                  <td style={styles.td}>
                    {exercise.exercise_name}
                    {exercise.notes && <p style={styles.notes}><em>Note:</em> {exercise.notes}</p>}
                  </td>
                  <td style={styles.td}>{exercise.target_muscles.join(', ')}</td>
                  <td style={styles.td}>{exercise.sets}</td>
                  <td style={styles.td}>{exercise.reps_or_duration}</td>
                  <td style={styles.td}>{exercise.rest_period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {routine.cardio_guidelines && (
        <div style={styles.guidelinesSection}>
            <h3 style={styles.guidelinesTitle}>Cardio Guidelines</h3>
            <p>{routine.cardio_guidelines}</p>
        </div>
      )}
      {routine.flexibility_guidelines && (
        <div style={styles.guidelinesSection}>
            <h3 style={styles.guidelinesTitle}>Flexibility Guidelines</h3>
            <p>{routine.flexibility_guidelines}</p>
        </div>
      )}
      {routine.precautions && (
        <div style={styles.guidelinesSection}>
            <h3 style={styles.guidelinesTitle}>Precautions</h3>
            <p>{routine.precautions}</p>
        </div>
      )}
      {routine.coach_response && (
          <div style={styles.guidelinesSection}>
              <h3 style={styles.guidelinesTitle}>Coach's Notes / Feedback</h3>
              <p>{routine.coach_response}</p>
          </div>
      )}
    </div>
  );
};

export default WorkoutDisplay;