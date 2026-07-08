import { cn } from '../../lib/utils';
import { ds } from '../../lib/design-tokens';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'wide';
}

const sizeMap = {
  default: 'max-w-7xl',
  narrow: 'max-w-3xl',
  wide: 'max-w-6xl',
};

export default function Container({ children, className, size = 'default' }: ContainerProps) {
  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeMap[size], className)}>
      {children}
    </div>
  );
}

export { ds };
