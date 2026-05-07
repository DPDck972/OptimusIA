import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const ProtectedRoute = ({ children }) => {
  const { userName } = useContext(UserContext);

  if (!userName || userName === "") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
