import { Link } from 'react-router-dom';

interface SidebarItemProps {
  label: string;
  to: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ label, to, active, onClick }) => {
  const className = `block px-4 py-3 rounded-md transition ${
    active
      ? 'bg-gray-200 text-gray-900 font-semibold'
      : 'text-gray-700 hover:bg-gray-100'
  }`;

  // If onClick is provided, render as a button (for logout)
  if (onClick) {
    return (
      <div
        onClick={onClick}
        className={`${className} cursor-pointer`}
      >
        {label}
      </div>
    );
  }

  // Otherwise, render as a Link (for navigation)
  return (
    <Link to={to} className={className}>
      {label}
    </Link>
  );
};

export default SidebarItem;