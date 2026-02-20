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
    <span className={cn(isConfidential ? 'blur-sm select-none' : '', className)}>
      {children}
    </span>
  );
}
