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
    <div className={`bg-neutral-100 flex items-center justify-center text-neutral-400 ${className}`}>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`${vehicle.manufacturer} ${vehicle.model}`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Car size={iconSize} />
      )}
    </div>
  );
}
