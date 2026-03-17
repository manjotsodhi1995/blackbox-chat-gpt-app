"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/app/components/ui/card";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call
      console.log("Login submitted:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-[#ededed]">
            Blackbox AI
          </h1>
          <p className="mt-2 text-sm text-[#737373] dark:text-[#a3a3a3]">
            Welcome back
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[#737373] hover:text-[#171717] dark:text-[#a3a3a3] dark:hover:text-[#ededed] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#d4d4d4] text-[#171717] focus:ring-[#171717]/20 dark:border-[#404040] dark:focus:ring-[#ededed]/20 cursor-pointer"
                  {...register("rememberMe")}
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>

              <p className="text-sm text-center text-[#737373] dark:text-[#a3a3a3]">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-[#171717] hover:underline dark:text-[#ededed]"
                >
                  Create account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
