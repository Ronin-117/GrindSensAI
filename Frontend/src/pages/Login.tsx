import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProfileApi, loginUserApi, registerUserApi } from './api';
import './Login.css'; // Import the new CSS file

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  // ... (all your state variables remain the same)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupAge, setSignupAge] = useState('');
  const [signupHeight, setSignupHeight] = useState('');
  const [signupWeight, setSignupWeight] = useState('');
  const [signupBio, setSignupBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ... (all your handler functions like handleToggle, handleLoginSubmit, handleSignupSubmit remain exactly the same)
  // --- NO CHANGES NEEDED FOR LOGIC ---
  const handleToggle = (isLoginView: boolean) => {
    if (isLogin === isLoginView) return; 
    setIsLogin(isLoginView);
    setError('');
    setSuccessMessage('');
    setLoginUsername('');
    setLoginPassword('');
    setSignupUsername('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setSignupAge('');
    setSignupHeight('');
    setSignupWeight('');
    setSignupBio('');
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await loginUserApi({
        username: loginUsername,
        password: loginPassword,
      });
      const { access, refresh } = response.data;
      sessionStorage.setItem('accessToken', access);
      sessionStorage.setItem('refreshToken', refresh);
      setSuccessMessage('Login successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);

    } catch (err: any) {
      console.error('Login error:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
        setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (signupPassword !== signupConfirmPassword) {
      setError("Passwords don't match!");
      return;
    }
    setLoading(true);

    try {
      await registerUserApi({
        username: signupUsername,
        email: signupEmail,
        password: signupPassword,
      });
      
      const loginResponse = await loginUserApi({
        username: signupUsername,
        password: signupPassword,
      });
      const { access, refresh } = loginResponse.data;
      sessionStorage.setItem('accessToken', access);
      sessionStorage.setItem('refreshToken', refresh);
      setSuccessMessage('Login successful after signup! Saving profile...');

      const profileData: { age?: number; height?: number; weight?: number; bio?: string } = {};
      if (signupAge) profileData.age = parseInt(signupAge, 10);
      if (signupHeight) profileData.height = parseInt(signupHeight, 10);
      if (signupWeight) profileData.weight = parseInt(signupWeight, 10);
      if (signupBio) profileData.bio = signupBio;

      if (Object.keys(profileData).length > 0) {
        try {
            await createProfileApi(profileData);
            setSuccessMessage('Signup complete and profile data saved! Redirecting...');
        } catch (profileError: any) {
            console.error('Profile creation error:', profileError.response ? profileError.response.data : profileError.message);
            setError('User created, but profile creation failed: ' + (profileError.response?.data?.detail || profileError.message));
        }
      } else {
        setSuccessMessage('Signup complete! Redirecting...');
      }
      setTimeout(() => navigate('/dashboard'), 1500);

    } catch (err: any) {
      console.error('Signup process error:', err.response ? err.response.data : err.message);
      let errorMessage = 'Signup process failed.';
      if (err.response?.data) {
        const errors = err.response.data;
        if (errors.username) errorMessage = `Username: ${errors.username.join(', ')}`;
        else if (errors.email) errorMessage = `Email: ${errors.email.join(', ')}`;
        else if (errors.password) errorMessage = `Password: ${errors.password.join(', ')}`;
        else if (errors.detail) errorMessage = errors.detail;
        else {
            try { errorMessage = JSON.stringify(errors); } catch { /* ignore */ }
        }
      }
      setError(errorMessage);
    } finally {
        setLoading(false);
    }
  };


  return (
    <div className="login-page-container">
      <video id="background-video" loop autoPlay muted>
        <source src="/login.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* --- MODIFIED JSX STRUCTURE --- */}
      <form
        className="login-form-container"
        onSubmit={isLogin ? handleLoginSubmit : handleSignupSubmit}
      >
        <div className="toggle-container">
          <div className={`highlight ${isLogin ? 'login' : 'signup'}`}></div>
          <button type="button" onClick={() => handleToggle(true)} className={`toggle-btn ${isLogin ? 'active' : ''}`}>Login</button>
          <button type="button" onClick={() => handleToggle(false)} className={`toggle-btn ${!isLogin ? 'active' : ''}`}>Sign Up</button>
        </div>

        {error && <p className="message error-message">{error}</p>}
        {successMessage && <p className="message success-message">{successMessage}</p>}
        
        {/* This new div will contain the scrollable fields */}
        <div className="scrollable-form-content">
          {isLogin ? (
            <div className="form-content" key="login-form">
              <div className="input-group">
                <label htmlFor="username">Username</label>
                <input type="text" id="username" className="input-field" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required />
              </div>
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" className="input-field" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              </div>
            </div>
          ) : (
            <div className="form-content" key="signup-form">
              <div className="input-group">
                <label htmlFor="newUsername">Username</label>
                <input type="text" id="newUsername" className="input-field" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} required />
              </div>
              <div className="input-group">
                <label htmlFor="newEmail">Email</label>
                <input type="email" id="newEmail" className="input-field" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
              </div>
              <div className="input-group">
                <label htmlFor="newPassword">Password</label>
                <input type="password" id="newPassword" className="input-field" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
              </div>
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" className="input-field" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} required />
              </div>
              <p className="optional-info">Optional Profile Info</p>
              <div className="input-group">
                <label htmlFor="newAge">Age</label>
                <input type="number" id="newAge" className="input-field" value={signupAge} onChange={(e) => setSignupAge(e.target.value)} />
              </div>
              <div className="input-group">
                <label htmlFor="newHeight">Height (cm)</label>
                <input type="number" id="newHeight" className="input-field" value={signupHeight} onChange={(e) => setSignupHeight(e.target.value)} />
              </div>
              <div className="input-group">
                <label htmlFor="newWeight">Weight (kg)</label>
                <input type="number" id="newWeight" className="input-field" value={signupWeight} onChange={(e) => setSignupWeight(e.target.value)} />
              </div>
              <div className="input-group">
                <label htmlFor="newBio">Bio</label>
                <textarea id="newBio" rows={3} className="textarea-field" value={signupBio} onChange={(e) => setSignupBio(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* The submit button is now a direct child of the form, outside the scrollable area */}
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? (isLogin ? 'Logging In...' : 'Signing Up...') : (isLogin ? 'Log In' : 'Sign Up')}
        </button>
      </form>
    </div>
  );
}

export default Login;