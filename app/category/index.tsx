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
        <View className="flex-1 bg-neutral-950 pt-16">
            <View className="flex-row items-center justify-between px-4 pb-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-neutral-400">‹ Back</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-neutral-100">Categories</Text>
                <TouchableOpacity testID="add-category-button" onPress={() => router.push("/category/new")} className="h-9 w-9 items-center justify-center rounded-lg bg-amber-400">
                    <Text className="text-lg font-semibold text-neutral-950">+</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={categoriesQuery.data ?? []}
                keyExtractor={(category) => category.id}
                contentContainerClassName="gap-2.5 px-4 pb-10"
                renderItem={({ item: category }) => (
                    <TouchableOpacity onPress={() => router.push(`/category/${category.id}`)} className="flex-row items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3.5">
                        <View className="h-4 w-4 rounded" style={{ backgroundColor: category.color }} />
                        <Text className="flex-1 text-sm font-semibold text-neutral-100">{category.name}</Text>
                        <Text className="text-neutral-600">›</Text>
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
