import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import KitchenPanel from './KitchenPanel';

export const dynamic = 'force-dynamic';

export default async function KitchenViewPage() {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !['store-manager'].includes(
      (session.user as any)?.role
    )
  ) {
    redirect('/');
  }

  return <KitchenPanel />;
}
