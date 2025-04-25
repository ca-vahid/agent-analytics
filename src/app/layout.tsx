'use client';

import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// Add a script that ensures no flash of wrong theme
function setInitialColorMode() {
  return {
    __html: `
      (function() {
        // Check for saved theme
        const theme = localStorage.getItem('theme');
        const isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        // Add or remove the 'dark' class right away to avoid flash
        if (isDark) {
          document.documentElement.classList.add('dark');
        }
      })()
    `,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <title>Ticket Analytics</title>
        <meta name="description" content="Visualize and analyze support ticket data" />
        <script dangerouslySetInnerHTML={setInitialColorMode()} />
      </head>
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
        {children}
      </body>
    </html>
  );
}
