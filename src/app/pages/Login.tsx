import { useEffect, useState } from 'react';
import { Car } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Checkbox } from '../components/Checkbox';
import { Card } from '../components/Card';
import { AppActions } from '../data/appTypes';

const maxFailedLoginAttempts = 5;
const loginLockoutMs = 5 * 60 * 1000;
const loginAttemptStorageKey = 'autocare-login-attempts';

// This browser-session lockout improves UX and reduces accidental repeated attempts.
// Real brute-force protection must be enforced by Supabase/Auth server-side rate limiting.
type LoginAttemptState = {
  failedAttempts: number;
  lockedUntil: number;
};

const initialLoginAttemptState: LoginAttemptState = {
  failedAttempts: 0,
  lockedUntil: 0
};

function readLoginAttemptState(): LoginAttemptState {
  try {
    const stored = sessionStorage.getItem(loginAttemptStorageKey);
    if (!stored) return initialLoginAttemptState;

    const parsed = JSON.parse(stored) as Partial<LoginAttemptState>;
    if (typeof parsed.failedAttempts !== 'number' || typeof parsed.lockedUntil !== 'number') {
      return initialLoginAttemptState;
    }

    if (parsed.lockedUntil > 0 && parsed.lockedUntil <= Date.now()) {
      sessionStorage.removeItem(loginAttemptStorageKey);
      return initialLoginAttemptState;
    }

    return {
      failedAttempts: parsed.failedAttempts,
      lockedUntil: parsed.lockedUntil
    };
  } catch {
    return initialLoginAttemptState;
  }
}

function saveLoginAttemptState(state: LoginAttemptState) {
  try {
    sessionStorage.setItem(loginAttemptStorageKey, JSON.stringify(state));
  } catch {
    // Client-side lockout is only UX protection. Real brute-force protection must be handled by Supabase/Auth server-side rate limiting.
  }
}

function clearLoginAttemptState() {
  try {
    sessionStorage.removeItem(loginAttemptStorageKey);
  } catch {
    // Client-side lockout is only UX protection. Real brute-force protection must be handled by Supabase/Auth server-side rate limiting.
  }
}

function formatRemainingTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function Login({ actions }: { actions: AppActions }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attemptState, setAttemptState] = useState<LoginAttemptState>(() => readLoginAttemptState());
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const isLocked = attemptState.lockedUntil > currentTime;
  const remainingLockoutMs = attemptState.lockedUntil - currentTime;

  useEffect(() => {
    if (!isLocked) return;

    const interval = window.setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      if (attemptState.lockedUntil <= now) {
        clearLoginAttemptState();
        setAttemptState(initialLoginAttemptState);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [attemptState.lockedUntil, isLocked]);

  const recordFailedLoginAttempt = () => {
    const failedAttempts = attemptState.failedAttempts + 1;
    const nextState =
      failedAttempts >= maxFailedLoginAttempts
        ? { failedAttempts, lockedUntil: Date.now() + loginLockoutMs }
        : { failedAttempts, lockedUntil: 0 };

    saveLoginAttemptState(nextState);
    setAttemptState(nextState);
    setCurrentTime(Date.now());
  };

  const clearFailedLoginAttempts = () => {
    clearLoginAttemptState();
    setAttemptState(initialLoginAttemptState);
    setCurrentTime(Date.now());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setLoading(true);
    const loggedIn = await actions.login(email, password);
    setLoading(false);

    if (loggedIn) {
      clearFailedLoginAttempts();
      return;
    }

    recordFailedLoginAttempt();
  };

  return (
    <div className="min-h-screen modern-page-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground mx-auto mb-4">
            <Car size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Log in to your AutoCare Tracker account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="example@email.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <div className="flex items-center justify-between">
              <Checkbox label="Remember me" />
              <button
                type="button"
                onClick={() => actions.navigate('forgot-password')}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full" loading={loading} disabled={isLocked}>
              Log in
            </Button>
            {isLocked && (
              <p className="text-sm text-danger-500">
                Too many failed login attempts. Please try again in 5 minutes.
                {' '}Remaining time: {formatRemainingTime(remainingLockoutMs)}.
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => actions.navigate('register')}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
