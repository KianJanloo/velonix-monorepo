"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { ForgetPassDto, ForgetPassSchema } from "@velonix/game-engine";
import { useForgetPass } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";

export function ForgetPassForm() {
  const forgetPass = useForgetPass();
  const { setResetEmail } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgetPassDto>({
    resolver: zodResolver(ForgetPassSchema),
    defaultValues: { email: "" },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => {
        forgetPass.mutate(data);
        setResetEmail(data.email);
      })}
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

      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting || forgetPass.isPending}
        className="w-full mt-2"
      >
        Send Code
      </Button>
    </form>
  );
}
