import LoginPage from '@/app/(auth)/login/page';

export default function RegisterPage() {
  // For the MVP, registration and login are the same via Google OAuth
  // If we fully implement email/password later, we'd build out a separate form here.
  return <LoginPage />;
}
