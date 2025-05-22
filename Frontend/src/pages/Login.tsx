import { useState } from 'react';

function Login() {
  const [isLogin, setIsLogin] = useState(true);

  const handleToggle = (isLogin: boolean) => {
    setIsLogin(isLogin);
  };

  return (
    <div>
      <h1>{isLogin ? 'Login' : 'Sign Up'}</h1>

      <div>
        <button onClick={() => handleToggle(true)} style={{ fontWeight: isLogin ? 'bold' : 'normal' }}>
          Login
        </button>
        <button onClick={() => handleToggle(false)} style={{ fontWeight: !isLogin ? 'bold' : 'normal' }}>
          Sign Up
        </button>
      </div>

      {isLogin ? (
        <form>
          <div>
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" />
          </div>
          <div>
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" />
          </div>
          <button type="submit">Log In</button>
        </form>
      ) : (
        <form>
          <div>
            <label htmlFor="newUsername">Username:</label>
            <input type="text" id="newUsername" name="newUsername" />
          </div>
          <div>
            <label htmlFor="newPassword">Password:</label>
            <input type="password" id="newPassword" name="newPassword" />
          </div>
          <div>
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input type="password" id="confirmPassword" name="confirmPassword" />
          </div>
          <button type="submit">Sign Up</button>
        </form>
      )}
    </div>
  );
}

export default Login;