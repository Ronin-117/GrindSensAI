import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfileApi, getUserWorkoutPlanApi } from './api';
import './ProfilePage.css'; // Import the new stylesheet

interface UserProfileData {
  id: number;
  user: number;
  username: string;
  bio?: string;
  age?: number;
  height?: number;
  weight?: number;
}

interface WorkoutPlanData {
  id: number;
  heat_level: number;
}

// A small, self-contained component to render the heat meter using the fire GIF
const HeatLevelDisplay: React.FC<{ level: number }> = ({ level }) => {
  return (
    <div className="heat-meter">
      {Array.from({ length: 10 }, (_, i) => {
        const isActive = i < level;
        return (
          <img
            key={i}
            src="https://media.tenor.com/KXakpzVoGJgAAAAi/feuer-fire.gif" // Points to the GIF in the public folder
            alt={`Heat level ${i + 1}${!isActive ? ' (inactive)' : ''}`}
            title={`Level ${i + 1}`}
            className={`fire-gif ${isActive ? 'active' : 'inactive'}`}
          />
        );
      })}
    </div>
  );
};


function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileResponse, planResponse] = await Promise.all([
          getProfileApi(),
          getUserWorkoutPlanApi(),
        ]);
        
        setProfile(profileResponse.data);
        setWorkoutPlan(planResponse.data);

      } catch (err: any) {
        console.error('Failed to fetch profile or plan data:', err);
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again. Redirecting...');
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

  if (loading) {
    return <div className="status-container"><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className="status-container"><p className="error-message">Error: {error}</p></div>;
  }

  if (!profile) {
    return <div className="status-container"><p>No profile data available.</p></div>;
  }

  return (
    <div className="profile-page-container">
      <div className="profile-card">
        <header className="profile-header">
          <h1>{profile.username}'s Profile</h1>
        </header>
        
        <div className="profile-details-grid">
          <div className="detail-label">Username</div>
          <div className="detail-value">{profile.username || 'N/A'}</div>

          <div className="detail-label">Age</div>
          <div className="detail-value">{profile.age ?? 'N/A'}</div>

          <div className="detail-label">Height (cm)</div>
          <div className="detail-value">{profile.height ?? 'N/A'}</div>

          <div className="detail-label">Weight (kg)</div>
          <div className="detail-value">{profile.weight ?? 'N/A'}</div>
        </div>
        
        <div className="bio-section">
          <div className="detail-label">Bio</div>
          <p className="detail-value">{profile.bio || 'No bio provided.'}</p>
        </div>

        <div className="heat-level-section">
          <h2>Weekly Heat Level</h2>
          <p>Your activity level based on workout completion in the last 7 days.</p>
          {workoutPlan ? (
              <HeatLevelDisplay level={workoutPlan.heat_level} />
          ) : (
              <p>Loading heat level...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;