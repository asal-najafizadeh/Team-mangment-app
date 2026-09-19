import { Navigate } from 'react-router-dom';
import { getAccessToken } from '../utils/tokenManager';

/**
 * ProtectedRoute component that checks for authentication
 * Redirects to /login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    // Redirect to login if no access token
    return <Navigate to="/login" replace />;
  }

  // Render children if authenticated
  return children;
};

export default ProtectedRoute;

