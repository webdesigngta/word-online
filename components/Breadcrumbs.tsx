import Link from 'next/link';

export type BreadcrumbItem = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="fwo-breadcrumbs" aria-label="Breadcrumb">
      <style>{`
        .fwo-breadcrumbs{width:min(1120px,100%);margin:0 auto 18px;font-family:Arial,Helvetica,sans-serif}.fwo-breadcrumbs ol{display:flex;align-items:center;gap:8px;list-style:none;margin:0;padding:0;flex-wrap:wrap;color:#5f6368;font-size:12px}.fwo-breadcrumbs li{display:flex;align-items:center;gap:8px}.fwo-breadcrumbs li:not(:last-child)::after{content:'›';color:#9aa0a6}.fwo-breadcrumbs a{color:#5f6368;text-decoration:none}.fwo-breadcrumbs a:hover{color:#0b57d0;text-decoration:underline}.fwo-breadcrumbs [aria-current='page']{color:#202124;font-weight:600}
      `}</style>
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
