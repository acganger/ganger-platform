import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';
import type { Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          hd: 'gangerdermatology.com',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      // Only allow users with @gangerdermatology.com email
      if (user.email?.endsWith('@gangerdermatology.com')) {
        // Upsert user in Supabase
        const { error } = await supabase
          .from('auth.users')
          .upsert({
            id: user.id,
            email: user.email,
            raw_user_meta_data: {
              name: user.name,
              avatar_url: user.image
            }
          });
        
        if (error) {
          console.error('Error upserting user:', error);
        }
        
        return true;
      }
      return false;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session?.user) {
        (session.user as any).id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);