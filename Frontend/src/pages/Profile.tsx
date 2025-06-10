// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Make sure both API calls are available and imported
import { getProfileApi, getUserWorkoutPlanApi } from './api';

// Interface for the UserProfile data from your getProfileApi
interface UserProfileData {
  id: number;
  user: number;
  username: string;
  bio?: string;
  age?: number;
  height?: number;
  weight?: number;
  // Add other fields like first_name, last_name, email if your serializer provides them
}

// Interface for the WorkoutPlan data from getUserWorkoutPlanApi
interface WorkoutPlanData {
    id: number;
    heat_level: number; // This is the field we want to display
    // ... add other plan details if you need them, like current_routine_details
}

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlanData | null>(null); // New state for plan data
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        setError('You are not logged in. Redirecting to login...');
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      setLoading(true);
      setError('');
      try {
        // Fetch both sets of data concurrently for better performance
        const [profileResponse, planResponse] = await Promise.all([
          getProfileApi(),
          getUserWorkoutPlanApi() // Fetch the workout plan
        ]);
        
        setProfile(profileResponse.data as UserProfileData);
        setWorkoutPlan(planResponse.data as WorkoutPlanData);

      } catch (err: any) {
        console.error('Failed to fetch profile or plan data:', err);
        if (err.response && err.response.status === 401) {
          setError('Your session has expired. Please log in again. Redirecting...');
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setError(err.message || 'Failed to load page data.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // A small, self-contained component to render the heat meter
  const HeatLevelDisplay: React.FC<{ level: number }> = ({ level }) => {
    const heats = Array.from({ length: 10 }, (_, i) => {
      const isActive = i < level;
      const heatColor = `rgba(255, 69, 0, ${0.1 + (i * 0.09)})`; // OrangeRed with increasing opacity
      return (
        <div 
          key={i} 
          style={{
            ...styles.heatBox,
            backgroundColor: isActive ? heatColor : '#333',
            boxShadow: isActive ? `0 0 5px ${heatColor}` : 'none',
          }}
          title={`Level ${i + 1}`}
        ></div>
      );
    });
    return <div style={styles.heatContainer}>{heats}</div>;
  };

  if (loading) {
    return <div style={styles.container}><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div style={styles.container}><p style={{ color: 'red' }}>Error: {error}</p></div>;
  }

  if (!profile) {
    return <div style={styles.container}><p>No profile data available.</p></div>;
  }

  return (
    <div style={styles.container}>
      <h1>{profile.username}'s Profile</h1>
      <div style={styles.profileDetail}>
        <strong>Username:</strong> {profile.username || 'N/A'}
      </div>
      <div style={styles.profileDetail}>
        <strong>Age:</strong> {profile.age ?? 'N/A'}
      </div>
      <div style={styles.profileDetail}>
        <strong>Height (cm):</strong> {profile.height ?? 'N/A'}
      </div>
      <div style={styles.profileDetail}>
        <strong>Weight (kg):</strong> {profile.weight ?? 'N/A'}
      </div>
      <div style={styles.profileDetail}>
        <strong>Bio:</strong>
        <p style={{ marginTop: '5px', whiteSpace: 'pre-wrap' }}>{profile.bio || 'No bio provided.'}</p>
      </div>

      {/* --- HEAT LEVEL SECTION --- */}
      <div style={styles.heatSection}>
        <h2>Weekly Heat Level</h2>
        <p style={styles.heatDescription}>Your activity level based on workout completion in the last 7 days.</p>
        {workoutPlan ? (
            <HeatLevelDisplay level={workoutPlan.heat_level} />
        ) : (
            // This shows if the workoutPlan fetch is still pending or failed
            <p>Loading heat level...</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '40px auto',
    padding: '20px 40px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  profileDetail: {
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #eee',
  } as React.CSSProperties,
  heatSection: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
    textAlign: 'center' as 'center',
  },
  heatDescription: {
    fontSize: '0.9em',
    color: '#666',
    marginBottom: '20px',
  },
  heatContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '5px',
    paddingBottom: '10px'
  },
  heatBox: {
    width: '25px',
    height: '40px',
    borderRadius: '3px',
    transition: 'background-color 0.5s ease, box-shadow 0.5s ease',
  },
};

export default ProfilePage;