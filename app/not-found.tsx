import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="simple-page">
      <div className="simple-card">
        <div className="brand-mark" aria-hidden="true">W</div>
        <h1>Page not found</h1>
        <p>The page you requested does not exist.</p>
        <Link className="primary-link" href="/word-online">Open Free Word Online</Link>
      </div>
    </main>
  );
}
