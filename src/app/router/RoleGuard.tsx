import { Navigate, useLocation } from 'react-router-dom';
import { Fragment } from 'react';
import { useAppSelector } from '@/app/hooks';
import { localService } from '@/core/services/local';
import { roleHome, hasPermission } from '@/core/lib/permissions';

interface Props {
  children: React.ReactNode;
  roles?: string[];      // allowed roles; if omitted, any authenticated user
  permission?: string;   // required permission key (ADMIN/EMPLOYEE bypass)
}

/** Guards a route by authentication + (optionally) role and/or permission. */
export const RoleGuard: React.FC<Props> = ({ children, roles, permission }) => {
  const { token: reduxToken, user } = useAppSelector((s) => s.auth);
  const location = useLocation();
  const token = reduxToken || localService.getToken();

  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;

  const role = (user?.role || 'USER').toUpperCase();

  if (roles && roles.length) {
    if (!roles.map((r) => r.toUpperCase()).includes(role)) {
      return <Navigate to={roleHome(role)} replace />;
    }
  }

  if (permission && !hasPermission(user, permission)) {
    return <Navigate to={roleHome(role)} replace />;
  }

  return <Fragment>{children}</Fragment>;
};
