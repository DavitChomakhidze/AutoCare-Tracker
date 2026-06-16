import { useCallback, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { AlertCircle, Bell, CheckCircle, Wrench } from 'lucide-react';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { MyVehicles } from './pages/MyVehicles';
import { VehicleDetails } from './pages/VehicleDetails';
import { ServiceHistory } from './pages/ServiceHistory';
import { AddServiceRecord } from './pages/AddServiceRecord';
import { Reminders } from './pages/Reminders';
import { ExpensesAnalytics } from './pages/ExpensesAnalytics';
import { Settings } from './pages/Settings';
import { Notifications } from './pages/Notifications';
import { ServiceQueue } from './pages/ServiceQueue';
import { MonthlyExpenses } from './pages/MonthlyExpenses';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Welcome } from './pages/Welcome';
import { AddFirstVehicle } from './pages/AddFirstVehicle';
import { Toast } from './components/Toast';
import { LoadingPage } from './components/LoadingState';
import { AppActions, AppNotification, Page, Reminder, ServiceRecord, ToastType, UserProfile, Vehicle, vehicleName } from './data/mockData';
import { authStorageKey, supabase } from './lib/supabase';
import {
  getProfile,
  repairOversizedAuthMetadata,
  signIn,
  signOut,
  signUp,
  resetPassword,
  signOutEverywhere,
  updatePassword as updateAccountPassword,
  updateProfile as updateAccountProfile,
  uploadAvatar
} from './services/authService';
import { createVehicle, deleteVehicle, getVehicles, updateVehicle } from './services/vehicleService';
import {
  createServiceRecord,
  deleteServiceRecord,
  getServiceRecords,
  updateServiceRecord
} from './services/serviceRecordService';
import {
  completeReminder as completeReminderRequest,
  createReminder,
  deleteReminder,
  getReminders,
  updateReminder
} from './services/reminderService';

const publicPages: Page[] = ['landing', 'login', 'register', 'forgot-password'];
const authRedirectPages: Page[] = ['landing', 'login', 'register', 'forgot-password'];

const pagePaths: Record<Page, string> = {
  landing: '/',
  login: '/login',
  register: '/register',
  'forgot-password': '/forgot-password',
  welcome: '/welcome',
  'add-first-vehicle': '/add-first-vehicle',
  dashboard: '/dashboard',
  vehicles: '/vehicles',
  'vehicle-details': '/vehicles',
  'upcoming-services': '/services/upcoming',
  'overdue-services': '/services/overdue',
  'monthly-expenses': '/expenses/monthly',
  'service-history': '/service-history',
  'add-service': '/service-history/add',
  reminders: '/reminders',
  expenses: '/expenses',
  settings: '/settings',
  notifications: '/notifications'
};

const pathPages = Object.entries(pagePaths).reduce(
  (acc, [page, path]) => ({ ...acc, [path]: page as Page }),
  {} as Record<string, Page>
);

function pageFromPath(pathname: string): Page {
  if (pathname.startsWith('/vehicles/') && pathname !== '/vehicles/') {
    return 'vehicle-details';
  }

  return pathPages[pathname] || 'landing';
}

function isPublicPage(page: Page) {
  return publicPages.includes(page);
}

function loginRequiredMessage(page: Page) {
  if (page === 'welcome' || page === 'add-first-vehicle' || page === 'vehicles') {
    return 'Please log in before adding vehicles.';
  }
  return 'Please log in to continue.';
}

function vehicleIdFromPath(pathname: string) {
  if (!pathname.startsWith('/vehicles/') || pathname === '/vehicles/') return '';
  return decodeURIComponent(pathname.replace('/vehicles/', '').split('/')[0]);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function isNetworkError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /failed to fetch|network|connection|err_connection/i.test(error.message);
}

function clearLocalSupabaseAuthTokens({ includeCurrentKey = false } = {}) {
  Object.keys(localStorage)
    .filter((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))
    .forEach((key) => {
      if (key === authStorageKey && !includeCurrentKey) {
        return;
      }

      localStorage.removeItem(key);
    });
}

function sessionHasOversizedAuthHeader(session: Session | null) {
  if (!session) return false;
  const metadata = session.user.user_metadata || {};
  const imageValues = [metadata.avatar_url, metadata.picture, metadata.image];
  return (
    session.access_token.length > 12000 ||
    imageValues.some((value) => typeof value === 'string' && (value.startsWith('data:') || value.length > 1000))
  );
}

function oversizedSessionMessage(session: Session | null) {
  if (!session) return 'Your login session expired. Please log in again before saving.';
  const metadata = session.user.user_metadata || {};
  const imageValues = [metadata.avatar_url, metadata.picture, metadata.image];
  if (imageValues.some((value) => typeof value === 'string' && value.startsWith('data:'))) {
    return 'Your account still has an old inline profile photo in Supabase auth metadata. Apply the schema cleanup SQL, then log out and log in again.';
  }
  if (imageValues.some((value) => typeof value === 'string' && value.length > 1000)) {
    return 'Your account still has oversized avatar metadata. Apply the schema cleanup SQL, then log out and log in again.';
  }
  return 'Your login session is too large. Apply the schema cleanup SQL, then log out and log in again.';
}

function nameFromEmail(email: string) {
  return email.split('@')[0] || 'User';
}

function profileFromUser(user: User): UserProfile {
  const email = user.email || '';
  const metadataName = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.trim() : '';
  const metadataAvatar = typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null;

  return {
    name: metadataName || nameFromEmail(email),
    email,
    avatarUrl: metadataAvatar?.startsWith('data:') ? null : metadataAvatar
  };
}

function relativeNotificationTime(value?: string) {
  if (!value) return 'Just now';

  const timestamp = new Date(value).getTime();
  if (!timestamp) return 'Just now';

  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function reminderNotificationTitle(reminder: Reminder) {
  if (reminder.isCompleted) return `${reminder.title} completed`;
  if (reminder.status === 'overdue') return `${reminder.title} is overdue`;
  if (reminder.status === 'due-soon') return `${reminder.title} is due soon`;
  return `${reminder.title} reminder`;
}

export default function App() {
  const initialPage = pageFromPath(window.location.pathname);
  const [currentPage, setCurrentPage] = useState<Page>(initialPage);
  const [session, setSession] = useState<Session | null>(null);
  const [accountProfile, setAccountProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [reminderVehicleId, setReminderVehicleId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleIdFromPath(window.location.pathname));
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notificationReadIds, setNotificationReadIds] = useState(() => new Set<string>());
  const [deletedNotificationIds, setDeletedNotificationIds] = useState(() => new Set<string>());

  const showPage = useCallback((page: Page, replace = false) => {
    setCurrentPage(page);

    const path = pagePaths[page];
    const state = { page };
    if (replace) {
      window.history.replaceState(state, '', path);
      return;
    }
    if (window.location.pathname !== path) {
      window.history.pushState(state, '', path);
    }
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    setDataLoading(true);
    try {
      const [nextVehicles, nextServiceRecords, nextReminders] = await Promise.all([
        getVehicles(userId),
        getServiceRecords(userId),
        getReminders(userId)
      ]);

      setVehicles(nextVehicles);
      setServiceRecords(nextServiceRecords);
      setReminders(nextReminders);
      setSelectedVehicleId((currentSelectedId) => {
        if (currentSelectedId && nextVehicles.some((vehicle) => vehicle.id === currentSelectedId)) return currentSelectedId;
        return nextVehicles[0]?.id || '';
      });
    } catch (error) {
      setToast({ type: 'error', message: `Could not load your data: ${errorMessage(error)}` });
    } finally {
      setDataLoading(false);
    }
  }, []);

  const loadAccountProfile = useCallback(async (user: User) => {
    const fallbackProfile = profileFromUser(user);
    setAccountProfile(fallbackProfile);

    try {
      const profile = await getProfile(user.id);
      if (!profile?.display_name && !profile?.avatar_url) return;

      setAccountProfile({
        ...fallbackProfile,
        name: profile.display_name || fallbackProfile.name,
        avatarUrl: profile.avatar_url || null
      });
    } catch (error) {
      setToast({ type: 'error', message: `Could not load your profile: ${errorMessage(error)}` });
    }
  }, []);

  const requireFreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    let freshSession = error ? null : data.session;

    if (!freshSession && session && !sessionHasOversizedAuthHeader(session)) {
      const refreshed = await supabase.auth.refreshSession({
        refresh_token: session.refresh_token
      });

      if (refreshed.data.session) {
        freshSession = refreshed.data.session;
      } else {
        const restored = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
        freshSession = restored.error ? null : restored.data.session;
      }
    }

    if (!freshSession || sessionHasOversizedAuthHeader(freshSession)) {
      setToast({ type: 'warning', message: oversizedSessionMessage(freshSession) });
      return null;
    }

    if (freshSession.access_token !== session?.access_token || freshSession.user.id !== session?.user.id) {
      setSession(freshSession);
      await loadAccountProfile(freshSession.user);
    }

    return freshSession;
  }, [loadAccountProfile, session]);

  useEffect(() => {
    const page = pageFromPath(window.location.pathname);
    setCurrentPage(page);
    if (page === 'vehicle-details') {
      setSelectedVehicleId(vehicleIdFromPath(window.location.pathname));
    }
    window.history.replaceState({ page }, '', window.location.pathname);

    const handlePopState = () => {
      const nextPage = pageFromPath(window.location.pathname);
      setCurrentPage(nextPage);
      if (nextPage === 'vehicle-details') {
        setSelectedVehicleId(vehicleIdFromPath(window.location.pathname));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setToast({ type: 'error', message: `Could not restore session: ${error.message}` });
      }
      if (sessionHasOversizedAuthHeader(data.session)) {
        repairOversizedAuthMetadata()
          .then((repairedSession) => {
            if (!mounted) return;
            setSession(repairedSession);
            if (repairedSession) {
              loadAccountProfile(repairedSession.user);
            }
            setAuthLoading(false);
          })
          .catch((repairError) => {
            if (!mounted) return;
            setSession(data.session);
            setAuthLoading(false);
            setToast({ type: 'error', message: `Could not repair oversized auth metadata: ${errorMessage(repairError)}` });
          });
        return;
      }
      setSession(data.session);
      if (data.session) {
        loadAccountProfile(data.session.user);
      }
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (sessionHasOversizedAuthHeader(nextSession)) {
        repairOversizedAuthMetadata()
          .then((repairedSession) => {
            if (!mounted) return;
            setSession(repairedSession);
            if (repairedSession) {
              loadAccountProfile(repairedSession.user);
            } else {
              setAccountProfile(null);
            }
          })
          .catch((repairError) => {
            if (!mounted) return;
            setSession(nextSession);
            setToast({ type: 'error', message: `Could not repair oversized auth metadata: ${errorMessage(repairError)}` });
          });
        return;
      }
      setSession(nextSession);
      if (nextSession) {
        loadAccountProfile(nextSession.user);
      } else {
        setAccountProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadAccountProfile, showPage]);

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      setVehicles([]);
      setServiceRecords([]);
      setReminders([]);
      setAccountProfile(null);
      setSelectedVehicleId('');
      if (!isPublicPage(currentPage)) {
        showPage('login', true);
      }
      return;
    }

    loadUserData(session.user.id);
    if (authRedirectPages.includes(currentPage)) {
      showPage('dashboard', true);
    }
  }, [authLoading, currentPage, loadUserData, session, showPage]);

  const actions: AppActions = useMemo(
    () => ({
      navigate: (page) => {
        if (!session && !isPublicPage(page)) {
          setToast({ type: 'warning', message: loginRequiredMessage(page) });
          showPage('login');
          return;
        }
        showPage(page);
      },
      openVehicleDetails: (vehicleId) => {
        setSelectedVehicleId(vehicleId);
        setCurrentPage('vehicle-details');
        window.history.pushState({ page: 'vehicle-details', vehicleId }, '', `/vehicles/${encodeURIComponent(vehicleId)}`);
      },
      login: async (email, password) => {
        try {
          const data = await signIn(email, password);
          const repairedSession = sessionHasOversizedAuthHeader(data.session) ? await repairOversizedAuthMetadata() : data.session;
          if (repairedSession) {
            setSession(repairedSession);
            await loadAccountProfile(repairedSession.user);
            await loadUserData(repairedSession.user.id);
          }
          showPage('dashboard');
          setToast({ type: 'success', message: 'Welcome back.' });
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Login failed: ${errorMessage(error)}` });
          return false;
        }
      },
      register: async (name, email, password) => {
        try {
          const data = await signUp(email, password, name);
          if (data.session) {
            setSession(data.session);
            setAccountProfile({ name, email, avatarUrl: null });
            await loadUserData(data.session.user.id);
          }
          showPage(data.session ? 'welcome' : 'login');
          setToast({
            type: 'success',
            message: data.session ? 'Account created. Welcome to AutoCare Tracker.' : 'Account created. Check your email to confirm it, then log in.'
          });
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Registration failed: ${errorMessage(error)}` });
          return false;
        }
      },
      resetPassword: async (email) => {
        try {
          await resetPassword(email);
          setToast({ type: 'success', message: 'Password reset email sent.' });
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Password reset failed: ${errorMessage(error)}` });
          return false;
        }
      },
      uploadAvatar: async (file) => {
        if (!session) return null;
        try {
          return await uploadAvatar(session.user.id, file);
        } catch (error) {
          setToast({ type: 'error', message: `Photo could not be uploaded: ${errorMessage(error)}` });
          return null;
        }
      },
      updateProfile: async (profile) => {
        if (!session) return false;
        try {
          await updateAccountProfile(session.user.id, profile.name, profile.email, profile.avatarUrl);
          setAccountProfile(profile);
          setToast({ type: 'success', message: 'Profile changes saved.' });
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Profile could not be updated: ${errorMessage(error)}` });
          return false;
        }
      },
      updatePassword: async (currentPassword, newPassword) => {
        if (!session?.user.email) return false;
        try {
          await updateAccountPassword(session.user.email, currentPassword, newPassword);
          setToast({ type: 'success', message: 'Password updated.' });
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Password could not be updated: ${errorMessage(error)}` });
          return false;
        }
      },
      logOutEverywhere: async () => {
        let signedOut = true;
        try {
          await signOutEverywhere();
        } catch (error) {
          signedOut = false;
          setToast({ type: 'error', message: `Could not log out everywhere: ${errorMessage(error)}` });
        }

        setSession(null);
        setVehicles([]);
        setServiceRecords([]);
        setReminders([]);
        setSelectedVehicleId('');
        setAccountProfile(null);
        clearLocalSupabaseAuthTokens({ includeCurrentKey: true });
        showPage('landing');
        if (signedOut) setToast({ type: 'info', message: 'You have been logged out from all devices.' });
        return signedOut;
      },
      deleteAllData: async () => {
        if (!session) return false;
        try {
          await Promise.all(vehicles.map((vehicle) => deleteVehicle(vehicle.id, session.user.id)));
          setVehicles([]);
          setServiceRecords([]);
          setReminders([]);
          setSelectedVehicleId('');
          setToast({ type: 'success', message: 'All stored vehicle data deleted.' });
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Data could not be deleted: ${errorMessage(error)}` });
          return false;
        }
      },
      logout: async () => {
        let signedOut = true;
        try {
          await signOut();
        } catch (error) {
          signedOut = false;
          setToast({ type: 'error', message: `Logout failed: ${errorMessage(error)}` });
        }

        setSession(null);
        setVehicles([]);
        setServiceRecords([]);
        setReminders([]);
        setAccountProfile(null);
        setSelectedVehicleId('');
        clearLocalSupabaseAuthTokens({ includeCurrentKey: true });
        showPage('landing');
        if (signedOut) setToast({ type: 'info', message: 'You have been logged out.' });
      },
      toast: (type, message) => setToast({ type, message }),
      addVehicle: async (vehicle) => {
        if (!session) {
          setToast({ type: 'warning', message: 'Please log in before saving vehicles.' });
          showPage('login');
          return false;
        }

        const freshSession = await requireFreshSession();
        if (!freshSession) return false;

        try {
          const savedVehicle = await createVehicle(vehicle, freshSession.user.id);
          const nextVehicles = await getVehicles(freshSession.user.id);
          setVehicles(nextVehicles);
          setSelectedVehicleId(savedVehicle.id);
          return true;
        } catch (error) {
          setToast({
            type: 'error',
            message: isNetworkError(error)
              ? 'Vehicle could not be saved because the connection to Supabase was interrupted. Check your internet/VPN/firewall and try again.'
              : `Vehicle could not be saved: ${errorMessage(error)}`
          });
          return false;
        }
      },
      updateVehicle: async (updatedVehicle) => {
        const freshSession = await requireFreshSession();
        if (!freshSession || !vehicles.some((vehicle) => vehicle.id === updatedVehicle.id)) return false;
        try {
          const savedVehicle = await updateVehicle(updatedVehicle, freshSession.user.id);
          setVehicles((currentVehicles) =>
            currentVehicles.map((vehicle) => (vehicle.id === savedVehicle.id ? savedVehicle : vehicle))
          );
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Vehicle could not be updated: ${errorMessage(error)}` });
          return false;
        }
      },
      deleteVehicle: async (vehicleId) => {
        const freshSession = await requireFreshSession();
        if (!freshSession || !vehicles.some((vehicle) => vehicle.id === vehicleId)) return false;
        try {
          await deleteVehicle(vehicleId, freshSession.user.id);
          const nextVehicles = vehicles.filter((vehicle) => vehicle.id !== vehicleId);
          setVehicles(nextVehicles);
          setServiceRecords((currentRecords) => currentRecords.filter((record) => record.vehicleId !== vehicleId));
          setReminders((currentReminders) => currentReminders.filter((reminder) => reminder.vehicleId !== vehicleId));
          setSelectedVehicleId((currentSelectedId) => {
            if (currentSelectedId !== vehicleId) return currentSelectedId;
            return nextVehicles[0]?.id || '';
          });
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Vehicle could not be deleted: ${errorMessage(error)}` });
          return false;
        }
      },
      addService: async (record) => {
        if (!session) return false;
        try {
          const savedRecord = await createServiceRecord(record, session.user.id);
          setServiceRecords((currentRecords) => [savedRecord, ...currentRecords]);
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Service record could not be saved: ${errorMessage(error)}` });
          return false;
        }
      },
      updateService: async (record) => {
        if (!session || !serviceRecords.some((serviceRecord) => serviceRecord.id === record.id)) return false;
        try {
          const savedRecord = await updateServiceRecord(record, session.user.id);
          setServiceRecords((currentRecords) =>
            currentRecords.map((serviceRecord) => (serviceRecord.id === savedRecord.id ? savedRecord : serviceRecord))
          );
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Service record could not be updated: ${errorMessage(error)}` });
          return false;
        }
      },
      deleteService: async (serviceId) => {
        if (!session || !serviceRecords.some((serviceRecord) => serviceRecord.id === serviceId)) return false;
        try {
          await deleteServiceRecord(serviceId, session.user.id);
          setServiceRecords((currentRecords) => currentRecords.filter((serviceRecord) => serviceRecord.id !== serviceId));
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Service record could not be deleted: ${errorMessage(error)}` });
          return false;
        }
      },
      addReminder: async (reminder) => {
        if (!session) return false;
        try {
          const savedReminder = await createReminder({ ...reminder, isCompleted: false }, session.user.id);
          setReminders((currentReminders) => [savedReminder, ...currentReminders]);
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Reminder could not be saved: ${errorMessage(error)}` });
          return false;
        }
      },
      updateReminder: async (reminder) => {
        if (!session || !reminders.some((currentReminder) => currentReminder.id === reminder.id)) return false;
        try {
          const savedReminder = await updateReminder(reminder, session.user.id);
          setReminders((currentReminders) =>
            currentReminders.map((currentReminder) => (currentReminder.id === savedReminder.id ? savedReminder : currentReminder))
          );
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Reminder could not be updated: ${errorMessage(error)}` });
          return false;
        }
      },
      deleteReminder: async (reminderId) => {
        if (!session || !reminders.some((reminder) => reminder.id === reminderId)) return false;
        try {
          await deleteReminder(reminderId, session.user.id);
          setReminders((currentReminders) => currentReminders.filter((reminder) => reminder.id !== reminderId));
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Reminder could not be deleted: ${errorMessage(error)}` });
          return false;
        }
      },
      completeReminder: async (reminderId) => {
        if (!session || !reminders.some((reminder) => reminder.id === reminderId)) return false;
        try {
          const savedReminder = await completeReminderRequest(reminderId, session.user.id);
          setReminders((currentReminders) =>
            currentReminders.map((reminder) => (reminder.id === savedReminder.id ? savedReminder : reminder))
          );
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Reminder could not be completed: ${errorMessage(error)}` });
          return false;
        }
      },
      addServiceRecord: async (record) => {
        if (!session) return false;
        try {
          const savedRecord = await createServiceRecord(record, session.user.id);
          setServiceRecords((currentRecords) => [savedRecord, ...currentRecords]);
          return true;
        } catch (error) {
          setToast({ type: 'error', message: `Service record could not be saved: ${errorMessage(error)}` });
          return false;
        }
      },
      editServiceRecord: (recordId) => {
        setEditingServiceId(recordId);
        showPage('add-service');
      },
      createReminderForVehicle: (vehicleId) => {
        setReminderVehicleId(vehicleId);
        showPage('reminders');
      }
    }),
    [loadAccountProfile, loadUserData, reminders, requireFreshSession, serviceRecords, session, showPage, vehicles]
  );

  const handleNavigate = (page: string) => {
    if (page.startsWith('vehicle:')) {
      const vehicleId = page.replace('vehicle:', '');
      const vehicle = vehicles.find((item) => item.id === vehicleId);
      if (vehicle) {
        setSelectedVehicleId(vehicle.id);
        setCurrentPage('vehicle-details');
        window.history.pushState({ page: 'vehicle-details', vehicleId: vehicle.id }, '', `/vehicles/${encodeURIComponent(vehicle.id)}`);
      }
      return;
    }

    const pageMap: { [key: string]: Page } = {
      dashboard: 'dashboard',
      home: 'dashboard',
      vehicles: 'vehicles',
      'service-history': 'service-history',
      reminders: 'reminders',
      expenses: 'expenses',
      more: 'settings',
      settings: 'settings',
      notifications: 'notifications',
      'add-service': 'add-service',
      'vehicle-details': 'vehicle-details',
      'upcoming-services': 'upcoming-services',
      'overdue-services': 'overdue-services',
      'monthly-expenses': 'monthly-expenses'
    };

    const targetPage = pageMap[page] || 'dashboard';
    showPage(targetPage);
  };

  if (authLoading) {
    return <LoadingPage />;
  }

  if (!session) {
    let page = <Login actions={actions} />;
    if (currentPage === 'register') page = <Register actions={actions} />;
    if (currentPage === 'forgot-password') page = <ForgotPassword actions={actions} />;
    if (currentPage === 'landing') page = <LandingPage actions={actions} />;

    return (
      <>
        {page}
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </>
    );
  }

  const currentProfile = accountProfile || profileFromUser(session.user);
  const firstName = currentProfile.name.trim().split(/\s+/)[0] || currentProfile.name;

  const pageConfig = {
    dashboard: { title: `Welcome ${firstName}`, breadcrumbs: [] },
    welcome: { title: `Welcome ${firstName}`, breadcrumbs: [] },
    'add-first-vehicle': { title: 'Add First Vehicle', breadcrumbs: [] },
    vehicles: { title: 'My Vehicles', breadcrumbs: [] },
    'vehicle-details': {
      title: 'Vehicle Details',
      breadcrumbs: ['My Vehicles', vehicles.length ? vehicleName(vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || vehicles[0]) : 'Vehicle']
    },
    'upcoming-services': { title: 'Upcoming Services', breadcrumbs: ['Dashboard', 'Upcoming Services'] },
    'overdue-services': { title: 'Overdue Services', breadcrumbs: ['Dashboard', 'Overdue Services'] },
    'monthly-expenses': { title: 'Expenses This Month', breadcrumbs: ['Dashboard', 'Expenses This Month'] },
    'service-history': { title: 'Service History', breadcrumbs: [] },
    'add-service': { title: 'Add Service Record', breadcrumbs: ['Service History', 'Add Record'] },
    reminders: { title: 'Reminders', breadcrumbs: [] },
    expenses: { title: 'Expenses & Analytics', breadcrumbs: [] },
    settings: { title: 'Settings', breadcrumbs: [] },
    notifications: { title: 'Notifications', breadcrumbs: [] }
  };

  const config = pageConfig[currentPage as keyof typeof pageConfig] || pageConfig.dashboard;
  const generatedNotifications: AppNotification[] = (() => {
    const reminderNotifications = reminders.flatMap((reminder) => {
      const vehicle = vehicles.find((item) => item.id === reminder.vehicleId);
      if (!vehicle) return [];

      const status = reminder.status;
      const shouldNotify = reminder.isCompleted || status === 'overdue' || status === 'due-soon';
      if (!shouldNotify) return [];

      return [{
        id: `reminder-${reminder.id}-${reminder.isCompleted ? 'completed' : status || 'active'}`,
        icon: reminder.isCompleted ? <CheckCircle size={20} className="text-success-500" /> : <AlertCircle size={20} className={status === 'overdue' ? 'text-danger-500' : ''} />,
        title: reminderNotificationTitle(reminder),
        description: `${vehicleName(vehicle)} - ${vehicle.plate}`,
        time: relativeNotificationTime(reminder.completedAt || reminder.updatedAt || reminder.createdAt),
        read: false,
        category: 'Maintenance' as const
      }];
    });

    const serviceNotifications = serviceRecords.slice(0, 3).map((record) => ({
      id: `service-${record.id}`,
      icon: <Wrench size={20} className="text-success-500" />,
      title: 'Service record added',
      description: `${record.type} for ${record.vehicle}`,
      time: relativeNotificationTime(record.createdAt || record.date),
      read: false,
      category: 'System' as const
    }));

    if (vehicles.length === 0) {
      return [];
    }

    if (reminderNotifications.length === 0 && serviceNotifications.length === 0) {
      return [{
        id: 'system-all-caught-up',
        icon: <Bell size={20} />,
        title: 'All caught up',
        description: 'No overdue or due-soon maintenance reminders right now.',
        time: 'Just now',
        read: true,
        category: 'System' as const
      }];
    }

    return [...reminderNotifications, ...serviceNotifications];
  })();

  const notifications = generatedNotifications.filter((item) => !deletedNotificationIds.has(item.id));
  const unreadNotificationCount = notifications.filter((item) => !item.read && !notificationReadIds.has(item.id)).length;
  const markNotificationRead = (notificationId: string) => {
    setNotificationReadIds((currentIds) => new Set(currentIds).add(notificationId));
  };
  const markAllNotificationsRead = () => {
    setNotificationReadIds(new Set(generatedNotifications.map((item) => item.id)));
  };
  const deleteNotification = (notificationId: string) => {
    setDeletedNotificationIds((currentIds) => new Set(currentIds).add(notificationId));
  };

  const renderPage = () => {
    if (dataLoading) return <LoadingPage />;

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard actions={actions} profile={currentProfile} vehicles={vehicles} reminders={reminders} serviceRecords={serviceRecords} />;
      case 'welcome':
        return <Welcome actions={actions} />;
      case 'add-first-vehicle':
        return <AddFirstVehicle actions={actions} />;
      case 'vehicles':
        return <MyVehicles actions={actions} vehicles={vehicles} />;
      case 'vehicle-details':
        return <VehicleDetails actions={actions} vehicleId={selectedVehicleId} records={serviceRecords} vehicles={vehicles} reminders={reminders} />;
      case 'upcoming-services':
        return <ServiceQueue actions={actions} mode="upcoming" reminders={reminders} vehicles={vehicles} />;
      case 'overdue-services':
        return <ServiceQueue actions={actions} mode="overdue" reminders={reminders} vehicles={vehicles} />;
      case 'monthly-expenses':
        return <MonthlyExpenses actions={actions} serviceRecords={serviceRecords} vehicles={vehicles} />;
      case 'service-history':
        return <ServiceHistory actions={actions} records={serviceRecords} vehicles={vehicles} />;
      case 'add-service':
        return (
          <AddServiceRecord
            actions={actions}
            vehicles={vehicles}
            editingRecord={serviceRecords.find((record) => record.id === editingServiceId) || null}
            onDone={() => setEditingServiceId(null)}
          />
        );
      case 'reminders':
        return (
          <Reminders
            actions={actions}
            reminders={reminders}
            vehicles={vehicles}
            initialVehicleId={reminderVehicleId}
            onInitialVehicleHandled={() => setReminderVehicleId(null)}
          />
        );
      case 'expenses':
        return <ExpensesAnalytics actions={actions} records={serviceRecords} vehicles={vehicles} />;
      case 'settings':
        return <Settings actions={actions} profile={currentProfile} vehicles={vehicles} serviceRecords={serviceRecords} reminders={reminders} />;
      case 'notifications':
        return (
          <Notifications
            actions={actions}
            notifications={notifications}
            readIds={notificationReadIds}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllNotificationsRead}
            onDelete={deleteNotification}
          />
        );
      default:
        return <Dashboard actions={actions} profile={currentProfile} vehicles={vehicles} reminders={reminders} serviceRecords={serviceRecords} />;
    }
  };

  return (
    <AppLayout
      title={config.title}
      breadcrumbs={config.breadcrumbs}
      activeNav={currentPage === 'dashboard' ? 'dashboard' : currentPage}
      profile={currentProfile}
      hasVehicles={vehicles.length > 0}
      vehicles={vehicles}
      serviceRecords={serviceRecords}
      reminders={reminders}
      notifications={notifications}
      notificationReadIds={notificationReadIds}
      notificationCount={unreadNotificationCount}
      onMarkNotificationRead={markNotificationRead}
      onMarkAllNotificationsRead={markAllNotificationsRead}
      onNavigate={handleNavigate}
      onLogout={actions.logout}
    >
      {renderPage()}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}
