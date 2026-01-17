import { NextResponse } from "next/server";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "";

type Params = {
  params: {
    platform: string;
  };
};

export async function GET(_request: Request, { params }: Params) {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return NextResponse.json(
      { success: false, message: "API URL is not configured." },
      { status: 500 }
    );
  }

  const response = await fetch(
    `${apiUrl}/homepage/social-links/${params.platform}`
  );
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
