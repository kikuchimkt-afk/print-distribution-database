import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params;

  const manifest = {
    name: '宿題連絡帳',
    short_name: '宿題連絡帳',
    description: '宿題の確認ページ',
    start_url: `/lp/${id}`,
    scope: `/lp/${id}`,
    display: 'standalone',
    background_color: '#1a3a2a',
    theme_color: '#2d6a4f',
    icons: [
      {
        src: '/icon.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
