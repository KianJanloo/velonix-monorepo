"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { RegisterSchema, type RegisterDto } from "@velonix/game-engine";
import { useRegister } from "@/hooks/useAuth";
import { GoogleButton } from "@/components/molecules/GoogleButton";
import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";

export function RegisterForm() {
  const register_ = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterDto>({
    resolver: zodResolver(RegisterSchema),
  });

  return (
    <form
      onSubmit={handleSubmit((data) => register_.mutate(data))}
      noValidate
      className="flex flex-col gap-4"
    >
      <Input
        {...register("displayName")}
        label="Display Name"
        placeholder="How you appear to others"
        error={!!errors.displayName}
        errorMessage={errors.displayName?.message}
      />
      <Input
        {...register("username")}
        label="Username"
        placeholder="your_handle"
        autoComplete="username"
        hint="Letters, numbers, underscores, hyphens only."
        error={!!errors.username}
        errorMessage={errors.username?.message}
      />
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
          placeholder="Min. 8 chars, 1 uppercase, 1 number"
          autoComplete="new-password"
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
      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting || register_.isPending}
        className="w-full mt-2"
      >
        Create Account — Free
      </Button>
      <GoogleButton label="Sign up with Google" />
      <p className="text-2xs text-soft-gray-dark font-ui text-center">
        By creating an account you agree to our Terms of Service and Privacy
        Policy.
      </p>
    </form>
  );
}
