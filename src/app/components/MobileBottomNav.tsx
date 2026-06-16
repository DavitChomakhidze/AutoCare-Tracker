import { ReactNode } from 'react';
import { Home, Car, Plus, Bell, Menu } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface MobileBottomNavProps {
  activeItem: string;
  onNavigate: (id: string) => void;
  onAddClick: () => void;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: <Home size={22} /> },
  { id: 'vehicles', label: 'Vehicles', icon: <Car size={22} /> },
  { id: 'add', label: 'Add', icon: <Plus size={22} /> },
  { id: 'reminders', label: 'Reminders', icon: <Bell size={22} /> },
  { id: 'more', label: 'More', icon: <Menu size={22} /> }
];

export function MobileBottomNav({ activeItem, onNavigate, onAddClick }: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border/80 h-16 flex items-center justify-around px-2 lg:hidden z-40 shadow-2xl shadow-primary-700/10">
      {navItems.map((item) => {
        const isAdd = item.id === 'add';
        const isActive = activeItem === item.id;

        if (isAdd) {
          return (
            <button
              key={item.id}
              onClick={onAddClick}
              className="flex flex-col items-center justify-center w-14 h-14 -mt-6 bg-gradient-to-br from-primary-600 to-success-500 text-primary-foreground rounded-full shadow-lg shadow-primary-600/25 hover:-translate-y-0.5 transition-all"
            >
              {item.icon}
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors
              ${isActive ? 'text-primary bg-primary-50 rounded-lg' : 'text-muted-foreground'}
            `}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
