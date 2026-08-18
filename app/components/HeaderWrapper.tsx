"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function HeaderWrapper() {
  const pathname = usePathname();

  // Hide public header inside dashboard and admin areas
  const isAuthRoute = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");

  if (isAuthRoute) return null;

  return <Header />;
}