import type { ReactNode } from 'react';

function Icon({ size = 24, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const HomeIcon = () => (
  <Icon><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Icon>
);
export const BookIcon = () => (
  <Icon><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11" /></Icon>
);
export const CardsIcon = () => (
  <Icon><rect x="3" y="7" width="14" height="12" rx="2" /><path d="M7 4h12a2 2 0 0 1 2 2v10" /></Icon>
);
export const CheckCircleIcon = () => (
  <Icon><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></Icon>
);
export const LinesIcon = () => (
  <Icon><path d="M4 6h16M4 12h10M4 18h13" /></Icon>
);
export const PlusIcon = ({ size = 16 }: { size?: number }) => (
  <Icon size={size}><path d="M12 5v14M5 12h14" /></Icon>
);
export const BackIcon = () => (
  <Icon><path d="m15 5-7 7 7 7" /></Icon>
);
