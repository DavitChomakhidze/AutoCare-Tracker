import { useMemo, useState } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AppActions, AppNotification } from '../data/mockData';

type NotificationTab = 'All' | 'Unread' | 'Maintenance' | 'System';

export function Notifications({
  actions,
  notifications: sourceNotifications,
  readIds,
  onMarkRead,
  onMarkAllRead,
  onDelete
}: {
  actions: AppActions;
  notifications: AppNotification[];
  readIds: Set<string>;
  onMarkRead: (notificationId: string) => void;
  onMarkAllRead: () => void;
  onDelete: (notificationId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<NotificationTab>('All');

  const notifications = useMemo(
    () =>
      sourceNotifications.filter((item) => {
        const isRead = item.read || readIds.has(item.id);
        if (activeTab === 'Unread') return !isRead;
        if (activeTab === 'Maintenance') return item.category === 'Maintenance';
        if (activeTab === 'System') return item.category === 'System';
        return true;
      }),
    [activeTab, readIds, sourceNotifications]
  );

  const unreadCount = sourceNotifications.filter((item) => !item.read && !readIds.has(item.id)).length;
  const tabs: NotificationTab[] = ['All', 'Unread', 'Maintenance', 'System'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onMarkAllRead();
              actions.toast('success', 'All notifications marked as read.');
            }}
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3 border-b-2 rounded-none outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {notifications.map((notification) => {
          const isRead = notification.read || readIds.has(notification.id);

          return (
            <Card
              key={notification.id}
              padding="md"
              className={`hover:shadow-md transition-shadow cursor-pointer ${!isRead ? 'bg-primary-50/50 border-primary/20' : ''}`}
            >
              <div className="flex gap-4">
                <button
                  className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0"
                  onClick={() => onMarkRead(notification.id)}
                >
                  {notification.icon}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium">{notification.title}</h3>
                    <div className="flex items-center gap-3">
                      {!isRead && <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />}
                      <button
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          onDelete(notification.id);
                          actions.toast('success', 'Notification deleted.');
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notification.description}</p>
                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {notifications.length === 0 && (
        <Card padding="lg">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              There is nothing in this notification view.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
