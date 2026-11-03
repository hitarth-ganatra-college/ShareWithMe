import { auth } from '@/lib/auth';
import MainApp from '@/components/MainApp';

export const metadata = {
  title: 'ShareWithMe — Instant Web Project Deployment & QR Sharing',
  description:
    'Deploy static HTML, CSS & JavaScript projects in seconds. Get instant live links and scannable QR codes for your friends and classroom.',
};

export default async function Home() {
  const session = await auth();

  return <MainApp initialSession={session} />;
}
