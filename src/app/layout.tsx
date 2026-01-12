import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Noto_Kufi_Arabic } from 'next/font/google';
import { ClientToaster } from '@/components/client-toaster';
import { ConditionalLayout } from './conditional-layout';

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-noto-kufi-arabic',
});


export const metadata: Metadata = {
  title: 'BedArt Group',
  description: 'سیستەمی بەڕێوەبردنی کار بۆ فرۆشگای دۆشەک و پێداویستیەکانی',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="ku" dir="rtl">
      <body className={`${notoKufiArabic.variable} font-body antialiased`}>
        <FirebaseClientProvider>
           <ConditionalLayout>{children}</ConditionalLayout>
        </FirebaseClientProvider>
        <ClientToaster />
      </body>
    </html>
  );
}
