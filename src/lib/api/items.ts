import { apiFetch } from "./client";
import { itemsQuerySchema, paginatedItemsSchema, type ItemsQuery, type PaginatedItems } from "./schemas";

export async function fetchItems(query: Partial<ItemsQuery> = {}): Promise<PaginatedItems> {
    const parsed = itemsQuerySchema.parse(query);

    const params = new URLSearchParams();
    if (parsed.category) params.set("category", parsed.category.join(","));
    if (parsed.q) params.set("q", parsed.q);
    params.set("archived", String(parsed.archived));
    params.set("sort", parsed.sort);
    params.set("page", String(parsed.page));
    params.set("pageSize", String(parsed.pageSize));

    const result = await apiFetch<unknown>(`/items?${params.toString()}`);
    return paginatedItemsSchema.parse(result);
}
