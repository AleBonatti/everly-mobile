import { apiFetch } from "./client";
import { categorySchema, type Category } from "./schemas";
import { z } from "zod";

export async function fetchCategories(): Promise<Category[]> {
    const result = await apiFetch<unknown>("/categories");
    return z.array(categorySchema).parse(result);
}
