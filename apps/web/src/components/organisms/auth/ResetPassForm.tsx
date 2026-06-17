"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OtpInput } from "@/components/atoms/OtpInput";
import { Button } from "@/components/atoms/Button";
import { ResetPassDto, ResetPassSchema } from "@velonix/game-engine";
import { useResetPass } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { Input } from "@/components/atoms/Input";
import { getResetEmail, getToken } from "@/stores/authStore";
import { useRouter } from "next/navigation";

export function ResetPassForm() {
  const resetPass = useResetPass();
  const [showPassword, setShowPassword] = useState(false);
  const resetEmail = getResetEmail();
  const token = getToken();
  const router = useRouter();

  useEffect(() => {
    if (!resetEmail || !token) {
      router.replace("/auth/forget-pass");
    }
  }, [resetEmail, token, router]);

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPassDto>({
    resolver: zodResolver(ResetPassSchema),
    defaultValues: { email: "", newPassword: "", code: "", token: "" },
  });

  useEffect(() => {
    if (token) setValue("token", token);
    if (resetEmail) setValue("email", resetEmail);
  }, [token, resetEmail, setValue]);

  if (!resetEmail || !token) return null;

  return (
    <form
      onSubmit={handleSubmit((data) => resetPass.mutate(data))}
      noValidate
      className="flex flex-col gap-4"
    >
      <Controller
        name="code"
        control={control}
        render={({ field, fieldState }) => (
          <OtpInput
            label="Verification Code"
            length={6}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={!!fieldState.error}
            errorMessage={fieldState.error?.message}
          />
        )}
      />
      <div className="relative">
        <Input
          {...register("newPassword")}
          label="New Password"
          type={showPassword ? "text" : "password"}
          placeholder="Min. 8 chars, 1 uppercase, 1 number"
          autoComplete="new-password"
          error={!!errors.newPassword}
          errorMessage={errors.newPassword?.message}
        />
        <button
          type="button"
          onClick={() => setShowPassword((p) => !p)}
          className="absolute right-3 top-9 text-soft-gray hover:text-emerald-glow transition-colors"
        >
          {showPassword ? <EyeClosed size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting || resetPass.isPending}
        className="w-full mt-2"
      >
        Reset Password
      </Button>
    </form>
  );
}
