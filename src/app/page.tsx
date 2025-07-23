'use client';

import { AuthPage } from "@/components/AuthPage";
import { useRouter } from "next/navigation";

export default function HomePage() {


  return (
    <div className="flex flex-col min-h-screen">
      <AuthPage  />
    </div>
  );
}