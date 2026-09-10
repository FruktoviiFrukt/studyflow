import type { Metadata } from "next";
import "./globals.css";

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
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}