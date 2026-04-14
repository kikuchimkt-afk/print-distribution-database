export async function generateMetadata({ params }) {
  const { id } = await params;

  return {
    title: '宿題連絡帳',
    description: '宿題の確認ページ',
    manifest: `/api/lp-manifest/${id}`,
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
}

export default function StudentLPLayout({ children }) {
  return children;
}
