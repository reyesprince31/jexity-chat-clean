"use client";

import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    cadence: "/month",
    badge: "Active",
    badgeVariant: "secondary" as const,
    features: ["Another amazing feature", "Limited support"],
    cta: "Current plan",
    ctaVariant: "secondary" as const,
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "/month",
    badge: "Recommended",
    badgeVariant: "default" as const,
    features: ["Another amazing feature", "Full support", "7 days free trial"],
    cta: "Choose plan",
    ctaVariant: "default" as const,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "pricing",
    features: ["Unlimited projects", "Enterprise support"],
    cta: "Contact sales",
    ctaVariant: "outline" as const,
  },
];

export default function BillingPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          View your current plan and explore other options.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Your plan
            <Badge variant="secondary">Free</Badge>
          </CardTitle>
          <CardDescription>Another amazing feature · Limited support</CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Change your plan</h2>
          <p className="text-sm text-muted-foreground">
            Choose a plan to subscribe to.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className="flex flex-col">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.badge && (
                    <Badge variant={plan.badgeVariant}>{plan.badge}</Badge>
                  )}
                </div>
                <CardDescription>
                  Best for teams that need a straightforward way to get started.
                </CardDescription>
                <div className="text-3xl font-semibold leading-tight">
                  {plan.price}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    {plan.cadence}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="size-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={plan.ctaVariant} className="mt-auto">
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
