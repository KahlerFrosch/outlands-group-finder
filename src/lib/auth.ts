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
        token.discordId = (profile as any).id;
        token.name = profile.global_name ?? profile.name ?? token.name;
        token.picture = profile.avatar
          ? `https://cdn.discordapp.com/avatars/${(profile as any).id}/${(profile as any).avatar}.png`
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
