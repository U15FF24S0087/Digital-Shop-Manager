import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon, CubeIcon, TagIcon, UsersIcon, TruckIcon,
  ShoppingCartIcon, ShoppingBagIcon, ArchiveBoxIcon,
  ChartBarIcon, UserGroupIcon, XMarkIcon,
} from '@heroicons/react/24/outline';

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',  icon: HomeIcon,          perm: 'dashboard:read' },
  { to: '/products',   label: 'Products',   icon: CubeIcon,          perm: 'products:read' },
  { to: '/categories', label: 'Categories', icon: TagIcon,           perm: 'categories:read' },
  { to: '/customers',  label: 'Customers',  icon: UsersIcon,         perm: 'customers:read' },
  { to: '/suppliers',  label: 'Suppliers',  icon: TruckIcon,         perm: 'suppliers:read' },
  { to: '/sales',      label: 'Sales',      icon: ShoppingCartIcon,  perm: 'sales:read' },
  { to: '/purchases',  label: 'Purchases',  icon: ShoppingBagIcon,   perm: 'purchases:read' },
  { to: '/inventory',  label: 'Inventory',  icon: ArchiveBoxIcon,    perm: 'inventory:read' },
  { to: '/reports',    label: 'Reports',    icon: ChartBarIcon,      perm: 'reports:read' },
  { to: '/users',      label: 'Users',      icon: UserGroupIcon,     perm: 'users:read' },
];

const Sidebar = ({ open, onClose }) => {
  const { hasPermission, user } = useAuth();

  const visibleItems = NAV_ITEMS.filter(item => hasPermission(item.perm));

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-slate-900 text-white
        transform transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <CubeIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">DigitalShop</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-slate-700">
          <NavLink to="/profile" onClick={onClose}
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role?.name}</p>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
