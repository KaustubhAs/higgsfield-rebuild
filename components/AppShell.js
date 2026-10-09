'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DraftProvider from './DraftProvider';
import Icon from './Icons';

const navigation = [['/', 'Explore', 'explore'], ['/image/', 'Image Studio', 'image'], ['/video/', 'Video Studio', 'video'], ['/assets/', 'Assets', 'assets']];
export default function AppShell({ children }) {
  const pathname = usePathname();
  return <DraftProvider><a className="skip-link" href="#main">Skip to content</a><header className="app-header">
    <Link className="brand" href="/" aria-label="Frame Studio home"><span className="brand-mark">f</span><span>frame<span className="brand-dot">.</span></span><span className="brand-studio">STUDIO</span></Link>
    <nav aria-label="Main navigation">{navigation.map(([href, label, icon]) => <Link key={href} href={href} aria-current={(pathname === href || `${pathname}/` === href) ? 'page' : undefined}><Icon name={icon} size={17} />{label}</Link>)}</nav>
    <span className="preview-tag"><span />Image AI + samples</span>
  </header><main id="main">{children}</main><footer className="app-footer"><span>Made for your next idea.</span><span>Independent Higgsfield-inspired studio · Cloudflare images ? Sample video</span></footer></DraftProvider>;
}
