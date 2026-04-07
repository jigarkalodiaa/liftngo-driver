import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  buildDriverSegmentPayload,
  type DriverPerformanceMetrics,
  type DriverSegmentPayload,
} from "@/lib/driver/driverSegment";
import { verifyAndConsumeOtp } from "@/lib/driver/otpStore";
import { getClientKey, slidingWindowAllow } from "@/lib/driver/rateLimit";
import { verifyOtpBodySchema } from "@/lib/driver/validation";

const OLD_DRIVER_OTP = "4768";
const NEW_DRIVER_OTP = "7484";

type DriverType = "existing" | "new";

function resolveDriverType(otp: string): DriverType {
  if (otp === NEW_DRIVER_OTP) return "new";
  return "existing";
}

/** Mock metrics until a real driver profile service exists — must match computeDriverSegment rules. */
function mockDriverMetrics(
  phone: string,
  driverVerified: boolean,
  driverType: DriverType,
): DriverPerformanceMetrics {
  if (driverVerified) {
    return { performanceScore: 78, cancellationRatePct: 4 };
  }
  if (driverType === "new") {
    return { performanceScore: 52, cancellationRatePct: 12 };
  }
  const n = phone.replace(/\D/g, "").slice(-3);
  const salt = n ? Number.parseInt(n, 10) % 17 : 0;
  return { performanceScore: 55 + salt, cancellationRatePct: 8 + (salt % 5) };
}

function createMockToken(
  phone: string,
  driverType: DriverType,
  driverVerified: boolean,
  tagging: DriverSegmentPayload,
): string {
  const payload = Buffer.from(
    JSON.stringify({
      phone,
      role: "driver",
      driverType,
      driverVerified,
      performanceScore: tagging.performanceScore,
      cancellationRatePct: tagging.cancellationRatePct,
      segment: tagging.segment,
      iat: Date.now(),
    }),
    "utf8",
  ).toString("base64url");
  return `drv.${payload}.${randomBytes(12).toString("hex")}`;
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = verifyOtpBodySchema.safeParse(raw);

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid input.";
      const code = msg.includes("OTP") ? "INVALID_OTP" : "INVALID_PHONE";
      return NextResponse.json({ error: msg, code }, { status: 400 });
    }

    const { phone, otp: otpRaw } = parsed.data;

    const key = getClientKey(req);
    if (!slidingWindowAllow(`verify-otp:${key}`, 20, 60_000)) {
      return NextResponse.json(
        { error: "Too many attempts. Try again shortly.", code: "RATE_LIMIT" },
        { status: 429 },
      );
    }

    const isHardcoded = otpRaw === OLD_DRIVER_OTP || otpRaw === NEW_DRIVER_OTP;
    const ok = isHardcoded || verifyAndConsumeOtp(phone, otpRaw);

    if (!ok) {
      return NextResponse.json(
        { error: "Invalid or expired OTP. Request a new code.", code: "VERIFY_FAILED" },
        { status: 401 },
      );
    }

    const driverType = resolveDriverType(otpRaw);
    const driverVerified = otpRaw === OLD_DRIVER_OTP;
    const metrics = mockDriverMetrics(phone, driverVerified, driverType);
    const tagging = buildDriverSegmentPayload(metrics);
    const token = createMockToken(phone, driverType, driverVerified, tagging);
    return NextResponse.json({
      success: true,
      token,
      driverType,
      driverVerified,
      segment: tagging.segment,
      performanceScore: tagging.performanceScore,
      cancellationRatePct: tagging.cancellationRatePct,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body.", code: "BAD_REQUEST" }, { status: 400 });
  }
}
