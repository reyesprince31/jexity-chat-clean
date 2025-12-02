"use client";

import { useMemo, useState } from "react";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";
import { mockCurrentPlanId } from "@/lib/mock-data";
import { ProBadge } from "@/components/dashboard/pro-badge";

 type ThemeMode = "light" | "dark" | "auto";

 interface WidgetConfig {
  theme: ThemeMode;
  primaryColor: string;
  borderRadius: number;
  position: "bottom-right" | "bottom-left";
  botName: string;
  welcomeMessage: string;
  placeholder: string;
  showPoweredBy: boolean;
  autoOpen: boolean;
  showTyping: boolean;
 }

 export function WidgetCustomizer() {
  const colorOptions = useMemo(
    () => [
      "#4f46e5", // indigo
      "#0ea5e9", // sky
      "#22c55e", // emerald
      "#f97316", // orange
      "#ef4444", // red
      "#a855f7", // violet
    ],
    [],
  );

  const isPro = mockCurrentPlanId === "pro";

  const [config, setConfig] = useState<WidgetConfig>({
    theme: "dark",
    primaryColor: colorOptions[0] ?? "#4f46e5",
    borderRadius: 18,
    position: "bottom-right",
    botName: "Jexity Assistant",
    welcomeMessage: "Hi! I\'m here to help with your questions.",
    placeholder: "Type your message...",
    showPoweredBy: true,
    autoOpen: true,
    showTyping: true,
  });

  const handleChange = <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const previewBg =
    config.theme === "dark"
      ? "bg-slate-900 text-slate-50"
      : config.theme === "light"
      ? "bg-white text-slate-900"
      : "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-50";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground">Configuration</h2>
          <p className="text-xs text-muted-foreground">
            Adjust how the chat widget looks and behaves. All values are mock for now.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Theme, colors, and border radius.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Theme</Label>
                  {!isPro && <ProBadge />}
                </div>
                <Select
                  value={config.theme}
                  onValueChange={(value) =>
                    isPro && handleChange("theme", value as ThemeMode)
                  }>
                  <SelectTrigger disabled={!isPro}>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto (match system)</SelectItem>
                  </SelectContent>
                </Select>
                {!isPro && (
                  <p className="text-[11px] text-muted-foreground">
                    Changing theme is a Pro feature.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Primary color</Label>
                  {!isPro && <ProBadge />}
                </div>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color, index) => {
                    const isActive = config.primaryColor === color;
                    const isLocked = !isPro && index !== 0;

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          if (isLocked) return;
                          handleChange("primaryColor", color);
                        }}
                        className={cn(
                          "relative h-6 w-10 rounded-full border-2 transition-transform",
                          isActive ? "scale-105 border-primary" : "border-transparent opacity-80",
                          isLocked && "cursor-not-allowed opacity-60",
                        )}
                        style={{ backgroundColor: color }}>
                        {isLocked && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-white/90">
                            PRO
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!isPro && (
                  <p className="text-[11px] text-muted-foreground">
                    Free plan uses the default color. Additional brand colors are
                    available on Pro.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="borderRadius">Border radius</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="borderRadius"
                    type="range"
                    min={0}
                    max={32}
                    value={config.borderRadius}
                    onChange={(e) => handleChange("borderRadius", Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-10 text-right text-xs text-muted-foreground">
                    {config.borderRadius}px
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={config.position}
                  onValueChange={(value) =>
                    handleChange("position", value as WidgetConfig["position"])
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom right</SelectItem>
                    <SelectItem value="bottom-left">Bottom left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding & copy</CardTitle>
            <CardDescription>Bot identity and welcome message.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botName">Bot name</Label>
              <Input
                id="botName"
                value={config.botName}
                onChange={(e) => handleChange("botName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Welcome message</Label>
              <Textarea
                id="welcomeMessage"
                value={config.welcomeMessage}
                onChange={(e) => handleChange("welcomeMessage", e.target.value)}
                className="min-h-[64px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="placeholder">Input placeholder</Label>
              <Input
                id="placeholder"
                value={config.placeholder}
                onChange={(e) => handleChange("placeholder", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Behavior</CardTitle>
            <CardDescription>Purely visual toggles for MVP.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <ToggleRow
              label="Show Powered by Jexity badge"
              checked={config.showPoweredBy}
              onChange={(value) => {
                if (!isPro) return;
                handleChange("showPoweredBy", value);
              }}
            />
            <ToggleRow
              label="Auto-open on first visit"
              checked={config.autoOpen}
              onChange={(value) => handleChange("autoOpen", value)}
            />
            <ToggleRow
              label="Show typing indicators"
              checked={config.showTyping}
              onChange={(value) => handleChange("showTyping", value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Embed code</CardTitle>
            <CardDescription>
              Add this script before the closing &lt;/body&gt; tag on your site to
              load the widget (mock only).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-[11px]"><code>{`<script
  src="https://cdn.jexity.ai/widget.js"
  data-team-id="YOUR_TEAM_ID"
  async
></script>`}</code></pre>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Copy the snippet above.</li>
              <li>Paste it before the closing &lt;/body&gt; tag on your site.</li>
              <li>Deploy your site and verify the widget appears.</li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="h-7 px-2 text-[11px]">
              Copy embed snippet (mock)
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card
            className={cn(
              "shadow-lg",
              previewBg,
            )}
            style={{
              borderRadius: config.borderRadius,
              borderColor: config.primaryColor,
              borderWidth: 1,
            }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold">
                  JX
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {config.botName}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/80">
                    Typically replies in under 2 minutes
                  </CardDescription>
                </div>
              </div>
              {(!isPro || config.showPoweredBy) && (
                <Badge
                  variant="outline"
                  className="border-white/10 bg-white/5 text-[10px] uppercase tracking-wide text-white">
                  Powered by Jexity
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-2">
                <ChatBubble
                  align="left"
                  accentColor={config.primaryColor}
                  variant="bot">
                  {config.welcomeMessage}
                </ChatBubble>
                <ChatBubble align="right" accentColor={config.primaryColor}>
                  I have a question about pricing.
                </ChatBubble>
                {config.showTyping && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[10px] text-muted-foreground">
                    <span className="size-1 animate-pulse rounded-full bg-muted-foreground" />
                    <span className="size-1 animate-pulse rounded-full bg-muted-foreground delay-75" />
                    <span className="size-1 animate-pulse rounded-full bg-muted-foreground delay-150" />
                    <span>Jexity is typing...</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-full bg-background/80 px-3 py-2">
                <span className="flex-1 truncate text-[11px] text-muted-foreground">
                  {config.placeholder}
                </span>
                <div
                  className="flex size-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: config.primaryColor }}>
                  <span>&gt;</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Preview is static and uses mock content. Position ({config.position}) is
            for visualization only.
          </p>
        </div>
      </div>
    </div>
  );
 }

 interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
 }

 function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors",
        checked
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-background hover:bg-muted/60",
      )}>
      <span className="mr-4 text-[11px] font-medium text-foreground">
        {label}
      </span>
      <span
        className={cn(
          "inline-flex h-5 w-10 items-center rounded-full border px-0.5",
          checked
            ? "border-primary bg-primary/80 justify-end"
            : "border-border bg-muted justify-start",
        )}>
        <span className="h-4 w-4 rounded-full bg-background shadow" />
      </span>
    </button>
  );
 }

 interface ChatBubbleProps {
  children: React.ReactNode;
  align?: "left" | "right";
  accentColor: string;
  variant?: "bot" | "user";
 }

 function ChatBubble({ children, align = "left", accentColor, variant = "user" }: ChatBubbleProps) {
  const isRight = align === "right";

  return (
    <div className={cn("flex", isRight && "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-[11px]",
          variant === "bot"
            ? "bg-background/95 text-foreground"
            : "bg-background/80 text-foreground",
        )}
        style={
          variant === "bot"
            ? { borderLeft: `3px solid ${accentColor}` }
            : undefined
        }>
        {children}
      </div>
    </div>
  );
 }
