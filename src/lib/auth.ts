import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? ""
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const p = profile as { id?: string; name?: string; global_name?: string; avatar?: string };
        token.discordId = p.id;
        token.name = p.global_name ?? p.name ?? token.name;
        token.picture = p.avatar
          ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png`
          : token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name;
        session.user.image = token.picture as string | undefined;
        (session.user as any).discordId = token.discordId;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
