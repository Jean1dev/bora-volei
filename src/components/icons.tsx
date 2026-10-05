// Ícones do protótipo (Lucide), desenhados inline.
type P = { size?: number };

const svg = (size: number, strokeWidth: number, children: React.ReactNode, square = false) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap={square ? "square" : undefined}
    aria-hidden
  >
    {children}
  </svg>
);

export const IconArrow = ({ size = 24 }: P) => svg(size, 2.5, <path d="M5 12h14M12 5l7 7-7 7" />, true);
export const IconBack = ({ size = 22 }: P) => svg(size, 2.5, <path d="m12 19-7-7 7-7M19 12H5" />, true);
export const IconCheck = ({ size = 26, strokeWidth = 3 }: P & { strokeWidth?: number }) =>
  svg(size, strokeWidth, <path d="M20 6 9 17l-5-5" />, true);
export const IconX = ({ size = 18 }: P) => svg(size, 2.5, <path d="M18 6 6 18M6 6l12 12" />);
export const IconShare = ({ size = 22 }: P) =>
  svg(
    size,
    2.5,
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </>,
  );
export const IconLock = ({ size = 16 }: P) =>
  svg(
    size,
    2.5,
    <>
      <rect x="3" y="11" width="18" height="11" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>,
  );
export const IconShuffle = ({ size = 20 }: P) =>
  svg(
    size,
    2.5,
    <path d="m18 14 4 4-4 4M18 2l4 4-4 4M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22M2 6h1.4c1.3 0 2.5.6 3.3 1.7l.6.8M22 18h-6c-1.3 0-2.5-.6-3.3-1.7l-.5-.8" />,
  );
export const IconRepeat = ({ size = 20 }: P) =>
  svg(size, 2.5, <path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" />);
export const IconPencil = ({ size = 20 }: P) =>
  svg(
    size,
    2,
    <path d="M21.17 6.81a1 1 0 0 0-3.98-3.98L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" />,
  );
