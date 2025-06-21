import { NavLink, useNavigate } from 'react-router-dom';
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!sessionStorage.getItem('accessToken');

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar-container">
      <ul className="navbar-list">
        <li>
          <NavLink to="/dashboard" className="nav-item">
            <i className="fas fa-chalkboard"></i>
            <span className="nav-text">Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/profile" className="nav-item">
            <i className="fas fa-user"></i>
            <span className="nav-text">User Progress</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/evaluate-workout" className="nav-item">
            <i className="fas fa-dumbbell"></i>
            <span className="nav-text">Workout Routines</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/todays-workout" className="nav-item">
            <i className="fas fa-calendar-day"></i>
            <span className="nav-text">Today's Workout</span>
          </NavLink>
        </li>

        {isLoggedIn && (
          <li>
            <button onClick={handleLogout} className="nav-item logout-btn">
              <i className="fas fa-sign-out-alt"></i>
              <span className="nav-text">Logout</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;