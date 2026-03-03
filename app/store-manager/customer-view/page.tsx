// app/customer-view/page.tsx

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import CustomerPanel from './CustomerPanel';

export const dynamic = 'force-dynamic';

export default async function CustomerViewPage() {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !['store-manager'].includes(
      (session.user as any)?.role
    )
  ) {
    redirect('/');
  }

  return <CustomerPanel />;
}
