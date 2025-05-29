// src/Login.tsx
import React, { useState } from 'react'; // Import React explicitly
import { useNavigate } from 'react-router-dom';
import { createProfileApi, loginUserApi, registerUserApi } from './api'; // Imports from api.js

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupAge, setSignupAge] = useState('');
  const [signupHeight, setSignupHeight] = useState('');
  const [signupWeight, setSignupWeight] = useState('');
  const [signupBio, setSignupBio] = useState('');

  // General state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');


  const handleToggle = (isLoginView: boolean) => { // Type annotation for parameter
    setIsLogin(isLoginView);
    setError('');
    setSuccessMessage('');
    // Clear form fields on toggle
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

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => { // Type event
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await loginUserApi({ // Called from api.js
        username: loginUsername,
        password: loginPassword,
      });
      // Assuming response.data from api.js will have 'access' and 'refresh'
      // TypeScript might infer response.data as 'any' here.
      // For better type safety, you could do:
      // const { access, refresh } = response.data as { access: string; refresh: string; };
      const { access, refresh } = response.data;
      sessionStorage.setItem('accessToken', access);
      sessionStorage.setItem('refreshToken', refresh);

      setSuccessMessage('Login successful! Redirecting...');
      console.log('Login successful:', response.data);
      navigate('/profile'); // Navigate to profile page

    } catch (err: any) { // Catch as 'any' or a more specific error type
      console.error('Login error:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
        setLoading(false); // Ensure loading is set to false in finally
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => { // Type event
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (signupPassword !== signupConfirmPassword) {
      setError("Passwords don't match!");
      return;
    }
    setLoading(true);

    try {
      await registerUserApi({ // Called from api.js
        username: signupUsername,
        email: signupEmail,
        password: signupPassword,
      });
      setSuccessMessage('User registration successful! Logging in...');

      const loginResponse = await loginUserApi({ // Called from api.js
        username: signupUsername,
        password: signupPassword,
      });
      // const { access, refresh } = loginResponse.data as { access: string; refresh: string; };
      const { access, refresh } = loginResponse.data;
      sessionStorage.setItem('accessToken', access);
      sessionStorage.setItem('refreshToken', refresh);
      setSuccessMessage('Login successful after signup! Checking for profile data...');

      const profileData: { age?: number; height?: number; weight?: number; bio?: string } = {};
      if (signupAge) profileData.age = parseInt(signupAge, 10);
      if (signupHeight) profileData.height = parseInt(signupHeight, 10);
      if (signupWeight) profileData.weight = parseInt(signupWeight, 10);
      if (signupBio) profileData.bio = signupBio;

      if (Object.keys(profileData).length > 0) {
        try {
            await createProfileApi(profileData); // Called from api.js
            setSuccessMessage('Signup complete and profile data saved! Redirecting...');
        } catch (profileError: any) {
            console.error('Profile creation error:', profileError.response ? profileError.response.data : profileError.message);
            setError('User created and logged in, but profile creation failed: ' + (profileError.response?.data?.detail || profileError.message));
        }
      } else {
        setSuccessMessage('Signup complete! Redirecting...');
      }
      console.log('Signup and subsequent login successful.');
      navigate('/profile'); // Navigate to profile page

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
        setLoading(false); // Ensure loading is set to false in finally
    }
  };


  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>{isLogin ? 'Login' : 'Sign Up'}</h1>
      <div>
        <button onClick={() => handleToggle(true)} style={{ fontWeight: isLogin ? 'bold' : 'normal', marginRight: '10px', padding: '8px 12px' }}>Login</button>
        <button onClick={() => handleToggle(false)} style={{ fontWeight: !isLogin ? 'bold' : 'normal', padding: '8px 12px' }}>Sign Up</button>
      </div>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}
      {isLogin ? (
        <form onSubmit={handleLoginSubmit} style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="username">Username:</label><br />
            <input type="text" id="username" name="username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="password">Password:</label><br />
            <input type="password" id="password" name="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '10px 15px', width: '100%' }}>
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignupSubmit} style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="newUsername">Username:</label><br />
            <input type="text" id="newUsername" name="newUsername" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="newEmail">Email:</label><br />
            <input type="email" id="newEmail" name="newEmail" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="newPassword">Password:</label><br />
            <input type="password" id="newPassword" name="newPassword" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="confirmPassword">Confirm Password:</label><br />
            <input type="password" id="confirmPassword" name="confirmPassword" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <p>Optional Profile Info:</p>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="newAge">Age:</label><br />
            <input type="number" id="newAge" name="newAge" value={signupAge} onChange={(e) => setSignupAge(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="newHeight">Height (cm):</label><br />
            <input type="number" id="newHeight" name="newHeight" value={signupHeight} onChange={(e) => setSignupHeight(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="newWeight">Weight (kg):</label><br />
            <input type="number" id="newWeight" name="newWeight" value={signupWeight} onChange={(e) => setSignupWeight(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="newBio">Bio:</label><br />
            <textarea id="newBio" name="newBio" value={signupBio} onChange={(e) => setSignupBio(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '10px 15px', width: '100%' }}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
      )}
    </div>
  );
}

export default Login;