import { NextResponse } from "next/server";
import { issueOtp, saveOtp } from "@/lib/driver/otpStore";
import { getClientKey, slidingWindowAllow } from "@/lib/driver/rateLimit";
import { sendOtpBodySchema } from "@/lib/driver/validation";

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = sendOtpBodySchema.safeParse(raw);

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid input.";
      return NextResponse.json(
        { error: msg, code: "INVALID_PHONE" },
        { status: 400 },
      );
    }

    const { phone } = parsed.data;

    const key = getClientKey(req);
    if (!slidingWindowAllow(`send-otp:${key}`, 8, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Try again in a minute.", code: "RATE_LIMIT" },
        { status: 429 },
      );
    }

    const otp = issueOtp();
    saveOtp(phone, otp);

    if (process.env.NODE_ENV === "development") {
      console.info(`[driver auth] OTP for ${phone}: ${otp}`);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request body.", code: "BAD_REQUEST" }, { status: 400 });
  }
}
