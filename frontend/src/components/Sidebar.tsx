import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  LogOut,
  Package2,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    // Close mobile drawer on nav click
    if (mobileOpen) onMobileClose();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          sidebar-root
          fixed top-0 left-0 z-50 h-screen flex flex-col
          lg:sticky lg:top-0 lg:z-auto
          transition-all duration-300 ease-in-out
          ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: '#ffffff', borderRight: '1px solid #e8e4dc' }}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between p-4 flex-shrink-0" style={{ borderBottom: '1px solid #e8e4dc' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 flex items-center justify-center flex-shrink-0"
              style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
            >
              <Package2 className="w-5 h-5" style={{ color: '#ea6a0a' }} />
            </div>
            {!collapsed && (
              <div className="min-w-0 overflow-hidden">
                <span className="font-bold text-base block truncate" style={{ color: '#1a1510' }}>
                  InventoryPro
                </span>
                <p className="text-[10px] leading-none mt-0.5" style={{ color: '#9a9088' }}>
                  Admin Portal
                </p>
              </div>
            )}
          </div>

          {/* Mobile close / Desktop collapse toggle */}
          <button
            onClick={mobileOpen ? onMobileClose : onToggle}
            className="hidden lg:flex items-center justify-center w-7 h-7 flex-shrink-0 transition-colors duration-200 hover:bg-stone-100"
            style={{ color: '#9a9088' }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            onClick={onMobileClose}
            className="lg:hidden flex items-center justify-center w-7 h-7 flex-shrink-0 transition-colors duration-200 hover:bg-stone-100"
            style={{ color: '#9a9088' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {!collapsed && (
            <p
              className="text-[10px] uppercase font-semibold tracking-widest px-3 mb-3"
              style={{ color: '#b0a898' }}
            >
              Main Menu
            </p>
          )}
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `${isActive ? 'nav-link-active' : 'nav-link'} ${collapsed ? 'justify-center' : ''}`
              }
            >
              <Icon className="flex-shrink-0" size={18} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid #e8e4dc' }}>
          {!collapsed && (
            <div
              className="flex items-center gap-3 p-3 mb-2"
              style={{ background: '#f5f3ef', border: '1px solid #e8e4dc' }}
            >
              <div
                className="w-8 h-8 flex items-center justify-center font-semibold text-sm flex-shrink-0"
                style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#ea6a0a' }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#1a1510' }}>
                  {user?.username}
                </p>
                <p className="text-xs truncate" style={{ color: '#9a9088' }}>
                  {user?.email}
                </p>
              </div>
            </div>
          )}

          {collapsed && (
            <div
              className="flex items-center justify-center w-8 h-8 mx-auto mb-2 font-semibold text-sm"
              style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#ea6a0a' }}
              title={user?.username}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
            style={{ color: '#7a7268', background: 'transparent' }}
            title={collapsed ? 'Sign out' : undefined}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.color = '#991b1b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#7a7268';
            }}
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
