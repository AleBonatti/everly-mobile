import { z } from "zod";

// Auth

export const registerInputSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email().toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters"),
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
    email: z.email().toLowerCase(),
    password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const forgotPasswordInputSchema = z.object({
    email: z.email().toLowerCase(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;

export const authUserWithTokenSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    emailVerified: z.boolean(),
    token: z.string().optional(),
});
export type AuthUserWithToken = z.infer<typeof authUserWithTokenSchema>;

export const authUserSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    emailVerified: z.boolean(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const updateProfileInputSchema = z.object({
    name: z.string().min(1, "Name is required"),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const changePasswordInputSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

// Categories

export const CATEGORY_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6", "#3b82f6", "#a855f7", "#ec4899"] as const;

export const categoryColorSchema = z.enum(CATEGORY_COLORS);
export type CategoryColor = z.infer<typeof categoryColorSchema>;

export const categorySchema = z.object({
    id: z.uuid(),
    name: z.string(),
    color: categoryColorSchema,
    isDefault: z.boolean(),
});
export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
    name: z.string().min(1, "Name is required"),
    color: categoryColorSchema,
});
export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const updateCategoryInputSchema = createCategoryInputSchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Items

export const createItemInputSchema = z.object({
    categoryId: z.uuid(),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    notes: z.string().optional(),
    imageUrl: z.url().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    locationLabel: z.string().optional(),
    importance: z.number().int().min(1).max(5).optional(),
});
export type CreateItemInput = z.infer<typeof createItemInputSchema>;

export const updateItemInputSchema = createItemInputSchema.partial().extend({
    isArchived: z.boolean().optional(),
});
export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;

export const itemSchema = z.object({
    id: z.uuid(),
    categoryId: z.uuid(),
    title: z.string(),
    description: z.string().nullable(),
    notes: z.string().nullable(),
    imageUrl: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    locationLabel: z.string().nullable(),
    importance: z.number(),
    isArchived: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type Item = z.infer<typeof itemSchema>;

export const itemsQuerySchema = z.object({
    category: z.array(z.string()).optional(),
    q: z.string().optional(),
    archived: z.boolean().default(false),
    sort: z.enum(["newest", "importance"]).default("newest"),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(12),
});
export type ItemsQuery = z.infer<typeof itemsQuerySchema>;

export const paginatedItemsSchema = z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
});
export type PaginatedItems = z.infer<typeof paginatedItemsSchema>;
