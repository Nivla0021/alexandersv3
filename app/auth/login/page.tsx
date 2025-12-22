import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // If user is already logged in, redirect to home
  if (session?.user) {
    redirect('/');
  }

  return <LoginForm />;
}
