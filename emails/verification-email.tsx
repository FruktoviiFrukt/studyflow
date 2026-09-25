import EmailLayout from "./email-layout";

type VerificationEmailProps = {
  verifyUrl: string;
};

export default function VerificationEmail({
  verifyUrl,
}: VerificationEmailProps) {
  return (
    <EmailLayout
      preview="Подтвердите email для StudyFlow"
      heading="Подтвердите ваш email"
      actionLabel="Подтвердить email"
      actionUrl={verifyUrl}
      expiryHint="Ссылка действует 24 часа."
    >
      Спасибо за регистрацию в StudyFlow! Чтобы завершить создание аккаунта и
      войти, подтвердите свой email — нажмите на кнопку ниже.
    </EmailLayout>
  );
}
