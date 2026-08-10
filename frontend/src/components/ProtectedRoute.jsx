import { Navigate } from "react-router-dom";

import useAuth from "../hooks/useAuth";


function ProtectedRoute({
  children,
  allowedRoles = null,
}) {
  const {
    user,
    isAuthenticated,
    loading,
  } = useAuth();


  if (loading) {
    return (
      <div>
        Loading...
      </div>
    );
  }


  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(
      user?.role
    )
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  return children;
}


export default ProtectedRoute;