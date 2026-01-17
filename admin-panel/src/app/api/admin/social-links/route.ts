import { NextResponse } from "next/server";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "";

export async function GET(request: Request) {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return NextResponse.json(
      { success: false, message: "API URL is not configured." },
      { status: 500 }
    );
  }
  const auth = request.headers.get("authorization");
  const response = await fetch(`${apiUrl}/admin/social-links`, {
    headers: auth ? { authorization: auth } : undefined,
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
