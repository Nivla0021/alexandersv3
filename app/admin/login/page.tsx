import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import AdminLoginForm from './AdminLoginForm';

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);

  // If admin is already logged in, redirect to admin dashboard
  if (session?.user?.email?.includes('admin') || session?.user?.email?.includes('john@doe.com')) {
    redirect('/admin/dashboard');
  }

  return <AdminLoginForm />;
}
