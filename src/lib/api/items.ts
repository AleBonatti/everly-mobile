import { apiFetch, ApiError } from "./client";
import { createItemInputSchema, itemSchema, itemsQuerySchema, paginatedItemsSchema, type CreateItemInput, type Item, type ItemsQuery, type PaginatedItems } from "./schemas";
import { getToken } from "../auth/tokenStorage";
import { File, UploadType } from "expo-file-system";

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

export async function createItem(input: CreateItemInput): Promise<Item> {
    const parsed = createItemInputSchema.parse(input);
    const result = await apiFetch<unknown>("/items", {
        method: "POST",
        body: parsed,
    });
    return itemSchema.parse(result);
}

export async function uploadItemImage(itemId: string, imageUri: string, mimeType: string | null): Promise<Item> {
    const token = await getToken();
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;

    const resolvedType = mimeType && ["image/jpeg", "image/png", "image/webp"].includes(mimeType) ? mimeType : "image/jpeg";

    const file = new File(imageUri);

    const result = await file.upload(`${apiUrl}/items/${itemId}/image`, {
        uploadType: UploadType.MULTIPART,
        fieldName: "file",
        mimeType: resolvedType,
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (result.status < 200 || result.status >= 300) {
        const errorBody = JSON.parse(result.body || "{}");
        throw new ApiError(result.status, errorBody.message ?? "Image upload failed");
    }

    return itemSchema.parse(JSON.parse(result.body));
}
