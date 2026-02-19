import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Noto_Kufi_Arabic } from 'next/font/google';
import { ClientToaster } from '@/components/client-toaster';
import { AuthProvider } from '@/contexts/auth-context';

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
          <AuthProvider>
            {children}
          </AuthProvider>
        </FirebaseClientProvider>
        <ClientToaster />
      </body>
    </html>
  );
}
