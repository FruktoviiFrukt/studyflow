import AuthHero from "@/components/auth/AuthHero";
import VerifyEmailStatus from "@/components/auth/VerifyEmailStatus";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = await searchParams;

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthHero />

        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <VerifyEmailStatus token={token} />
          </div>
        </section>
      </div>
    </main>
  );
}
