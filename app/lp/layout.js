import '../globals.css';

export const metadata = {
  title: '宿題連絡帳',
  description: '宿題の確認ページ',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '宿題連絡帳',
  },
};

export default function LPLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="宿題連絡帳" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
