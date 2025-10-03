import './globals.css';

export const metadata = {
  title: 'Dossier — Vercel',
  description: 'Serverless dossier with Vercel Postgres + Blob'
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
