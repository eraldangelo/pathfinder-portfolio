import './globals.css';
import './styles/globals-base.css';
import './styles/globals-glass.css';
import './styles/globals-scrollbar.css';
import './styles/globals-forms.css';
import 'flag-icons/css/flag-icons.min.css';
import type { ReactNode } from 'react';
import PublicEnvScript from '@/components/common/PublicEnvScript';
import { IMAGE_LINKS } from '@/config/imageLinks';

export const metadata = {
  title: "Pathfinder",
  description: 'A modern React-based operations portal.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="custom-scrollbar">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <PublicEnvScript />
        <style>{`
          :root {
            --app-bg-light-image: url('${IMAGE_LINKS.branding.bgLight}');
            --app-bg-dark-image: url('${IMAGE_LINKS.branding.bgDark}');
          }
        `}</style>
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={IMAGE_LINKS.branding.favicon32}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

