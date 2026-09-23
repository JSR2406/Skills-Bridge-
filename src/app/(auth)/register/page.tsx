// ── AUTH GROUP: Register page
// MVP: registration is the same flow as login (Google OAuth), so this just
// renders the login page. Expand into a real form if email/password is added.
import LoginPage from '@/app/(auth)/login/page';

export default function RegisterPage() {
  // For the MVP, registration and login are the same via Google OAuth
  // If we fully implement email/password later, we'd build out a separate form here.
  return <LoginPage />;
}
