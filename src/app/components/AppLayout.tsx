import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { GlobalSearch } from './GlobalSearch';
import { AppNotification, Reminder, ServiceRecord, UserProfile, Vehicle } from '../data/appTypes';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  breadcrumbs?: string[];
  activeNav: string;
  profile: UserProfile;
  hasVehicles?: boolean;
  vehicles: Vehicle[];
  serviceRecords: ServiceRecord[];
  reminders: Reminder[];
  notifications: AppNotification[];
  notificationReadIds: Set<string>;
  notificationCount: number;
  onMarkNotificationRead: (notificationId: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNavigate: (id: string) => void;
  onLogout?: () => void;
}

export function AppLayout({
  children,
  title,
  breadcrumbs,
  activeNav,
  profile,
  hasVehicles = true,
  vehicles,
  serviceRecords,
  reminders,
  notifications,
  notificationReadIds,
  notificationCount,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigate,
  onLogout
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden modern-page-bg">
      <div className="hidden lg:block">
        <Sidebar
          activeItem={activeNav}
          onNavigate={onNavigate}
          profile={profile}
          collapsed={sidebarCollapsed}
          onLogout={onLogout}
        />
      </div>

      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="absolute left-0 top-0 bottom-0">
            <Sidebar
              activeItem={activeNav}
              profile={profile}
              onNavigate={(id) => {
                onNavigate(id);
                setShowMobileMenu(false);
              }}
              onLogout={onLogout}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title={title}
          breadcrumbs={breadcrumbs}
          onMenuClick={() => setShowMobileMenu(true)}
          onSearchClick={() => setShowGlobalSearch(true)}
          notifications={notifications}
          notificationReadIds={notificationReadIds}
          notificationCount={notificationCount}
          onMarkNotificationRead={onMarkNotificationRead}
          onMarkAllNotificationsRead={onMarkAllNotificationsRead}
          onNavigate={onNavigate}
          profile={profile}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      <MobileBottomNav
        activeItem={activeNav}
        onNavigate={onNavigate}
        onAddClick={() => setShowAddMenu(!showAddMenu)}
      />

      {showAddMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setShowAddMenu(false)}
        >
          <div
            className="absolute bottom-20 right-4 bg-card/95 backdrop-blur rounded-lg shadow-xl border border-border p-2 w-48"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-3 hover:bg-accent rounded-lg transition-colors"
              onClick={() => {
                onNavigate('vehicles');
                setShowAddMenu(false);
              }}
            >
              Add vehicle
            </button>
            {hasVehicles && (
              <button
                className="w-full text-left px-4 py-3 hover:bg-accent rounded-lg transition-colors"
                onClick={() => {
                  onNavigate('add-service');
                  setShowAddMenu(false);
                }}
              >
                Add service record
              </button>
            )}
            <button
              className="w-full text-left px-4 py-3 hover:bg-accent rounded-lg transition-colors"
              onClick={() => {
                onNavigate('reminders');
                setShowAddMenu(false);
              }}
            >
              Add reminder
            </button>
          </div>
        </div>
      )}

      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onNavigate={onNavigate}
        vehicles={vehicles}
        serviceRecords={serviceRecords}
        reminders={reminders}
      />
    </div>
  );
}
