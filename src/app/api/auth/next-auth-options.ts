import axios from 'axios';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/',
    error: '/',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        mobile: { label: 'Mobile', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials: Record<'mobile' | 'otp', string> | undefined) {
        try {
          const rawMobile = credentials?.mobile?.trim() ?? '';
          const otp = credentials?.otp?.trim() ?? '';
          const mobile = rawMobile.length === 10 && /^\d+$/.test(rawMobile) ? `+91${rawMobile}` : rawMobile;

          const response = await axios({
            method: 'POST',
            url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify-otp`,
            data: {
              mobile,
              otp,
              role: 'DRIVER',
            },
          });
          if (response.data.success) {
            return {
              id: response.data.data.user.userId,
              user: response.data.data.user,
              accessToken: response.data.data?.accessToken ?? '',
              refreshToken: response.data.data?.refreshToken ?? '',
            };
          }
          return null;
        } catch (error: any) {
          console.log(error?.response?.data);
          throw Error(error?.response?.data?.message ?? error?.message);
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: any) {
      if (token?.user) {
        session.user = token.user;
      }
      if (token?.accessToken) {
        session.accessToken = token.accessToken;
      }
      if (token?.refreshToken) {
        session.refreshToken = token.refreshToken;
      }
      return session;
    },
    async jwt({ token, user, account, trigger, session }: any) {
      if (user) {
        token.user = user.user;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      if (trigger === 'update' && session?.user) {
        token.user = session.user;
      }
      if (trigger === 'update' && session?.accessToken) {
        token.accessToken = session.accessToken;
      }
      if (trigger === 'update' && session?.refreshToken) {
        token.refreshToken = session.refreshToken;
      }
      return token;
    },
  },
};
