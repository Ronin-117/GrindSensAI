import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import EvaluateWorkout from './pages/EvaluateWorkout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import TodaysWorkout from './pages/TodaysWorkout';
import WorkoutMod from './pages/WorkoutMod';


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