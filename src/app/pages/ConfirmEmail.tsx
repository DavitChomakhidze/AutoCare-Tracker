import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AppActions } from '../data/appTypes';

export function ConfirmEmail({ actions }: { actions: AppActions }) {
  return (
    <div className="min-h-screen modern-page-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-success-50 text-success-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-muted-foreground">
            Account created. Please check your email and confirm your account before logging in.
          </p>
        </div>

        <Card className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            After confirming your email, return to AutoCare and log in with your new account.
          </p>
          <Button className="w-full" onClick={() => actions.navigate('login')}>
            Go to login
            <ArrowRight size={18} />
          </Button>
        </Card>
      </div>
    </div>
  );
}
