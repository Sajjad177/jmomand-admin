"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  authPost,
  readPasswordResetToken,
  TokenResponse,
  writePasswordResetToken,
} from "@/lib/auth-client";
import { toast } from "sonner";

const OTP_LENGTH = 6;

export default function OtpVerificationCard() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!readPasswordResetToken()) {
      router.replace("/forgot-password");
    }
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => code[index] || "");

  const updateDigit = (index: number, digit: string) => {
    const nextDigits = digits.slice();
    nextDigits[index] = digit;
    setCode(nextDigits.join("").slice(0, OTP_LENGTH));

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key !== "Backspace" || digits[index]) return;
    inputsRef.current[index - 1]?.focus();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pastedCode = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    setCode(pastedCode);
    inputsRef.current[Math.min(pastedCode.length, OTP_LENGTH - 1)]?.focus();
  };

  const onSubmit = async () => {
    if (code.length !== OTP_LENGTH) {
      setError("Please enter the 6 digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = readPasswordResetToken();
      const response = await authPost<TokenResponse>(
        "/auth/verify-otp",
        { otp: code },
        token,
      );

      if (response.data?.accessToken) {
        writePasswordResetToken(response.data.accessToken);
      }

      router.push("/change-password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setLoading(true);
    setError("");
    try {
      await authPost("/auth/resend-forgot-otp", {}, readPasswordResetToken());
      setCooldown(60);
      toast.success("A new verification code has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7f9] p-4">
      <div className="w-full max-w-[540px] rounded-xl border border-slate-100 bg-white p-10 shadow-sm">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Verify code</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter the 6 digit code sent to your email
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-6 gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(input) => {
                  inputsRef.current[index] = input;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                disabled={loading}
                onPaste={handlePaste}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onChange={(event) =>
                  updateDigit(index, event.target.value.replace(/\D/g, "").slice(-1))
                }
                className="h-12 w-full rounded-md border border-slate-200 text-center text-lg font-semibold text-slate-900 outline-none transition focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
            ))}
          </div>

          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            disabled={loading}
            onClick={onSubmit}
            className="h-12 w-full bg-orange-500 hover:bg-orange-600"
          >
            {loading ? "Verifying..." : "Verify code"}
          </Button>

          <button
            type="button"
            disabled={loading || cooldown > 0}
            onClick={onResend}
            className="w-full text-sm font-medium text-orange-600 disabled:text-slate-400"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Use another email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
