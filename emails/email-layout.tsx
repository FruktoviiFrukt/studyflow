import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

type EmailLayoutProps = {
  preview: string;
  heading: string;
  actionLabel: string;
  actionUrl: string;
  expiryHint: string;
  children: ReactNode;
};

export default function EmailLayout({
  preview,
  heading,
  actionLabel,
  actionUrl,
  expiryHint,
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.wordmark}>StudyFlow</Text>

          <Heading style={styles.heading}>{heading}</Heading>

          <Text style={styles.text}>{children}</Text>

          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button href={actionUrl} style={styles.button}>
              {actionLabel}
            </Button>
          </Section>

          <Text style={styles.mutedText}>
            Если кнопка не работает, скопируйте эту ссылку в браузер:
            <br />
            <Link href={actionUrl} style={styles.link}>
              {actionUrl}
            </Link>
          </Text>

          <Text style={styles.mutedText}>{expiryHint}</Text>

          <Text style={styles.footer}>
            Если вы не запрашивали это письмо, просто проигнорируйте его.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f8fafc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: "40px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "40px",
    maxWidth: "480px",
    margin: "0 auto",
    border: "1px solid #e2e8f0",
  },
  wordmark: {
    color: "#2563eb",
    fontSize: "20px",
    fontWeight: 700,
    margin: "0 0 24px",
  },
  heading: {
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: 600,
    margin: "0 0 16px",
  },
  text: {
    color: "#334155",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0",
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: "12px",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    padding: "12px 28px",
    display: "inline-block",
  },
  mutedText: {
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "0 0 16px",
    wordBreak: "break-all" as const,
  },
  link: {
    color: "#2563eb",
  },
  footer: {
    color: "#94a3b8",
    fontSize: "12px",
    margin: "24px 0 0",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "16px",
  },
};
