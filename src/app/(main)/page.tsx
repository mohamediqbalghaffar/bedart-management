'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirectPage(props: any) {
  const router = useRouter();
  use(props.params);
  use(props.searchParams);

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>
  );
}
