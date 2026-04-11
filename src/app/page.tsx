import { redirect } from 'next/navigation';

export default function RootPage() {
  // If we had a marketing landing page, it would go here.
  // For now, we redirect to login (or feed if authenticated via middleware, but we handle client side)
  redirect('/login');
}
