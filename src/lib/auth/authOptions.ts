import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prismaDB";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "google-client-id-placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google-client-secret-placeholder",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "github-client-id-placeholder",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "github-client-secret-placeholder",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        // Case-insensitive so accounts stored with capital letters can still sign in.
        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          include: {
            memberships: {
              include: {
                organization: true,
                role: { include: { rolePermissions: { include: { permission: true } } } },
              },
            },
          },
        });

        // Same response for unknown user / no password / wrong password / disabled account.
        if (!user || !user.password || !user.isActive) return null;
        const isCorrect = await bcrypt.compare(password, user.password);
        if (!isCorrect) return null;

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName || user.name,
          image: user.image,
          role: user.role,
          memberships: user.memberships,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.activeOrgId = (user as any).activeOrgId;
        token.memberships = (user as any).memberships;
      }
      if (trigger === "update" && session?.activeOrgId) {
        token.activeOrgId = session.activeOrgId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).activeOrgId = token.activeOrgId;
        (session.user as any).memberships = token.memberships;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    signOut: "/",
    error: "/error",
  },
};
