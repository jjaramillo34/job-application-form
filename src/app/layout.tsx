import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from './components/Header';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NYC District 79 Alternative Schools - Job Application",
  description: "Apply for positions at NYC District 79 Alternative Schools programs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}
