import { useState } from 'react';
import { ArrowLeft, CheckCircle, KeyRound } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { AppActions } from '../data/appTypes';

export function ResetPassword({
  actions,
  canResetPassword
}: {
  actions: AppActions;
  canResetPassword: boolean;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canResetPassword || !passwordValid || !passwordsMatch) return;

    setLoading(true);
    await actions.updateRecoveredPassword(password);
    setLoading(false);
  };

  if (!canResetPassword) {
    return (
      <div className="min-h-screen modern-page-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-warning-50 text-warning-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Reset link expired</h1>
            <p className="text-muted-foreground">
              This password reset link is invalid or expired. Request a new link to continue.
            </p>
          </div>

          <Card className="text-center">
            <Button className="w-full" onClick={() => actions.navigate('forgot-password')}>
              Request new reset link
            </Button>
            <button
              type="button"
              onClick={() => actions.navigate('login')}
              className="mt-5 text-sm text-primary hover:underline inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to log in
            </button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen modern-page-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground mx-auto mb-4">
            <KeyRound size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Set new password</h1>
          <p className="text-muted-foreground">
            Enter a new password for your AutoCare account.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New password"
              type="password"
              placeholder="Create a new password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              helperText="Minimum 8 characters"
            />

            <Input
              label="Confirm new password"
              type="password"
              placeholder="Re-enter your new password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : undefined}
            />

            <div className="space-y-2 rounded-lg bg-neutral-50 p-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className={passwordValid ? 'text-success-500' : 'text-neutral-400'} />
                <span className={passwordValid ? 'text-success-700' : 'text-muted-foreground'}>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className={passwordsMatch ? 'text-success-500' : 'text-neutral-400'} />
                <span className={passwordsMatch ? 'text-success-700' : 'text-muted-foreground'}>Passwords match</span>
              </div>
            </div>

            <Button type="submit" className="w-full" loading={loading} disabled={!passwordValid || !passwordsMatch}>
              Save new password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
