import { NextResponse } from "next/server";

/**
 * OAuth 2.0 Dynamic Client Registration - NOT SUPPORTED
 * 
 * This server does not support RFC 7591 Dynamic Client Registration.
 * Clients should use the public client flow without client registration.
 * 
 * The absence of registration_endpoint in the OAuth discovery metadata
 * indicates that clients should proceed with authentication without
 * dynamic registration.
 */

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// GET and POST both return error indicating registration is not supported
const notSupportedResponse = () => {
  return NextResponse.json(
    { 
      error: "unsupported_operation",
      error_description: "Dynamic client registration (RFC 7591) is not supported. Please use the public client OAuth flow without registration."
    },
    { 
      status: 501, // Not Implemented
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      }
    }
  );
}

export async function GET() {
  return notSupportedResponse();
}

export async function POST(request: Request) {
  return notSupportedResponse();
}
