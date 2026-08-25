import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { z } from "zod";
import { createCategory, deleteCategory, updateCategory } from "../../src/lib/api/categories";
import { ApiError } from "../../src/lib/api/client";
import { CATEGORY_COLORS, type Category } from "../../src/lib/api/schemas";
import { withMinDelay } from "../../src/lib/withMinDelay";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    color: z.enum(CATEGORY_COLORS),
});

type FormValues = z.infer<typeof formSchema>;

function findCachedCategory(queryClient: ReturnType<typeof useQueryClient>, categoryId: string): Category | undefined {
    const queries = queryClient.getQueriesData<Category[]>({ queryKey: ["categories"] });
    for (const [, data] of queries) {
        const found = data?.find((category) => category.id === categoryId);
        if (found) return found;
    }
    return undefined;
}

export default function CategoryEditScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { id } = useLocalSearchParams<{ id: string }>();
    const isEditing = id !== "new";

    const existingCategory = isEditing ? findCachedCategory(queryClient, id) : undefined;

    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: existingCategory?.name ?? "",
            color: existingCategory?.color ?? CATEGORY_COLORS[0],
        },
    });

    const previewName = watch("name");
    const previewColor = watch("color");

    async function onSubmit(values: FormValues) {
        setIsSaving(true);
        try {
            await withMinDelay(isEditing ? updateCategory(id, values) : createCategory(values));
            router.back();
            await queryClient.invalidateQueries({ queryKey: ["categories"] });
        } catch (err) {
            console.error("Save category error:", err);
            Alert.alert("Could not save", "Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    function confirmDelete() {
        Alert.alert("Delete category", `Delete "${existingCategory?.name ?? "this category"}"? This can't be undone.`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: onDelete },
        ]);
    }

    async function onDelete() {
        setIsDeleting(true);
        try {
            await withMinDelay(deleteCategory(id));
            router.back();
            await queryClient.invalidateQueries({ queryKey: ["categories"] });
        } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
                Alert.alert("Can't delete", "This category still has items in it. Move or delete those items first.");
            } else {
                console.error("Delete category error:", err);
                Alert.alert("Could not delete", "Something went wrong. Please try again.");
            }
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <View className="flex-1 bg-neutral-950 pt-16">
            <View className="flex-row items-center justify-between px-4 pb-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-neutral-400">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-base font-semibold text-neutral-100">{isEditing ? "Edit category" : "Add category"}</Text>
                <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={isSaving || isDeleting}>
                    {isSaving ? <ActivityIndicator color="#fbbf24" /> : <Text className="font-semibold text-amber-400">Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-10">
                <View className="gap-1.5">
                    <Text className="text-xs font-semibold text-neutral-400">Name</Text>
                    <Controller control={control} name="name" render={({ field: { value, onChange } }) => <TextInput value={value} onChangeText={onChange} placeholder="e.g. Restaurants" placeholderTextColor="#71717a" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100" />} />
                    {errors.name ? <Text className="text-xs text-red-400">{errors.name.message}</Text> : null}
                </View>

                <View className="gap-2">
                    <Text className="text-xs font-semibold text-neutral-400">Color</Text>
                    <Controller
                        control={control}
                        name="color"
                        render={({ field: { value, onChange } }) => (
                            <View className="flex-row flex-wrap gap-2.5">
                                {CATEGORY_COLORS.map((color) => (
                                    <TouchableOpacity key={color} onPress={() => onChange(color)} style={{ backgroundColor: color }} className={`h-9 w-9 rounded-lg ${value === color ? "border-2 border-neutral-100" : ""}`} />
                                ))}
                            </View>
                        )}
                    />
                </View>

                {previewName ? (
                    <View className="self-start rounded-md px-3 py-1.5" style={{ backgroundColor: previewColor }}>
                        <Text className="text-xs font-semibold uppercase text-neutral-950">{previewName}</Text>
                    </View>
                ) : null}

                {isEditing ? (
                    <TouchableOpacity onPress={confirmDelete} disabled={isDeleting} className="mt-2 items-center py-3">
                        <Text className="text-sm text-red-400">{isDeleting ? "Deleting..." : "Delete category"}</Text>
                    </TouchableOpacity>
                ) : null}
            </ScrollView>
        </View>
    );
}
