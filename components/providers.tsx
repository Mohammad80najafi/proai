"use client";

import { LazyMotion, domAnimation } from "motion/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
      <Toaster
        dir="rtl"
        position="top-center"
        offset="72px"
        mobileOffset="72px"
        richColors
        toastOptions={{
          style: {
            background: "#131a27",
            border: "1px solid #2a3548",
            color: "#f5f7fb",
            fontFamily: "Vazirmatn Variable, Vazirmatn, sans-serif",
          },
        }}
      />
    </LazyMotion>
  );
}
