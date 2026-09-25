import EmailLayout from "./email-layout";

type PasswordResetEmailProps = {
  resetUrl: string;
};

export default function PasswordResetEmail({
  resetUrl,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout
      preview="Сброс пароля StudyFlow"
      heading="Сброс пароля"
      actionLabel="Придумать новый пароль"
      actionUrl={resetUrl}
      expiryHint="Ссылка действует 1 час."
    >
      Мы получили запрос на сброс пароля для вашего аккаунта StudyFlow. Нажмите
      на кнопку ниже, чтобы задать новый пароль.
    </EmailLayout>
  );
}
