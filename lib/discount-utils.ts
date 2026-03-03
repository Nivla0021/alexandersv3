import { prisma } from './prisma';

export async function isUserDiscountApproved(userId: string): Promise<{
  approved: boolean;
  discountType: 'PWD' | 'SENIOR' | null;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        discountApproved: true,
        discountType: true,
      },
    });

    return {
      approved: user?.discountApproved || false,
      discountType: user?.discountType as 'PWD' | 'SENIOR' | null,
    };
  } catch (error) {
    console.error('Error checking discount approval:', error);
    return { approved: false, discountType: null };
  }
}

export function calculateDiscount(amount: number): number {
  return amount * 0.2; // 20% discount
}