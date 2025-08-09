import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuthRoles from "@/hooks/useAuthRoles";

interface Props { children: ReactNode }

const RequireSuperadmin = ({ children }: Props) => {
  const { user, isSuperadmin, loading } = useAuthRoles();
  const location = useLocation();

  if (loading) return null;
  if (!user || !isSuperadmin) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};

export default RequireSuperadmin;
