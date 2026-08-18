import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { fetchCategories } from "../src/lib/api/categories";
import { fetchItems } from "../src/lib/api/items";
import type { Category, Item } from "../src/lib/api/schemas";
import { useAuth } from "../src/lib/auth/AuthContext";

const CATEGORY_COLOR_TEXT: Record<string, string> = {
    "#ef4444": "text-red-400",
    "#f97316": "text-orange-400",
    "#f59e0b": "text-amber-400",
    "#22c55e": "text-green-400",
    "#14b8a6": "text-teal-400",
    "#3b82f6": "text-blue-400",
    "#a855f7": "text-purple-400",
    "#ec4899": "text-pink-400",
};

function categoryTextClass(color: string): string {
    return CATEGORY_COLOR_TEXT[color] ?? "text-neutral-400";
}

function ImportanceDots({ importance }: { importance: number }) {
    return (
        <View className="flex-row gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Text key={n} className={n <= importance ? "text-amber-400" : "text-neutral-700"}>
                    ●
                </Text>
            ))}
        </View>
    );
}

function ItemCard({ item, category }: { item: Item; category: Category | undefined }) {
    return (
        <TouchableOpacity className="flex-row gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-2.5">
            {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} className="h-20 w-20 rounded-lg" />
            ) : (
                <View className="h-20 w-20 items-center justify-center rounded-lg bg-neutral-800">
                    <Text className={`text-[9px] font-semibold uppercase ${categoryTextClass(category?.color ?? "")}`}>{category?.name ?? "Uncategorized"}</Text>
                </View>
            )}

            <View className="flex-1 justify-center gap-1">
                <Text numberOfLines={1} className="text-sm font-semibold text-neutral-100">
                    {item.title}
                </Text>
                {item.description ? (
                    <Text numberOfLines={2} className="text-xs text-neutral-400">
                        {item.description}
                    </Text>
                ) : null}
                <View className="mt-1 flex-row items-center justify-between">
                    <ImportanceDots importance={item.importance} />
                    <Text className="text-[10px] text-neutral-500">{item.isArchived ? "Restore" : "Mark done"}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function Index() {
    const { logout } = useAuth();
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const router = useRouter();

    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: fetchCategories,
    });

    const itemsQuery = useQuery({
        queryKey: ["items", selectedCategoryId],
        queryFn: () =>
            fetchItems({
                category: selectedCategoryId ? [selectedCategoryId] : undefined,
            }),
    });

    const categoryById = useMemo(() => {
        const map = new Map<string, Category>();
        for (const category of categoriesQuery.data ?? []) {
            map.set(category.id, category);
        }
        return map;
    }, [categoriesQuery.data]);

    return (
        <View className="flex-1 bg-neutral-950 pt-16">
            <View className="flex-row items-center justify-between px-4 pb-3">
                <View>
                    <Text className="text-2xl text-neutral-100">Everly</Text>
                    <Text className="text-[9px] italic font-semibold uppercase tracking-wide text-amber-400">A list of things worth doing</Text>
                </View>
                <TouchableOpacity onPress={logout} className="rounded-lg bg-neutral-800 px-3 py-2">
                    <Text className="text-xs text-neutral-100">Log out</Text>
                </TouchableOpacity>
            </View>

            <View className="mb-2">
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="gap-2 px-4"
                    data={categoriesQuery.data ?? []}
                    keyExtractor={(category) => category.id}
                    ListHeaderComponent={
                        <TouchableOpacity onPress={() => setSelectedCategoryId(null)} className={`rounded-lg px-3 py-2 ${selectedCategoryId === null ? "bg-amber-400" : "bg-neutral-800"}`}>
                            <Text className={selectedCategoryId === null ? "text-xs font-semibold text-neutral-950" : "text-xs text-neutral-300"}>All</Text>
                        </TouchableOpacity>
                    }
                    renderItem={({ item: category }) => (
                        <TouchableOpacity onPress={() => setSelectedCategoryId(category.id)} className={`ml-2 rounded-lg px-3 py-2 ${selectedCategoryId === category.id ? "bg-amber-400" : "bg-neutral-800"}`}>
                            <Text className={selectedCategoryId === category.id ? "text-xs font-semibold text-neutral-950" : "text-xs text-neutral-300"}>{category.name}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {itemsQuery.isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-neutral-500">Loading...</Text>
                </View>
            ) : itemsQuery.isError ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-center text-red-400">Could not load your list. Pull down to try again.</Text>
                </View>
            ) : itemsQuery.data && itemsQuery.data.items.length === 0 ? (
                <View className="flex-1 items-center justify-center gap-2 px-6">
                    <Text className="text-lg text-neutral-100">Your list is empty</Text>
                    <Text className="text-center text-sm text-neutral-500">Heard about a great restaurant, a trip worth taking, or a show you can't miss? Add it here so you never forget.</Text>
                </View>
            ) : (
                <FlatList data={itemsQuery.data?.items ?? []} keyExtractor={(item) => item.id} contentContainerClassName="gap-2.5 px-4 pb-24" refreshControl={<RefreshControl refreshing={itemsQuery.isRefetching} onRefresh={() => itemsQuery.refetch()} tintColor="#fbbf24" colors={["#fbbf24"]} progressBackgroundColor="#171717" />} renderItem={({ item }) => <ItemCard item={item} category={categoryById.get(item.categoryId)} />} />
            )}

            <TouchableOpacity onPress={() => router.push("/item-create")} className="absolute bottom-8 right-6 h-14 w-14 items-center justify-center rounded-full bg-amber-400">
                <Text className="text-2xl font-semibold text-neutral-950">+</Text>
            </TouchableOpacity>
        </View>
    );
}
