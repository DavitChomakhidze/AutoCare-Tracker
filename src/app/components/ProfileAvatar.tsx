import { UserProfile } from '../data/appTypes';

interface ProfileAvatarProps {
  profile: UserProfile;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-9 h-9 text-base',
  lg: 'w-20 h-20 text-2xl'
};

export function profileInitial(name: string) {
  return (name.trim().charAt(0) || 'U').toUpperCase();
}

export function ProfileAvatar({ profile, size = 'sm' }: ProfileAvatarProps) {
  if (profile.avatarUrl) {
    return (
      <img
        src={profile.avatarUrl}
        alt={profile.name}
        className={`${sizeClasses[size]} rounded-full object-cover border border-primary-500/10 shadow-sm`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-primary-100 to-success-50 rounded-full flex items-center justify-center text-primary-700 font-medium border border-primary-500/10 shadow-sm`}>
      {profileInitial(profile.name)}
    </div>
  );
}
