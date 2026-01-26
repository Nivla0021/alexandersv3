import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // If user is already logged in, redirect based on role
  if (session?.user) {
    const userRole = (session.user as any)?.role;
    
    if (userRole === 'admin') {
      redirect('/admin/dashboard');
    } else {
      redirect('/');
    }
  }

  return <LoginForm />;
}
