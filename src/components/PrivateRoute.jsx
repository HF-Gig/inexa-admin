import { Navigate } from "react-router-dom";

// Replace this with your actual authentication check logic
const isAuthenticated = () => {
  // For example, check if a token exists in localStorage
  return !!localStorage.getItem("token");
};

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/signin" replace />;
};

export default PrivateRoute; 