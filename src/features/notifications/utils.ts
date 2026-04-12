/**
 * Utility to send an in-app notification (+ browser push if subscribed)
 * Call this from anywhere in the client or server-side API routes
 */
export async function sendNotification({
  userId,
  title,
  body,
  url,
  type,
}: {
  userId: string;
  title: string;
  body?: string;
  url?: string;
  type?: string;
}): Promise<void> {
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body, url, type }),
    });
  } catch (err) {
    // Non-fatal
    console.warn('sendNotification failed:', err);
  }
}
