import { NextResponse } from "next/server";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "";

export async function PUT(request: Request) {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return NextResponse.json(
      { success: false, message: "API URL is not configured." },
      { status: 500 }
    );
  }
  const auth = request.headers.get("authorization");
  const formData = await request.formData();
  const response = await fetch(`${apiUrl}/admin/homepage`, {
    method: "PUT",
    headers: auth ? { authorization: auth } : undefined,
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
