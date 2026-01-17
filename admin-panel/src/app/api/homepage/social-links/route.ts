import { NextResponse } from "next/server";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "";
const SOCIAL_PLATFORMS = ["facebook", "instagram", "x", "snapchat"] as const;

export async function GET() {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return NextResponse.json(
      { success: false, message: "API URL is not configured." },
      { status: 500 }
    );
  }
  const results = await Promise.all(
    SOCIAL_PLATFORMS.map(async (platform) => {
      const response = await fetch(
        `${apiUrl}/homepage/social-links/${platform}`
      );
      const payload = await response.json().catch(() => ({}));
      return { platform, response, payload };
    })
  );

  const failed = results.find((result) => !result.response.ok);
  if (failed) {
    return NextResponse.json(failed.payload, {
      status: failed.response.status,
    });
  }

  const data = results.map(({ platform, payload }) => {
    const link = (payload as { data?: any })?.data ?? payload ?? {};
    return {
      platform:
        typeof link.platform === "string" ? link.platform : platform,
      url: link.url ?? "",
      isActive: Boolean(link.isActive),
    };
  });

  return NextResponse.json({ success: true, data });
}
