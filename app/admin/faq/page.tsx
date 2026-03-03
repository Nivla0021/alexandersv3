import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import FAQClient from './FAQClient';

export const dynamic = 'force-dynamic';

export default async function FAQAdminPage() {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !['admin'].includes(
      (session.user as any)?.role
    )
  ) {
    redirect('/');
  }

  return <FAQClient />;
}
