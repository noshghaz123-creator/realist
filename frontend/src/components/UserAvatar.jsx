const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-20 h-20 text-2xl',
};

export default function UserAvatar({ user, size = 'md', className = '' }) {
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const sizeClass = SIZES[size] || SIZES.md;
  const avatarSrc = typeof user?.avatar === 'string' ? user.avatar.trim() : '';

  if (avatarSrc) {
    return (
      <img
        key={avatarSrc.slice(0, 48)}
        src={avatarSrc}
        alt={user.name || 'Profile'}
        className={`rounded-full object-cover shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-black text-white flex items-center justify-center font-bold shrink-0 ${sizeClass} ${className}`}
    >
      {initials}
    </div>
  );
}

export { planLabel } from './PlanBadge';
