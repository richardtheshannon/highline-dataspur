// src/app/dashboard/settings/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useLayoutPreference } from '@/lib/hooks/use-layout-preference';
import { cn } from "@/lib/utils";


export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { preference, setPreference } = useLayoutPreference();

  // We wait until the component is mounted to render it
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }
  
  const handleLayoutChange = (value: 'left-handed' | 'right-handed') => {
    setPreference(value);
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your application preferences and settings.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how the application looks and feels.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode" className="text-base font-medium">
                  Dark Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes. Your preference will be saved for this session.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={handleThemeToggle}
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            {/* New section for layout preference */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="layout-preference" className="text-base font-medium">
                  Handedness
                </Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred navigation sidebar position.
                </p>
              </div>
              <RadioGroup
                value={preference}
                onValueChange={handleLayoutChange}
                className="flex items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="left-handed" id="left-handed" />
                  <Label htmlFor="left-handed">Left-handed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="right-handed" id="right-handed" />
                  <Label htmlFor="right-handed">Right-handed</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>
              Information about your Project Planning Application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Version</span>
                <span className="text-sm text-muted-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Framework</span>
                <span className="text-sm text-muted-foreground">Next.js 13.5.6</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Database</span>
                <span className="text-sm text-muted-foreground">MySQL with Prisma</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
