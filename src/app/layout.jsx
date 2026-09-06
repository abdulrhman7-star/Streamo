import './globals.css';

export const metadata = {
  title: 'Akwam Media',
  description: 'واجهة أفلام ومسلسلات'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}