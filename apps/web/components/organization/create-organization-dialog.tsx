"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/ui/field";
import { Input } from "@/ui/input";

const createOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
});

type CreateOrgFormData = z.infer<typeof createOrgSchema>;

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (slug?: string) => void;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateOrgFormData>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const nameValue = watch("name");

  // Auto-generate slug from name
  useEffect(() => {
    if (nameValue) {
      setValue("slug", generateSlug(nameValue));
    }
  }, [nameValue, setValue]);

  const onSubmit = async (data: CreateOrgFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.organization.create({
        name: data.name,
        slug: data.slug,
      });

      if (result.error) {
        setError(result.error.message || "Failed to create organization");
        return;
      }

      // Set the new organization as active
      if (result.data?.id) {
        await authClient.organization.setActive({
          organizationId: result.data.id,
        });
      }

      reset();
      onOpenChange(false);
      onSuccess?.(data.slug);
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create a new team</DialogTitle>
            <DialogDescription>
              Create a team to collaborate with others. You can invite members after creating.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="name">Team Name</FieldLabel>
              <Input
                id="name"
                placeholder="Acme Inc"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <FieldDescription className="text-destructive">
                  {errors.name.message}
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="slug">URL Slug</FieldLabel>
              <Input
                id="slug"
                placeholder="acme-inc"
                {...register("slug")}
                disabled={isLoading}
              />
              {errors.slug ? (
                <FieldDescription className="text-destructive">
                  {errors.slug.message}
                </FieldDescription>
              ) : (
                <FieldDescription>
                  This will be used in URLs. Only lowercase letters, numbers, and hyphens.
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
