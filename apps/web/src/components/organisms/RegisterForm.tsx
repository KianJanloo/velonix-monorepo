"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { RegisterSchema, type RegisterDto } from "@velonix/game-engine";

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterDto>({
    resolver: zodResolver(RegisterSchema),
  });

  async function onSubmit(data: RegisterDto) {
    console.log("Register:", data);
    await new Promise((r) => setTimeout(r, 800));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
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
      <Input
        {...register("password")}
        label="Password"
        type="password"
        placeholder="Min. 8 chars, 1 uppercase, 1 number"
        autoComplete="new-password"
        error={!!errors.password}
        errorMessage={errors.password?.message}
      />
      <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full mt-2">
        Create Account — Free
      </Button>
      <p className="text-2xs text-soft-gray-dark font-ui text-center">
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
