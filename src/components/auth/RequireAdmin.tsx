import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuthRoles from "@/hooks/useAuthRoles";

interface Props {
  children: ReactNode;
}

const RequireAdmin = ({ children }: Props) => {
  const { user, isAdmin, loading } = useAuthRoles();
  const location = useLocation();

  if (loading) return null;
  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};

export default RequireAdmin;
