import { useEffect, useState } from 'react';
import { Car } from 'lucide-react';
import { Vehicle } from '../data/appTypes';

interface VehiclePhotoProps {
  vehicle: Vehicle;
  className?: string;
  iconSize?: number;
}

export function VehiclePhoto({ vehicle, className = '', iconSize = 80 }: VehiclePhotoProps) {
  const [failed, setFailed] = useState(false);
  const photoUrl = vehicle.photoUrl && !failed ? vehicle.photoUrl : '';

  useEffect(() => {
    setFailed(false);
  }, [vehicle.photoUrl]);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-primary-50 via-card to-success-50 flex items-center justify-center text-primary-600 ${className}`}>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`${vehicle.manufacturer} ${vehicle.model}`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 border border-primary-500/10 bg-[radial-gradient(circle_at_30%_20%,rgba(22,135,217,0.16),transparent_36%),radial-gradient(circle_at_78%_72%,rgba(16,185,129,0.14),transparent_34%)] px-3 text-center">
          <div className="flex items-center justify-center rounded-full border border-primary-500/15 bg-card/80 p-3 text-primary-600 shadow-sm shadow-primary-700/10">
            <Car size={Math.max(28, Math.round(iconSize * 0.58))} />
          </div>
          <span className="text-xs font-medium text-primary-700">No vehicle photo</span>
        </div>
      )}
    </div>
  );
}
