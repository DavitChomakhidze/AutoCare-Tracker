import { ChangeEvent, useEffect, useState } from 'react';
import { User, Lock, Bell, Settings as SettingsIcon, Download } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { CompactDropdown } from '../components/CompactDropdown';
import { Checkbox } from '../components/Checkbox';
import { ConfirmModal } from '../components/Modal';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { AppActions, Reminder, ServiceRecord, UserProfile, Vehicle } from '../data/appTypes';

const settingsSections = [
  { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  { id: 'security', label: 'Account Security', icon: <Lock size={20} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
  { id: 'preferences', label: 'Preferences', icon: <SettingsIcon size={20} /> },
  { id: 'data', label: 'Data & Export', icon: <Download size={20} /> }
];

const defaultNotificationPrefs = {
  inApp: true,
  email: true,
  dueSoon: true,
  overdue: true,
  monthlySummary: false
};
const allowedAvatarTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const avatarMaxBytes = 2 * 1024 * 1024;

function downloadFile(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function escapeHtml(value: string | number | undefined | null) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function reportTable(headers: string[], rows: Array<Array<string | number>>) {
  return `
    <table>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows.length
          ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')
          : `<tr><td colspan="${headers.length}">No data available.</td></tr>`}
      </tbody>
    </table>
  `;
}

function openPrintableReport(title: string, sections: string[]) {
  const reportWindow = window.open('about:blank', '_blank');
  if (!reportWindow) return false;

  const html = `
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
          h1 { font-size: 24px; margin: 0 0 6px; }
          h2 { font-size: 16px; margin: 28px 0 10px; }
          p { color: #4b5563; margin: 0 0 18px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; font-weight: 700; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
          .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; }
          .box strong { display: block; font-size: 18px; margin-top: 4px; }
          @media print { body { margin: 18mm; } button { display: none; } }
        </style>
      </head>
      <body onload="window.focus(); setTimeout(function(){ window.print(); }, 250);">
        <button onclick="window.print()" style="float:right;padding:8px 12px;margin-bottom:16px;">Save as PDF</button>
        <h1>${escapeHtml(title)}</h1>
        <p>Generated on ${escapeHtml(new Date().toLocaleDateString())}</p>
        ${sections.join('')}
      </body>
    </html>
  `;

  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
  return true;
}

export function Settings({
  actions,
  profile,
  vehicles,
  serviceRecords,
  reminders
}: {
  actions: AppActions;
  profile: UserProfile;
  vehicles: Vehicle[];
  serviceRecords: ServiceRecord[];
  reminders: Reminder[];
}) {
  const [activeSection, setActiveSection] = useState('profile');
  const [confirmAction, setConfirmAction] = useState<'account' | 'data' | null>(null);
  const [profileForm, setProfileForm] = useState({ name: profile.name, email: profile.email, phone: '', avatarUrl: profile.avatarUrl || '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [notificationPrefs, setNotificationPrefs] = useState(defaultNotificationPrefs);
  const [notifyBefore, setNotifyBefore] = useState(() => localStorage.getItem('autocare_notify_before') || '7');
  const [distanceUnit, setDistanceUnit] = useState(() => localStorage.getItem('autocare_distance_unit') || 'km');
  const [currency, setCurrency] = useState(() => localStorage.getItem('autocare_currency') || 'gel');
  const [language, setLanguage] = useState(() => localStorage.getItem('autocare_language') || 'en');
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem('autocare_date_format') || 'ymd');
  const [appearance, setAppearance] = useState(() => localStorage.getItem('autocare_appearance') || 'light');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    setProfileForm((current) => ({
      ...current,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl || ''
    }));
  }, [profile]);

  useEffect(() => {
    const saved = localStorage.getItem('autocare_notification_prefs');
    if (!saved) return;
    try {
      setNotificationPrefs({ ...defaultNotificationPrefs, ...JSON.parse(saved) });
    } catch {
      setNotificationPrefs(defaultNotificationPrefs);
    }
  }, []);

  const labeledDropdown = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: { value: string; label: string }[],
    helperText?: string
  ) => (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <CompactDropdown options={options} value={value} onChange={onChange} />
      {helperText && <p className="text-sm text-muted-foreground mt-1.5">{helperText}</p>}
    </div>
  );

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!allowedAvatarTypes.has(file.type)) {
      event.target.value = '';
      actions.toast('error', 'Photo must be a PNG, JPG, JPEG, or WEBP image.');
      return;
    }

    if (file.size > avatarMaxBytes) {
      event.target.value = '';
      actions.toast('error', 'Photo must be 2MB or smaller.');
      return;
    }

    setUploadingPhoto(true);
    const avatarUrl = await actions.uploadAvatar(file);
    setUploadingPhoto(false);
    if (!avatarUrl) return;

    setProfileForm((current) => ({ ...current, avatarUrl }));
    actions.toast('success', 'Photo uploaded. Save profile to keep it.');
  };

  const saveProfile = async () => {
    const name = profileForm.name.trim();
    const email = profileForm.email.trim();
    if (!name || !email) {
      actions.toast('error', 'Name and email are required.');
      return;
    }

    setSavingProfile(true);
    await actions.updateProfile({ name, email, avatarUrl: profileForm.avatarUrl || null });
    setSavingProfile(false);
  };

  const updatePassword = async () => {
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      actions.toast('error', 'Fill in all password fields.');
      return;
    }
    if (passwordForm.next.length < 8) {
      actions.toast('error', 'New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      actions.toast('error', 'New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    const saved = await actions.updatePassword(passwordForm.current, passwordForm.next);
    if (saved) setPasswordForm({ current: '', next: '', confirm: '' });
    setSavingPassword(false);
  };

  const saveNotificationPrefs = () => {
    localStorage.setItem('autocare_notification_prefs', JSON.stringify(notificationPrefs));
    localStorage.setItem('autocare_notify_before', notifyBefore);
    actions.toast('success', 'Notification preferences saved.');
  };

  const savePreferences = () => {
    localStorage.setItem('autocare_distance_unit', distanceUnit);
    localStorage.setItem('autocare_currency', currency);
    localStorage.setItem('autocare_language', language);
    localStorage.setItem('autocare_date_format', dateFormat);
    localStorage.setItem('autocare_appearance', appearance);
    actions.toast('success', 'Application preferences saved.');
  };

  const exportAllData = () => {
    downloadFile(
      `autocare-data-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ profile, vehicles, serviceRecords, reminders }, null, 2)
    );
    actions.toast('success', 'Data export downloaded.');
  };

  const exportServiceHistoryCsv = () => {
    const header = ['Date', 'Vehicle', 'Plate', 'Type', 'Category', 'Mileage', 'Workshop', 'Cost', 'Status', 'Notes'];
    const rows = serviceRecords.map((record) => [
      record.date,
      record.vehicle,
      record.plate,
      record.type,
      record.category,
      record.mileage,
      record.workshop,
      record.cost,
      record.status,
      record.notes
    ]);
    downloadFile(
      `autocare-service-history-${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n'),
      'text/csv;charset=utf-8;'
    );
    actions.toast('success', 'Service history CSV downloaded.');
  };

  const exportExpensesCsv = () => {
    const header = ['Date', 'Vehicle', 'Plate', 'Category', 'Service type', 'Labor', 'Parts', 'Additional', 'Total'];
    const rows = serviceRecords.map((record) => [
      record.date,
      record.vehicle,
      record.plate,
      record.category,
      record.type,
      record.laborCost,
      record.partsCost,
      record.additionalCost,
      record.cost
    ]);
    downloadFile(
      `autocare-expenses-${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n'),
      'text/csv;charset=utf-8;'
    );
    actions.toast('success', 'Expense report downloaded.');
  };

  const exportAllDataPdf = () => {
    const totalExpenses = serviceRecords.reduce((sum, record) => sum + record.cost, 0);
    const opened = openPrintableReport('AutoCare Data Report', [
      `<div class="summary">
        <div class="box">Vehicles<strong>${vehicles.length}</strong></div>
        <div class="box">Service records<strong>${serviceRecords.length}</strong></div>
        <div class="box">Total expenses<strong>${totalExpenses.toLocaleString()} GEL</strong></div>
      </div>`,
      '<h2>Profile</h2>',
      reportTable(['Name', 'Email'], [[profile.name, profile.email]]),
      '<h2>Vehicles</h2>',
      reportTable(
        ['Vehicle', 'Year', 'Plate', 'Mileage', 'Fuel', 'Status'],
        vehicles.map((vehicle) => [vehicle.manufacturer + ' ' + vehicle.model, vehicle.year, vehicle.plate, vehicle.mileage, vehicle.fuelType, vehicle.status])
      ),
      '<h2>Service Records</h2>',
      reportTable(
        ['Date', 'Vehicle', 'Type', 'Mileage', 'Workshop', 'Cost', 'Status'],
        serviceRecords.map((record) => [record.date, record.vehicle, record.type, record.mileage, record.workshop, `${record.cost} GEL`, record.status])
      ),
      '<h2>Reminders</h2>',
      reportTable(
        ['Title', 'Vehicle', 'Due date', 'Due mileage', 'Status'],
        reminders.map((reminder) => [
          reminder.title,
          vehicles.find((vehicle) => vehicle.id === reminder.vehicleId)?.manufacturer || 'Vehicle',
          reminder.dueDate || '',
          reminder.dueMileage || '',
          reminder.isCompleted ? 'completed' : reminder.status || 'active'
        ])
      )
    ]);
    actions.toast(opened ? 'success' : 'error', opened ? 'PDF report opened. Choose Save as PDF in the print dialog.' : 'Could not open PDF report window.');
  };

  const exportServiceHistoryPdf = () => {
    const opened = openPrintableReport('AutoCare Service History', [
      reportTable(
        ['Date', 'Vehicle', 'Plate', 'Type', 'Category', 'Mileage', 'Workshop', 'Cost', 'Status', 'Notes'],
        serviceRecords.map((record) => [
          record.date,
          record.vehicle,
          record.plate,
          record.type,
          record.category,
          record.mileage,
          record.workshop,
          `${record.cost} GEL`,
          record.status,
          record.notes
        ])
      )
    ]);
    actions.toast(opened ? 'success' : 'error', opened ? 'Service history PDF opened.' : 'Could not open PDF report window.');
  };

  const exportExpensesPdf = () => {
    const totalExpenses = serviceRecords.reduce((sum, record) => sum + record.cost, 0);
    const opened = openPrintableReport('AutoCare Expenses Report', [
      `<div class="summary">
        <div class="box">Records<strong>${serviceRecords.length}</strong></div>
        <div class="box">Total<strong>${totalExpenses.toLocaleString()} GEL</strong></div>
        <div class="box">Average<strong>${serviceRecords.length ? Math.round(totalExpenses / serviceRecords.length).toLocaleString() : 0} GEL</strong></div>
      </div>`,
      reportTable(
        ['Date', 'Vehicle', 'Plate', 'Category', 'Service type', 'Labor', 'Parts', 'Additional', 'Total'],
        serviceRecords.map((record) => [
          record.date,
          record.vehicle,
          record.plate,
          record.category,
          record.type,
          `${record.laborCost} GEL`,
          `${record.partsCost} GEL`,
          `${record.additionalCost} GEL`,
          `${record.cost} GEL`
        ])
      )
    ]);
    actions.toast(opened ? 'success' : 'error', opened ? 'Expenses PDF opened.' : 'Could not open PDF report window.');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div>
          <Card padding="sm">
            <nav className="space-y-1">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeSection === section.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'
                  }`}
                >
                  {section.icon}
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'profile' && (
            <Card>
              <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <ProfileAvatar profile={{ ...profile, name: profileForm.name, avatarUrl: profileForm.avatarUrl }} size="lg" />
                  <div>
                    <label className="inline-flex h-8 px-3 text-sm items-center justify-center rounded-[var(--radius-button)] border-2 border-border bg-card/80 hover:bg-accent hover:border-primary-500/30 cursor-pointer font-medium">
                      {uploadingPhoto ? 'Uploading...' : 'Change photo'}
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handlePhotoChange} />
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">JPG, PNG or WEBP (max. 2MB)</p>
                  </div>
                </div>

                <Input label="Full name" value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} />
                <Input label="Email address" type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} />
                <Input label="Phone number" type="tel" placeholder="+995 555 123 456" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />

                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="outline" onClick={() => setProfileForm({ name: profile.name, email: profile.email, phone: '', avatarUrl: profile.avatarUrl || '' })}>Cancel</Button>
                  <Button loading={savingProfile} onClick={saveProfile}>Save changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'security' && (
            <>
              <Card>
                <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                <div className="space-y-4">
                  <Input label="Current password" type="password" value={passwordForm.current} onChange={(event) => setPasswordForm((current) => ({ ...current, current: event.target.value }))} />
                  <Input label="New password" type="password" value={passwordForm.next} onChange={(event) => setPasswordForm((current) => ({ ...current, next: event.target.value }))} />
                  <Input label="Confirm new password" type="password" value={passwordForm.confirm} onChange={(event) => setPasswordForm((current) => ({ ...current, confirm: event.target.value }))} />

                  <div className="flex gap-3 justify-end pt-4">
                    <Button variant="outline" onClick={() => setPasswordForm({ current: '', next: '', confirm: '' })}>Cancel</Button>
                    <Button loading={savingPassword} onClick={updatePassword}>Update password</Button>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium mb-2">Log out from all devices</h3>
                    <p className="text-sm text-muted-foreground mb-4">This will log you out from every active Supabase session.</p>
                    <Button variant="outline" onClick={actions.logOutEverywhere}>Log out everywhere</Button>
                  </div>

                  <div className="p-4 border border-destructive rounded-lg bg-danger-50">
                    <h3 className="font-medium mb-2 text-destructive">Delete Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">Account deletion requires a secure server endpoint with Supabase admin permissions.</p>
                    <Button variant="danger" onClick={() => setConfirmAction('account')}>Delete account</Button>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Reminder Notifications</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Checkbox label="In-app reminders" checked={notificationPrefs.inApp} onChange={(event) => setNotificationPrefs((current) => ({ ...current, inApp: event.target.checked }))} />
                    <Checkbox label="Email reminders" checked={notificationPrefs.email} onChange={(event) => setNotificationPrefs((current) => ({ ...current, email: event.target.checked }))} />
                    <Checkbox label="Due-soon reminders" checked={notificationPrefs.dueSoon} onChange={(event) => setNotificationPrefs((current) => ({ ...current, dueSoon: event.target.checked }))} />
                    <Checkbox label="Overdue reminders" checked={notificationPrefs.overdue} onChange={(event) => setNotificationPrefs((current) => ({ ...current, overdue: event.target.checked }))} />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="font-medium mb-3">Reports</h3>
                  <Checkbox label="Monthly expense summary via email" checked={notificationPrefs.monthlySummary} onChange={(event) => setNotificationPrefs((current) => ({ ...current, monthlySummary: event.target.checked }))} />
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="font-medium mb-3">Reminder Timing</h3>
                  {labeledDropdown('Notify me before a due date', notifyBefore, setNotifyBefore, [
                    { value: '1', label: '1 day before' },
                    { value: '3', label: '3 days before' },
                    { value: '7', label: '7 days before' },
                    { value: '14', label: '14 days before' }
                  ])}
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="outline" onClick={() => setNotificationPrefs(defaultNotificationPrefs)}>Reset</Button>
                  <Button onClick={saveNotificationPrefs}>Save preferences</Button>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'preferences' && (
            <Card>
              <h2 className="text-xl font-semibold mb-6">Application Preferences</h2>
              <div className="space-y-4">
                {labeledDropdown('Distance unit', distanceUnit, setDistanceUnit, [
                  { value: 'km', label: 'Kilometers (km)' },
                  { value: 'mi', label: 'Miles (mi)' }
                ])}
                {labeledDropdown('Currency', currency, setCurrency, [
                  { value: 'gel', label: 'Georgian Lari (GEL)' },
                  { value: 'usd', label: 'US Dollar ($)' },
                  { value: 'eur', label: 'Euro (EUR)' }
                ])}
                {labeledDropdown('Language', language, setLanguage, [
                  { value: 'en', label: 'English' },
                  { value: 'ka', label: 'Georgian' }
                ])}
                {labeledDropdown('Date format', dateFormat, setDateFormat, [
                  { value: 'dmy', label: 'DD/MM/YYYY' },
                  { value: 'mdy', label: 'MM/DD/YYYY' },
                  { value: 'ymd', label: 'YYYY-MM-DD' }
                ])}
                {labeledDropdown('Appearance', appearance, setAppearance, [
                  { value: 'light', label: 'Light mode' },
                  { value: 'dark', label: 'Dark mode' },
                  { value: 'auto', label: 'System default' }
                ], 'Saved for future theme support')}

                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="outline" onClick={() => {
                    setDistanceUnit('km');
                    setCurrency('gel');
                    setLanguage('en');
                    setDateFormat('ymd');
                    setAppearance('light');
                  }}>Reset</Button>
                  <Button onClick={savePreferences}>Save preferences</Button>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'data' && (
            <Card>
              <h2 className="text-xl font-semibold mb-6">Data Management</h2>
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                  <h3 className="font-medium mb-2">Export my data</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create a readable PDF report with your profile, vehicles, service records, reminders, and expense summary.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={exportAllDataPdf}><Download size={16} />Download PDF</Button>
                    <Button variant="ghost" size="sm" onClick={exportAllData}>Export JSON</Button>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <h3 className="font-medium mb-2">Download service history</h3>
                  <p className="text-sm text-muted-foreground mb-4">Export your complete service history as a readable PDF.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={exportServiceHistoryPdf}>Download PDF</Button>
                    <Button variant="ghost" size="sm" onClick={exportServiceHistoryCsv}>Export CSV</Button>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <h3 className="font-medium mb-2">Download expenses report</h3>
                  <p className="text-sm text-muted-foreground mb-4">Export a readable PDF report of vehicle expenses.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={exportExpensesPdf}>Download PDF</Button>
                    <Button variant="ghost" size="sm" onClick={exportExpensesCsv}>Export CSV</Button>
                  </div>
                </div>

                <div className="p-4 border border-destructive rounded-lg bg-danger-50">
                  <h3 className="font-medium mb-2 text-destructive">Delete all stored data</h3>
                  <p className="text-sm text-muted-foreground mb-4">Permanently delete all vehicles. Related service records and reminders are deleted through database cascade rules.</p>
                  <Button variant="danger" onClick={() => setConfirmAction('data')}>Delete all data</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmAction === 'account'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null);
          actions.toast('warning', 'Account deletion needs a server-side Supabase admin endpoint before it can run safely.');
        }}
        title="Delete account?"
        message="Client-side code cannot securely delete Supabase auth users. Add a server endpoint for this action."
        confirmText="Understood"
        variant="danger"
      />

      <ConfirmModal
        isOpen={confirmAction === 'data'}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          setConfirmAction(null);
          await actions.deleteAllData();
        }}
        title="Delete all stored data?"
        message="This will permanently delete your vehicles and related service/reminder data."
        confirmText="Delete data"
        variant="danger"
      />
    </div>
  );
}
