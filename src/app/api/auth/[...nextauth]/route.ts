import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'eco@loop.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const user = await db.user.findUnique({ 
            where: { email: credentials.email },
            select: { id: true, name: true, email: true, password: true }
          });
          if (!user) {
            // User doesn't exist
            return null;
          }

          // If the user was created before we added passwords, they won't have one. 
          // For safety, require them to sign up again or fallback to allowing it (we will block it to be strict).
          if (!user.password) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email
          };
        } catch (e) {
          console.error('NextAuth authorize error:', e);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: '/onboarding'
  },
  secret: process.env.NEXTAUTH_SECRET || 'super-secret-key-for-ecoloop-auth-dev'
});

export { handler as GET, handler as POST };
