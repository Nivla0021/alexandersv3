import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import AdminLoginForm from './AdminLoginForm';

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);

  // 2. Check if user is logged in
  if (session?.user) {
    const userRole = (session.user as any)?.role;
    
    // 3. Redirect based on role
    if (userRole === 'admin') {
      redirect('/admin/dashboard');  // Admin → Dashboard
    } else if (userRole === 'store-manager') {
      redirect('/store-manager/dashboard');  // Store Manager → Dashboard
    }else{
      redirect('/'); // Other roles → Home
    }
  }

  // 4. If not logged in, show admin login form
  return <AdminLoginForm />;
}
