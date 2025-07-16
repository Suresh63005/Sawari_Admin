'use client';

import { AuthPage } from "@/components/AuthPage";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const handleLogin = (user: any) => {
    // Store user data if needed (e.g., in context or localStorage)
    console.log("Logged in user:", user);
    router.push("/dashboard"); // Redirect to dashboard after login
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AuthPage onLogin={handleLogin} />
    </div>
  );
}