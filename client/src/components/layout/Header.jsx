import { useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

// Map path prefixes to page titles
const TITLES = {
  '/dashboard':  'Dashboard',
  '/products':   'Products',
  '/categories': 'Categories',
  '/customers':  'Customers',
  '/suppliers':  'Suppliers',
  '/sales':      'Sales',
  '/purchases':  'Purchases',
  '/inventory':  'Inventory',
  '/reports':    'Reports',
  '/users':      'Users',
  '/profile':    'My Profile',
};

const Header = ({ onMenuClick }) => {
  const { logout, user } = useAuth();
  const { pathname }     = useLocation();
  const navigate         = useNavigate();

  const title = Object.entries(TITLES).find(([key]) => pathname.startsWith(key))?.[1] ?? 'Dashboard';

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden text-slate-500 hover:text-slate-700">
          <Bars3Icon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      </div>

      {/* Right: profile + logout */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-sm text-slate-600"
        >
          <UserCircleIcon className="w-5 h-5" />
          <span className="hidden sm:inline">{user?.name}</span>
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors text-sm"
          title="Logout"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
