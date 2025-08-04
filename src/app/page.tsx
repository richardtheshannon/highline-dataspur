"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col items-center text-center lg:max-w-none">
        
        <div className="mb-8">
          <Image
            src="/media/hoiz-logo-title-subtitle-01.png"
            alt="Salesfield Network Logo"
            width={400}
            height={115}
            priority
          />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Highline DataSpur
        </h1>
        
        <div className="mt-8 flex items-center justify-center gap-4">
          {mounted && (
            <div className="flex items-center space-x-2">
              <Sun className="h-5 w-5" />
              <Switch
                id="theme-toggle"
                checked={theme === "dark"}
                onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              />
              <Moon className="h-5 w-5" />
            </div>
          )}

          <Link href="/auth/signup">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/auth/signin">
            <Button variant="outline" size="lg">
              Log In
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-lg text-muted-foreground max-w-[500px]">
          Highline DataSpur is a unified dashboard that streamlines social media analytics, financial insights, and forecasting through automated reporting and cross-platform comparison.
        </p>

      </div>
    </div>
  );
}
