import AuthHero from "@/components/auth/AuthHero";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthHero />

        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <p className="text-2xl font-bold text-blue-700">StudyFlow</p>
            </div>

            <ResetPasswordForm token={token} />
          </div>
        </section>
      </div>
    </main>
  );
}
