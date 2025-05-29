// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfileApi } from './api'; // Importing from api.js

// Define an interface for the expected profile data structure
// This helps TypeScript understand the shape of `response.data`
interface UserProfileData {
  id: number;
  user: number; // Assuming this is the user's ID from Django User model
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  age?: number;     // Optional fields
  bio?: string;
  height?: number;
  weight?: number;
  // Add any other fields your backend UserProfileSerializer returns
}

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        setError('You are not logged in. Redirecting to login...');
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        setLoading(true);
        // When calling getProfileApi from a .js file, response will be AxiosResponse<any>
        // We can then cast response.data to our defined interface
        const response = await getProfileApi();
        setProfile(response.data as UserProfileData); // Type assertion here
        setError('');
      } catch (err: any) { // Catch as 'any' or a more specific error type
        console.error('Failed to fetch profile:', err);
        if (err.response && err.response.status === 401) {
          setError('Your session may have expired. Please log in again. Redirecting...');
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          setTimeout(() => navigate('/login'), 3000);
        } else if (err.response && err.response.status === 404) {
            setError('Profile not found. It might need to be created if not done during signup.');
        } else {
          setError(err.message || 'Failed to load profile data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return <div style={styles.container}><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div style={styles.container}><p style={{ color: 'red' }}>Error: {error}</p></div>;
  }

  if (!profile) {
    return <div style={styles.container}><p>No profile data available. Your profile might not have been created yet.</p></div>;
  }

  return (
    <div style={styles.container}>
      <h1>Your Profile</h1>
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
      {/* <button onClick={() => navigate('/profile/edit')}>Edit Profile</button> */}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '40px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    marginRight:'500px'
  } as React.CSSProperties,
  profileDetail: {
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee',
  } as React.CSSProperties,
};

export default ProfilePage;