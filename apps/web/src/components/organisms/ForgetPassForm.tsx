"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { LoginSchema, type LoginDto } from "@velonix/game-engine";
import { useLogin } from "@/hooks/useAuth";
import { GoogleButton } from "@/components/molecules/GoogleButton";

export function ForgetPassForm() {
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
    <form onSubmit={handleSubmit((data) => {
        console.log(data);
    })} noValidate className="flex flex-col gap-4">
      <Input
        {...register("email")}
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={!!errors.email}
        errorMessage={errors.email?.message}
      />

      <Button type="submit" variant="primary" isLoading={isSubmitting || login.isPending} className="w-full mt-2">
        Send Code
      </Button>

      <GoogleButton label="Sign in with Google" />
    </form>
  );
}
