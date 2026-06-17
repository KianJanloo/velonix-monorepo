'use client'

import { z } from "zod";
import { RegisterCompleteSchema } from "@velonix/game-engine";
import { Button } from "../../atoms";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterComplete } from "@/hooks";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { OtpInput } from "../../atoms/OtpInput";

const FormSchema = RegisterCompleteSchema.pick({ code: true });
type FormValues = z.infer<typeof FormSchema>;

export function RegisterCompleteForm() {
  const registerComplete_ = useRegisterComplete();
  const registerEmail = useAuthStore((s) => s.registerEmail);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && (!registerEmail || !token)) {
      router.replace("/auth/register");
    }
  }, [hasHydrated, registerEmail, token, router]);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = (data: FormValues) => {
    registerComplete_.mutate({
      code: data.code,
      email: registerEmail!,
      token: token!,
    });
  };

  if (!hasHydrated || !registerEmail || !token) return null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
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
      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting || registerComplete_.isPending}
        className="w-full mt-2"
      >
        Create Account
      </Button>
      <p className="text-2xs text-soft-gray-dark font-ui text-center">
        By creating an account you agree to our{" "}
        <a className="text-emerald-glow font-bold" href="/terms">
          Terms of Service
        </a>{" "}
        and{" "}
        <a className="text-emerald-glow font-bold" href="/privacy">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
