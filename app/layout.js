import './globals.css';
import AppShell from '../components/AppShell';
export const metadata = { title: { default: 'Frame Studio — Start with an idea', template: '%s · Frame Studio' }, description: 'An intent-first image and video studio. Application foundation preview; no live generation connected.' };
export default function RootLayout({ children }) { return <html lang="en"><body><AppShell>{children}</AppShell></body></html>; }
