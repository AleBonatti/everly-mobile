import { apiFetch } from "./client";
import { categorySchema, createCategoryInputSchema, updateCategoryInputSchema, type Category, type CreateCategoryInput, type UpdateCategoryInput } from "./schemas";
import { z } from "zod";

export async function fetchCategories(): Promise<Category[]> {
    const result = await apiFetch<unknown>("/categories");
    return z.array(categorySchema).parse(result);
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
    const parsed = createCategoryInputSchema.parse(input);
    const result = await apiFetch<unknown>("/categories", {
        method: "POST",
        body: parsed,
    });
    return categorySchema.parse(result);
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput): Promise<Category> {
    const parsed = updateCategoryInputSchema.parse(input);
    const result = await apiFetch<unknown>(`/categories/${categoryId}`, {
        method: "PATCH",
        body: parsed,
    });
    return categorySchema.parse(result);
}

export async function deleteCategory(categoryId: string): Promise<void> {
    await apiFetch<unknown>(`/categories/${categoryId}`, {
        method: "DELETE",
    });
}
