import { Link, Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import EvaluateWorkout from './pages/EvaluateWorkout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import TodaysWorkout from './pages/TodaysWorkout';
import WorkoutDisplay from './pages/WorkoutDisplay';
import WorkoutMod from './pages/WorkoutMod';
import WorkoutResult from './pages/WorkoutResult';


// Simple Nav component to use useNavigate for logout
const Navigation = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!sessionStorage.getItem('accessToken');

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    navigate('/login'); // Use navigate for programmatic navigation
  };

  return (
    <nav style={{ padding: '10px', background: '#f0f0f0', marginBottom: '20px' }}>
      <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
      {!isLoggedIn && <Link to="/login" style={{ marginRight: '10px' }}>Login/Signup</Link>}
      {isLoggedIn && <Link to="/profile" style={{ marginRight: '10px' }}>Profile</Link>}
      {isLoggedIn && <Link to="/evaluate-workout" style={{ marginRight: '10px' }}>Routines</Link>}
      {isLoggedIn && <button onClick={handleLogout} style={{ float: 'right', background: 'none', border: '1px solid #ccc', padding: '5px 10px', cursor: 'pointer' }}>Logout</button>}
    </nav>
  );
};


function App() {
  return (
    <Router>
      <div className="app-container"> 
        
        <div className="content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/evaluate-workout" element={<EvaluateWorkout />} />
          <Route path="/todays-workout" element={<TodaysWorkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/workout-mod" element={<WorkoutMod />} />
          <Route path="/workout-display" element={<WorkoutDisplay />} />
          <Route path="/workout-result" element={<WorkoutResult />} />
        </Routes>
        </div>
        <div className="navbar">
          <Navbar />
        </div>
      </div>
    </Router>
  );
}

export default App;