import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value),
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protected routes check
    if (request.nextUrl.pathname.startsWith("/app") && !user) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Redirect to app if logged in and trying to access auth pages
    if (request.nextUrl.pathname.startsWith("/auth") && user) {
        return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }

    return response;
}

export const config = {
    matcher: ["/app/:path*", "/auth/:path*"],
};
