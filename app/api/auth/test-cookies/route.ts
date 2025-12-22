import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Test endpoint to verify cookies are being set and read correctly
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    return NextResponse.json({
      cookies: allCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
        valuePreview: c.value ? `${c.value.substring(0, 20)}...` : null,
      })),
      authToken: cookieStore.get("auth_token")?.value ? "present" : "missing",
      userSession: cookieStore.get("user_session")?.value ? "present" : "missing",
      refreshToken: cookieStore.get("refresh_token")?.value ? "present" : "missing",
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}



