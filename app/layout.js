import './globals.css';
import AppShell from '../components/AppShell';
export const metadata = { title: { default: 'Frame Studio — Start with an idea', template: '%s · Frame Studio' }, description: 'An intent-first image and video studio. Guided creation, transparent controls and reusable recipes. Public samples and local Cloudflare image generation.' };
export default function RootLayout({ children }) { return <html lang="en"><body><AppShell>{children}</AppShell></body></html>; }
