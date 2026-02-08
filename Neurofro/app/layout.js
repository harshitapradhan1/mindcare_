"use client";
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import "./globals.css";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const hideNavbar = mounted && (pathname === '/signup' || pathname === '/login');
  
  return (
    <html lang="en">
      <head>
        <title>MindCare - AI-Powered Cognitive Health Assessment</title>
        <meta name="description" content="Advanced AI analyzes speech patterns and cognitive behavior to identify early warning signs. Fast, accurate, and accessible in 15+ languages." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {!hideNavbar && <Navbar />}
        {children}
      </body>
    </html>
  );
}
