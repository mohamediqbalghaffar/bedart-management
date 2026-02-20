'use client';

import { useConfidentialMode } from '@/contexts/confidential-mode-context';
import { cn } from '@/lib/utils';

type ConfidentialBlurProps = {
  children: React.ReactNode;
  className?: string;
};

export function ConfidentialBlur({ children, className }: ConfidentialBlurProps) {
  const { isConfidential } = useConfidentialMode();

  return (
    <span
      className={cn(
        'transition-all duration-300',
        isConfidential
          ? 'blur-md text-transparent select-none'
          : '',
        className
      )}
    >
      {children}
    </span>
  );
}
