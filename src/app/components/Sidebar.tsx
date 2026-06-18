import { ReactNode } from 'react';
import {
  LayoutDashboard,
  Car,
  Wrench,
  Bell,
  TrendingUp,
  Settings,
  LogOut
} from 'lucide-react';
import { UserProfile } from '../data/appTypes';
import { ProfileAvatar } from './ProfileAvatar';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  href: string;
}

interface SidebarProps {
  activeItem: string;
  onNavigate: (id: string) => void;
  profile: UserProfile;
  collapsed?: boolean;
  onLogout?: () => void;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '#' },
  { id: 'vehicles', label: 'My Vehicles', icon: <Car size={20} />, href: '#' },
  { id: 'service-history', label: 'Service History', icon: <Wrench size={20} />, href: '#' },
  { id: 'reminders', label: 'Reminders', icon: <Bell size={20} />, href: '#' },
  { id: 'expenses', label: 'Expenses & Analytics', icon: <TrendingUp size={20} />, href: '#' },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} />, href: '#' }
];

export function Sidebar({ activeItem, onNavigate, profile, collapsed = false, onLogout }: SidebarProps) {
  return (
    <aside
      className={`
        h-full bg-sidebar/95 backdrop-blur border-r border-sidebar-border/80 flex flex-col shadow-xl shadow-primary-700/5
        ${collapsed ? 'w-20' : 'w-60'}
        transition-all duration-300
      `}
    >
      <div className="p-6">
        <button
          type="button"
          aria-label="Go to dashboard"
          className={`flex items-center gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${collapsed ? 'justify-center' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-success-500 rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary-600/20">
            AC
          </div>
          {!collapsed && <h1 className="font-bold text-lg">AutoCare</h1>}
        </button>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg
              transition-colors
              ${activeItem === item.id
                ? 'bg-gradient-to-r from-primary-50 to-success-50 text-primary-700 font-medium border border-primary-500/10 shadow-sm'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/70'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-sidebar-accent/50 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <ProfileAvatar profile={profile} />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.name}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
          )}
        </button>

        <button
          onClick={onLogout}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg
            text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut size={20} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
