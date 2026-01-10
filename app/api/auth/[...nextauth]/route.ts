import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { logUserSignIn } from "@/lib/logging";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    theme: {
        colorScheme: "dark",
        brandColor: "#00ff88",
        logo: "/logo.png",
        buttonText: "Sign in with Google"
    },
    callbacks: {
        async signIn({ user }) {
            // Log the sign-in event
            await logUserSignIn(user);
            return true;
        },
        async session({ session, token, user }) {
            return session;
        }
    }
});

export { handler as GET, handler as POST };
