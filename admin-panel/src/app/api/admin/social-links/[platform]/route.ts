import { NextResponse } from "next/server";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "";

type Params = {
  params: { platform: string };
};

export async function PUT(request: Request, { params }: Params) {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return NextResponse.json(
      { success: false, message: "API URL is not configured." },
      { status: 500 }
    );
  }
  const auth = request.headers.get("authorization");
  const body = await request.json();
  const response = await fetch(
    `${apiUrl}/admin/social-links/${params.platform}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { authorization: auth } : {}),
      },
      body: JSON.stringify(body),
    }
  );
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
