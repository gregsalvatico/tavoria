import { NextRequest, NextResponse } from "next/server";

const PROD_APP_ORIGIN = "https://app.tavoriapp.com";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params;
  const incomingUrl = new URL(request.url);
  const isLocal =
    incomingUrl.hostname === "localhost" ||
    incomingUrl.hostname === "127.0.0.1";
  const appOrigin = isLocal
    ? `${incomingUrl.protocol}//${incomingUrl.hostname}:8081`
    : process.env.NEXT_PUBLIC_APP_ORIGIN ?? PROD_APP_ORIGIN;
  const destination = new URL(`/${path.join("/")}`, appOrigin);
  destination.search = incomingUrl.search;

  return NextResponse.redirect(destination, 307);
}
