import './globals.css';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata = {
  title: 'Coffee Ninja Inquiries',
  description: 'Track customer inquiries from first contact to resolution.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}