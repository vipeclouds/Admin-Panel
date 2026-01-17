import { NextResponse } from "next/server";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "";

export async function PATCH(request: Request) {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return NextResponse.json(
      { success: false, message: "API URL is not configured." },
      { status: 500 }
    );
  }
  const auth = request.headers.get("authorization");
  const body = await request.json();
  const response = await fetch(`${apiUrl}/admin/homepage/why-shop/reorder`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { authorization: auth } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
