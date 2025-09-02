import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

// Configure which paths run through Clerk's middleware
export const config = {
  matcher: [
    // Protect our API routes that call auth()
    "/api/(session|tokens|spend)",

    // Optionally protect everything under /api if you later add more protected routes
    // "/api/:path*",

    // Run middleware on all app routes except for static files and Next internals
    "/((?!_next|.*\\.\w+$|favicon.ico|robots.txt|sitemap.xml|icon.png|apple-touch-icon.png).*)",
  ],
};
