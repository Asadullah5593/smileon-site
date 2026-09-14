import { z } from "zod";
import { listQuerySchema } from "@/shared/api/list-query";

export const roleCreateSchema = z.object({
  name: z.string().trim().min(2, "Give the role a name.").max(80),
  description: z.string().max(300).nullish(),
  permissions: z.array(z.string()).default([]),
});

export const roleUpdateSchema = roleCreateSchema.partial();

export const userListQuerySchema = listQuerySchema.extend({
  roleId: z.string().optional(),
  active: z.enum(["true", "false"]).optional(),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(10, "Use at least 10 characters.").max(200),
  roleIds: z.array(z.string()).default([]),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z
    .email()
    .transform((v) => v.toLowerCase())
    .optional(),
  password: z.string().min(10).max(200).optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string()).optional(),
  /** Per-user overrides layered on top of the roles above. */
  overrides: z
    .array(z.object({ permission: z.string(), effect: z.enum(["ALLOW", "DENY"]) }))
    .optional(),
});

export type RoleCreateInput = z.infer<typeof roleCreateSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export type RoleDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  isSuperAdmin: boolean;
  permissions: string[];
  userCount: number;
};

export type UserDto = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  roles: { id: string; name: string; slug: string }[];
  overrides: { permission: string; effect: "ALLOW" | "DENY" }[];
  /** Fully resolved set, so the admin UI can show what the user really has. */
  effectivePermissions: string[];
  isSuperAdmin: boolean;
};
