import { Navigate, Outlet } from 'react-router-dom';

import { useAppStore } from '../../store/useAppStore';

export const AdminRoute = () => {
  const user = useAppStore((state) => state.user);

  if (user?.role !== 'admin') {
    return <Navigate replace to="/dashboard" />;
  }

  return <Outlet />;
};