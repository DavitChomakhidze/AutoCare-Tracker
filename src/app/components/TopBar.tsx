import { useState } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { AppNotification, UserProfile } from '../data/appTypes';
import { ProfileAvatar } from './ProfileAvatar';

interface TopBarProps {
  title: string;
  breadcrumbs?: string[];
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
  onNavigate?: (id: string) => void;
  onSearchClick?: () => void;
  profile: UserProfile;
  showNotifications?: boolean;
  notifications: AppNotification[];
  notificationReadIds: Set<string>;
  notificationCount?: number;
  onMarkNotificationRead: (notificationId: string) => void;
  onMarkAllNotificationsRead: () => void;
}

export function TopBar({
  title,
  breadcrumbs,
  onMenuClick,
  isMenuOpen = false,
  onNavigate,
  onSearchClick,
  profile,
  showNotifications = true,
  notifications,
  notificationReadIds,
  notificationCount = 0,
  onMarkNotificationRead,
  onMarkAllNotificationsRead
}: TopBarProps) {
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const previewNotifications = notifications.slice(0, 4);

  return (
    <header className="relative z-[200] h-16 bg-card/90 backdrop-blur border-b border-border/80 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            className="lg:hidden flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-accent hover:text-primary"
          >
            <Menu size={24} />
          </button>
        )}

        <div>
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}
                  <span>{crumb}</span>
                </span>
              ))}
            </div>
          ) : null}
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onSearchClick}
          className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors hidden md:flex items-center justify-center"
        >
          <Search size={20} />
        </button>

        {showNotifications && (
          <div className="relative">
            <button
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              className="relative w-9 h-9 rounded-lg bg-warning-50 text-warning-700 hover:bg-warning-100 transition-colors flex items-center justify-center"
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {showNotificationDropdown && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-popover/95 backdrop-blur border border-border rounded-lg shadow-lg z-[1000] overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    {notificationCount > 0 && (
                      <button
                        className="text-sm text-primary hover:underline"
                        onClick={onMarkAllNotificationsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {previewNotifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    previewNotifications.map((notification) => {
                      const isRead = notification.read || notificationReadIds.has(notification.id);

                      return (
                        <button
                          key={notification.id}
                          className={`w-full p-4 text-left hover:bg-accent cursor-pointer border-b border-border last:border-b-0 ${!isRead ? 'bg-primary-50/50' : ''}`}
                          onClick={() => onMarkNotificationRead(notification.id)}
                        >
                          <div className="flex gap-3">
                            <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                              {notification.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-2">
                                <p className="text-sm font-medium mb-1 flex-1">{notification.title}</p>
                                {!isRead && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{notification.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="p-3 border-t border-border text-center">
                  <button
                    className="text-sm text-primary hover:underline"
                    onClick={() => {
                      onNavigate?.('notifications');
                      setShowNotificationDropdown(false);
                    }}
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => onNavigate?.('settings')}
          className="rounded-full"
        >
          <ProfileAvatar profile={profile} size="md" />
        </button>
      </div>
    </header>
  );
}
