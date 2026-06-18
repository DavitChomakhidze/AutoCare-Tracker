import { Car } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { VehicleForm } from '../components/VehicleForm';
import { AppActions } from '../data/appTypes';

export function AddFirstVehicle({ actions }: { actions: AppActions }) {
  return (
    <div className="min-h-screen modern-page-bg flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground mx-auto mb-4">
            <Car size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Add your vehicle</h1>
          <p className="text-muted-foreground">Choose the make, model, and details you want to track.</p>
        </div>

        <Card>
          <VehicleForm
            id="add-first-vehicle-form"
            onInvalidSubmit={() => actions.toast('error', 'Please complete the required vehicle fields.')}
            onSubmit={async (vehicle, photoFile) => {
              const saved = await actions.addVehicle(vehicle, photoFile);
              if (saved) {
                actions.toast('success', `${vehicle.manufacturer} ${vehicle.model} added.`);
                actions.navigate('vehicles');
              }
            }}
          />

          <div className="flex flex-col-reverse gap-3 justify-between mt-8 pt-6 border-t border-border sm:flex-row">
            <Button variant="outline" onClick={() => actions.navigate('vehicles')}>
              Cancel
            </Button>
            <Button type="button" onClick={() => document.getElementById('add-first-vehicle-form')?.requestSubmit()}>
              Save vehicle
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
