import { useState } from 'react';
import { Car, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { AppActions } from '../data/appTypes';

export function ForgotPassword({ actions }: { actions: AppActions }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const sent = await actions.resetPassword(email);
    setLoading(false);
    if (sent) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen modern-page-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-success-50 text-success-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-muted-foreground">
              We've sent you a password reset link. Please check your inbox.
            </p>
          </div>

          <Card className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <Button variant="outline" onClick={() => setSubmitted(false)}>
              Resend email
            </Button>

            <div className="mt-6 pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => actions.navigate('login')}
                className="text-sm text-primary hover:underline inline-flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to log in
              </button>
            </div>
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
            <Car size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Forgot your password?</h1>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you a reset link
          </p>
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

            <Button type="submit" className="w-full" loading={loading}>
              Send reset link
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => actions.navigate('login')}
              className="text-sm text-primary hover:underline inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to log in
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
