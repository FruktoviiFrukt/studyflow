import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />

      <div className="min-h-screen md:ml-64">
        <Header />

        <main className="min-h-[calc(100vh-4rem)] p-5 md:p-8">
          {children}
        </main>
      </div>
    </>
  );
}