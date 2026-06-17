"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { LoginSchema, type LoginDto } from "@velonix/game-engine";
import { useLogin } from "@/hooks/useAuth";
import { GoogleButton } from "@/components/molecules/GoogleButton";
import { Eye, EyeClosed } from "lucide-react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";

export function LoginForm() {
  const login = useLogin();
  const isProduction = process.env.NODE_ENV === 'production';
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = (data: LoginDto) => {
    if (isProduction && !turnstileToken) return; // Turnstile not yet solved
    login.mutate({ ...data, turnstileToken: isProduction ? turnstileToken : null });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <Input
        {...register("email")}
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={!!errors.email}
        errorMessage={errors.email?.message}
      />
      <div className="relative">
        <Input
          {...register("password")}
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Your password"
          autoComplete="current-password"
          error={!!errors.password}
          errorMessage={errors.password?.message}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-soft-gray hover:text-emerald-glow transition-colors"
        >
          {showPassword ? <EyeClosed size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            {...register("rememberMe")}
            type="checkbox"
            className="w-4 h-4 rounded border-warm-wood bg-rich-wood-mid accent-emerald-glow"
          />
          <span className="text-xs text-soft-gray font-ui">Remember me</span>
        </label>
        <Link
          href="/auth/forget-pass"
          className="text-xs text-emerald-glow hover:text-emerald-bright transition-colors font-ui"
        >
          Forgot password?
        </Link>
      </div>

      {isProduction && <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={setTurnstileToken}
        onExpire={() => setTurnstileToken(null)}
        onError={() => setTurnstileToken(null)}
      />}

      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting || login.isPending}
        disabled={isProduction && !turnstileToken}
        className="w-full mt-2"
      >
        Sign In
      </Button>

      <GoogleButton label="Sign in with Google" />
    </form>
  );
}
