import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { fetchCategories } from "../../src/lib/api/categories";

export default function CategoriesScreen() {
    const router = useRouter();

    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: fetchCategories,
    });

    return (
        <View className="flex-1 bg-screen pt-16">
            <View className="flex-row items-center justify-between border-b border-border px-4 pb-3.5 mb-6">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-[15px] text-secondary">‹ Back</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-emphasis">Categories</Text>
                <TouchableOpacity testID="add-category-button" onPress={() => router.push("/category/new")} className="h-9 w-9 items-center justify-center rounded-full bg-accent">
                    <Text className="text-lg font-semibold text-screen">+</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={categoriesQuery.data ?? []}
                keyExtractor={(category) => category.id}
                contentContainerClassName="gap-2.5 px-4 pb-10"
                renderItem={({ item: category }) => (
                    <TouchableOpacity onPress={() => router.push(`/category/${category.id}`)} className="flex-row items-center gap-3 rounded-[11px] border border-border bg-elevated px-3.5 py-[13px]">
                        <View className="h-4 w-4 rounded" style={{ backgroundColor: category.color }} />
                        <Text className="flex-1 text-[15px] font-semibold text-emphasis">{category.name}</Text>
                        <Text className="text-muted">›</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="items-center gap-2 px-6 py-16">
                        <Text className="text-neutral-500">No categories yet.</Text>
                    </View>
                }
            />
        </View>
    );
}
