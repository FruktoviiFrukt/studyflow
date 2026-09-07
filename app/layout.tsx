import type { Metadata } from "next";
import "./globals.css";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "StudyHub",
  description: "Student assistant for Polytechnic University of Moldova",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="bg-gray-50 text-gray-900">
        <Sidebar />

        <div className="min-h-screen md:ml-64">
          <Header />

          <main className="min-h-[calc(100vh-4rem)] p-5 md:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}