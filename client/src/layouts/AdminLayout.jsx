import { Outlet } from 'react-router-dom';
import AppShell from '../components/AppShell';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/employees', label: 'Employee Directory', icon: '🗂️' },
  { to: '/admin/attendance', label: 'Attendance Records', icon: '🕒' },
  { to: '/admin/leaves', label: 'Leave Approvals', icon: '✅' },
  { to: '/admin/payroll', label: 'Payroll', icon: '💰' },
];

export default function AdminLayout() {
  return (
    <AppShell title="HR / Admin Console" nav={NAV}>
      <Outlet />
    </AppShell>
  );
}
