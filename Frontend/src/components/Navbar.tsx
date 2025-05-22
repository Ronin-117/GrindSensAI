import { Link } from 'react-router-dom';
import "./Navbar.css";

function Navbar() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Login</Link>
        </li>
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link to="/todays-workout">Today's Workout</Link>
        </li>
        <li>
          <Link to="/profile">User Progress/Profile</Link>
        </li>
        <li>
          <Link to="/evaluate-workout">Evaluate Workout</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;