import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'YohPal Live AI Factory Admin',
  description: 'Admin dashboard for YohPal Live AI seed content factory',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">
              <div className="brandMark">YL</div>
              <div>
                <strong>YohPal Live</strong>
                <span>AI Factory Admin</span>
              </div>
            </div>
            <nav>
              <Link href="/">Dashboard</Link>
              <Link href="/trends">Trends</Link>
              <Link href="/scripts">Scripts</Link>
              <Link href="/videos">Videos</Link>
              <Link href="/moderation">Moderation</Link>
              <Link href="/provider-jobs">Provider Jobs</Link>
              <Link href="/script-provider-logs">Script Provider Logs</Link>
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
