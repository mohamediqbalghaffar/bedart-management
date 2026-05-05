import type {Metadata} from 'next';
import './globals.css';
import { Noto_Kufi_Arabic } from 'next/font/google';
import { ClientToaster } from '@/components/client-toaster';
import { Providers } from './providers';

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-noto-kufi-arabic',
});


export const metadata: Metadata = {
  title: 'BedArt Group',
  description: 'سیستەمی بەڕێوەبردنی کار بۆ فرۆشگای دۆشەک و پێداویستیەکانی',
  themeColor: '#2B78C5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BedArt Group',
  },
};

export default async function RootLayout({ children, params }: { children: React.ReactNode, params: any }) {
  await params;

  return (
    <html lang="ku" dir="rtl">
      <body className={`${notoKufiArabic.variable} font-body antialiased`}>
        <Providers>
          {children}
        </Providers>
        <ClientToaster />
      </body>
    </html>
  );
}
