import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MobileNavigation from '../components/MobileNavigation';

const DashboardLayout = () => {
  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden lg:flex-row">
      <MobileNavigation />
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
