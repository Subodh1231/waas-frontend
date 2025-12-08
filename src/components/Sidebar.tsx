import { useLocation } from 'react-router-dom';
import SidebarItem from './SidebarItem';
import { logout } from '../lib/auth';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/chats', label: 'Chats' },
    { path: '/appointments', label: 'Appointments' },
    { path: '/customers', label: 'Customers' },
    { path: '/services', label: 'Services' },
    { path: '/availability', label: 'Availability' },
    { path: '/settings', label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">WAAS</h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.path}
            to={item.path}
            label={item.label}
            active={location.pathname === item.path}
          />
        ))}
      </nav>

      {/* Logout Button - Separated at bottom */}
      <div className="p-4 border-t border-gray-200">
        <SidebarItem
          label="Logout"
          to=""
          active={false}
          onClick={handleLogout}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
