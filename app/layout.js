import './globals.css';
import Link from 'next/link';
import { headers } from 'next/headers';

export const metadata = {
  title: 'PrintBase - プリント配布データベース',
  description: '塾の講師向けプリント管理システム',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PrintBase',
  },
};

export default async function RootLayout({ children }) {
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || headerList.get('x-invoke-path') || '';
  const isLP = pathname.startsWith('/lp');

  return (
    <html lang="ja">
      <body>
        {!isLP && (
          <header className="app-header">
            <Link href="/" className="app-logo">
              <div className="logo-icon">P</div>
              <span>PrintBase</span>
            </Link>
          </header>
        )}
        {children}
        {!isLP && (
          <footer className="app-footer">
            <p>© {new Date().getFullYear()} ECC藍住・北島中央・大学前</p>
          </footer>
        )}
        <div id="toast-container"></div>
      </body>
    </html>
  );
}
