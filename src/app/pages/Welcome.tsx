import { Car, Wrench, DollarSign, Bell } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AppActions } from '../data/appTypes';

const benefits = [
  {
    icon: <Wrench size={24} />,
    title: 'Organize service history',
    description: 'Keep all your maintenance records in one place'
  },
  {
    icon: <DollarSign size={24} />,
    title: 'Track expenses',
    description: 'Monitor and analyze your vehicle costs'
  },
  {
    icon: <Bell size={24} />,
    title: 'Receive reminders',
    description: 'Never miss important maintenance dates'
  }
];

export function Welcome({ actions }: { actions: AppActions }) {
  return (
    <div className="min-h-screen modern-page-bg flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground mx-auto mb-6">
            <Car size={40} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome to AutoCare Tracker!
          </h1>
          <p className="text-lg text-muted-foreground">
            You're all set! Let's get started by adding your first vehicle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <Card key={index} padding="lg" className="text-center">
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 mx-auto mb-3">
                {benefit.icon}
              </div>
              <h3 className="font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" onClick={() => actions.navigate('add-first-vehicle')}>
            <Car size={20} />
            Add my first vehicle
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            You can add more vehicles later from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
