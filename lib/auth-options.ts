import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import { checkSignupRateLimit, resetRateLimit } from '@/lib/rate-limit';


export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const email = credentials.email.trim().toLowerCase();

        // -----------------------------
        // RATE LIMITING (LOGIN)
        // -----------------------------
        const ip =
          req?.headers?.['x-forwarded-for']?.toString().split(',')[0] ||
          req?.headers?.['x-real-ip']?.toString() ||
          '127.0.0.1';

        const rateLimitKey = `login:${email}:${ip}`;
        const { success } = await checkSignupRateLimit(rateLimitKey);

        if (!success) {
          throw new Error('Too many login attempts. Please try again later.');
        }

        // -----------------------------
        // USER LOOKUP
        // -----------------------------
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        // Check if email is verified (only for customers)
        if (user.role === 'customer' && !user.emailVerified) {
          throw new Error('Please verify your email before logging in');
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        // -----------------------------
        // ✅ SUCCESS → RESET RATE LIMIT
        // -----------------------------
        await resetRateLimit(rateLimitKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          address: user.address,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.phone = (user as any).phone;
        token.address = (user as any).address;
      }

      // Refetch user data when session is updated
      if (trigger === 'update' && token.id) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            role: true,
          },
        });

        if (freshUser) {
          token.name = freshUser.name;
          token.email = freshUser.email;
          token.phone = freshUser.phone;
          token.address = freshUser.address;
          token.role = freshUser.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).name = token.name;
        (session.user as any).phone = token.phone;
        (session.user as any).address = token.address;
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/auth/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
