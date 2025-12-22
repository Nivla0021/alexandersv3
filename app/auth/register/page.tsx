import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import RegisterForm from './RegisterForm';

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  // If user is already logged in, redirect to home
  if (session?.user) {
    redirect('/');
  }

  return <RegisterForm />;
}
