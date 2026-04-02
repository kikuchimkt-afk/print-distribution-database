import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'PrintBase - プリント配布データベース',
  description: '塾の講師向けプリント管理システム',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <header className="app-header">
          <Link href="/" className="app-logo">
            <div className="logo-icon">P</div>
            <span>PrintBase</span>
          </Link>
        </header>
        {children}
        <div id="toast-container"></div>
      </body>
    </html>
  );
}
