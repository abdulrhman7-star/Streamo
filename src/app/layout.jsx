import './globals.css';

export const metadata = {
  title: 'أكـوام Stream',
  description: 'منصة أفلام ومسلسلات'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}