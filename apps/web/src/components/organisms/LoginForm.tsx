"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { LoginSchema, type LoginDto } from "@velonix/game-engine";
import { useLogin } from "@/hooks/useAuth";

export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  return (
    <form onSubmit={handleSubmit((data) => login.mutate(data))} noValidate className="flex flex-col gap-4">
      <Input
        {...register("email")}
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={!!errors.email}
        errorMessage={errors.email?.message}
      />
      <Input
        {...register("password")}
        label="Password"
        type="password"
        placeholder="Your password"
        autoComplete="current-password"
        error={!!errors.password}
        errorMessage={errors.password?.message}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            {...register("rememberMe")}
            type="checkbox"
            className="w-4 h-4 rounded border-warm-wood bg-rich-wood-mid accent-emerald-glow"
          />
          <span className="text-xs text-soft-gray font-ui">Remember me</span>
        </label>
        <a href="#" className="text-xs text-emerald-glow hover:text-emerald-bright transition-colors font-ui">
          Forgot password?
        </a>
      </div>

      <Button type="submit" variant="primary" isLoading={isSubmitting || login.isPending} className="w-full mt-2">
        Sign In
      </Button>
    </form>
  );
}
