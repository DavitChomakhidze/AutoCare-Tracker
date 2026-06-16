import { useState } from 'react';
import { Car, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Checkbox } from '../components/Checkbox';
import { Card } from '../components/Card';
import { AppActions } from '../data/mockData';

export function Register({ actions }: { actions: AppActions }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const passwordsMatch = password === confirmPassword && password.length > 0;
  const passwordValid = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !passwordsMatch || !passwordValid) return;
    setLoading(true);
    await actions.register(name, email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen modern-page-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground mx-auto mb-4">
            <Car size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-muted-foreground">Start tracking your vehicle maintenance today</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              placeholder="Alex Carter"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

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
              placeholder="Create a strong password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Minimum 8 characters"
            />

            <Input
              label="Confirm password"
              type="password"
              placeholder="Re-enter your password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={
                confirmPassword.length > 0 && !passwordsMatch
                  ? 'Passwords do not match'
                  : undefined
              }
            />

            <div className="space-y-3 p-4 bg-neutral-50 rounded-lg text-sm">
              <p className="font-medium">Password requirements:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    size={16}
                    className={passwordValid ? 'text-success-500' : 'text-neutral-400'}
                  />
                  <span className={passwordValid ? 'text-success-700' : 'text-muted-foreground'}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    size={16}
                    className={passwordsMatch && password.length > 0 ? 'text-success-500' : 'text-neutral-400'}
                  />
                  <span className={passwordsMatch && password.length > 0 ? 'text-success-700' : 'text-muted-foreground'}>
                    Passwords match
                  </span>
                </div>
              </div>
            </div>

            <Checkbox
              label={
                <span className="text-sm">
                  I agree to the{' '}
                  <a href="#" className="text-primary hover:underline">
                    Terms and Conditions
                  </a>
                </span>
              }
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!agreed || !passwordsMatch || !passwordValid}
            >
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => actions.navigate('login')}
                className="text-primary hover:underline font-medium"
              >
                Log in
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
