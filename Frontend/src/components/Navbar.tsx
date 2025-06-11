import { Link, useNavigate } from 'react-router-dom';
import "./Navbar.css";

function Navbar() {

  const navigate = useNavigate();
  // Check login status on every render to ensure it's up-to-date
  const isLoggedIn = !!sessionStorage.getItem('accessToken');

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    // Navigate to login after logout. Using replace: true prevents the user from
    // clicking the back button to get to the logged-in page again.
    navigate('/login', { replace: true });
  };

  
  return (
    <nav>
      <ul>
        <li>
          <Link to="/"><button>Login</button></Link>
        </li>
        <li>
          <Link to="/dashboard"><button>Dashboard</button></Link>
        </li>
        <li>
          <Link to="/profile"><button>User Progress/Profile</button></Link>
        </li>
        <li>
          <Link to="/evaluate-workout"><button>Workout Routines</button></Link>
        </li>
        <li>
          <Link to="/todays-workout"><button>Today's Workout</button></Link>
        </li>
        {/* Add a logout button if logged in */}
        {isLoggedIn && (
            <li>
                <button onClick={handleLogout}>Logout</button>
            </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;