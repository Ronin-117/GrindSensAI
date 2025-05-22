import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import EvaluateWorkout from './pages/EvaluateWorkout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import TodaysWorkout from './pages/TodaysWorkout';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/evaluate-workout" element={<EvaluateWorkout />} />
        <Route path="/todays-workout" element={<TodaysWorkout />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;