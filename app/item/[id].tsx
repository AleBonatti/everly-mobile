import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { z } from "zod";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { fetchCategories } from "../../src/lib/api/categories";
import { geocodeAddress, reverseGeocode } from "../../src/lib/api/geocoding";
import { createItem, deleteItem, updateItem, uploadItemImage } from "../../src/lib/api/items";
import { FormInput } from "../../src/components/FormInput";
import { CategoryChip } from "../../src/components/CategoryChip";
import { colors } from "../../src/lib/theme";
import type { Item, PaginatedItems } from "../../src/lib/api/schemas";
import { withMinDelay } from "../../src/lib/withMinDelay";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    categoryId: z.string().min(1, "Pick a category"),
    importance: z.number().int().min(1).max(5),
    address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function findCachedItem(queryClient: ReturnType<typeof useQueryClient>, itemId: string): Item | undefined {
    const queries = queryClient.getQueriesData<PaginatedItems>({ queryKey: ["items"] });
    for (const [, data] of queries) {
        const found = data?.items.find((item) => item.id === itemId);
        if (found) return found;
    }
    return undefined;
}

export default function ItemEditScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { id } = useLocalSearchParams<{ id: string }>();
    const isEditing = id !== "new";

    const existingItem = isEditing ? findCachedItem(queryClient, id) : undefined;

    const [pickedImage, setPickedImage] = useState<{ uri: string; mimeType: string | null } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(existingItem?.latitude != null && existingItem?.longitude != null ? { latitude: existingItem.latitude, longitude: existingItem.longitude } : null);
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: fetchCategories,
    });

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: existingItem?.title ?? "",
            description: existingItem?.description ?? "",
            categoryId: existingItem?.categoryId ?? "",
            importance: existingItem?.importance ?? 3,
            address: existingItem?.locationLabel ?? "",
        },
    });

    useEffect(() => {
        if (!isEditing && categoriesQuery.data && categoriesQuery.data[0]) {
            setValue("categoryId", categoriesQuery.data[0].id);
        }
    }, [isEditing, categoriesQuery.data, setValue]);

    useEffect(() => {
        if (pin) return;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            try {
                const position = await Location.getCurrentPositionAsync({});
                setCurrentLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
            } catch {
                // Ignore — fall back to the generic wide view.
            }
        })();
    }, [pin]);

    async function pickImage() {
        Alert.alert("Add photo", "Choose a source", [
            { text: "Camera", onPress: () => launchPicker("camera") },
            { text: "Photo Library", onPress: () => launchPicker("library") },
            { text: "Cancel", style: "cancel" },
        ]);
    }

    async function launchPicker(source: "camera" | "library") {
        const permission = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert("Permission needed", "Please allow access to continue.");
            return;
        }

        const result = source === "camera" ? await ImagePicker.launchCameraAsync({ quality: 0.7 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });

        if (!result.canceled && result.assets[0]) {
            const context = ImageManipulator.manipulate(result.assets[0].uri);
            const renderedImage = await context.renderAsync();
            const manipulated = await renderedImage.saveAsync({
                format: SaveFormat.JPEG,
                compress: 0.8,
            });
            setPickedImage({ uri: manipulated.uri, mimeType: "image/jpeg" });
        }
    }

    async function onSubmit(values: FormValues) {
        setIsSaving(true);
        try {
            await withMinDelay(
                (async () => {
                    let latitude: number | undefined;
                    let longitude: number | undefined;
                    let locationLabel: string | undefined;

                    if (pin) {
                        latitude = pin.latitude;
                        longitude = pin.longitude;
                        locationLabel = values.address && values.address.trim() ? values.address : undefined;
                    } else if (values.address && values.address.trim()) {
                        const geocoded = await geocodeAddress(values.address);
                        if (geocoded) {
                            latitude = geocoded.latitude;
                            longitude = geocoded.longitude;
                            locationLabel = values.address;
                        }
                    }

                    const payload = {
                        title: values.title,
                        description: values.description || undefined,
                        categoryId: values.categoryId,
                        importance: values.importance,
                        latitude,
                        longitude,
                        locationLabel,
                    };

                    const savedItem = isEditing ? await updateItem(id, payload) : await createItem(payload);

                    if (pickedImage) {
                        await uploadItemImage(savedItem.id, pickedImage.uri, pickedImage.mimeType);
                    }
                })(),
            );

            router.back();
            await queryClient.invalidateQueries({ queryKey: ["items"] });
        } catch (err) {
            console.error("Save item error:", err);
            Alert.alert("Could not save", "Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    function confirmDelete() {
        Alert.alert("Delete item", `Delete "${existingItem?.title ?? "this item"}"? This can't be undone.`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: onDelete },
        ]);
    }

    async function onDelete() {
        setIsDeleting(true);
        try {
            await withMinDelay(deleteItem(id));
            router.back();
            await queryClient.invalidateQueries({ queryKey: ["items"] });
        } catch (err) {
            console.error("Delete item error:", err);
            Alert.alert("Could not delete", "Something went wrong. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <KeyboardAvoidingView behavior="padding" className="flex-1 bg-screen pt-16">
            <View className="flex-row items-center justify-between px-4 pb-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-lg text-secondary">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-emphasis">{isEditing ? "Edit item" : "Add item"}</Text>
                <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={isSaving || isDeleting}>
                    {isSaving ? <ActivityIndicator color={colors.accent} /> : <Text className="text-lg font-bold text-accent">Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-10" keyboardShouldPersistTaps="handled">
                <TouchableOpacity onPress={pickImage} className="aspect-[2/1] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-elevated">
                    {pickedImage ? <Image source={{ uri: pickedImage.uri }} className="h-full w-full" /> : existingItem?.imageUrl ? <Image source={{ uri: existingItem.imageUrl }} className="h-full w-full" /> : <Text className="text-xs text-muted">TAP TO ADD PHOTO</Text>}
                </TouchableOpacity>

                <View className="gap-1.5">
                    <Text className="text-[13px] font-semibold text-muted">Title</Text>
                    <Controller control={control} name="title" render={({ field: { value, onChange } }) => <FormInput value={value} onChangeText={onChange} placeholder="e.g. Try the tasting menu at Lumen" />} />
                    {errors.title ? <Text className="text-xs text-red-400">{errors.title.message}</Text> : null}
                </View>

                <View className="gap-1.5">
                    <Text className="text-[13px] font-semibold text-muted">Description</Text>
                    <Controller control={control} name="description" render={({ field: { value, onChange } }) => <FormInput value={value} onChangeText={onChange} placeholder="Why is this worth doing?" multiline numberOfLines={3} />} />
                </View>

                <View className="gap-2">
                    <Text className="text-[13px] font-semibold text-muted">Category</Text>
                    <Controller
                        control={control}
                        name="categoryId"
                        render={({ field: { value, onChange } }) => (
                            <View className="flex-row flex-wrap gap-1.5">
                                {(categoriesQuery.data ?? []).map((category) => (
                                    <CategoryChip key={category.id} label={category.name} color={category.color} active={value === category.id} onPress={() => onChange(category.id)} />
                                ))}
                            </View>
                        )}
                    />
                    {errors.categoryId ? <Text className="text-xs text-red-400">{errors.categoryId.message}</Text> : null}
                </View>

                <View className="gap-2">
                    <Text className="text-[13px] font-semibold text-muted">Importance</Text>
                    <Controller
                        control={control}
                        name="importance"
                        render={({ field: { value, onChange } }) => (
                            <View className="flex-row gap-2">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <TouchableOpacity key={n} onPress={() => onChange(n)}>
                                        <Text className={`text-2xl ${n <= value ? "text-accent" : "text-border"}`}>●</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    />
                </View>

                <View className="gap-1.5">
                    <Text className="text-[13px] font-semibold text-muted">Location (optional)</Text>
                    <Controller
                        control={control}
                        name="address"
                        render={({ field: { value, onChange } }) => (
                            <FormInput
                                value={value}
                                onChangeText={onChange}
                                onSubmitEditing={async () => {
                                    if (!value || !value.trim()) return;
                                    const geocoded = await geocodeAddress(value);
                                    if (geocoded) {
                                        setPin({ latitude: geocoded.latitude, longitude: geocoded.longitude });
                                    }
                                }}
                                placeholder="e.g. Kyoto, Japan"
                            />
                        )}
                    />
                    <View className="mt-2 h-40 overflow-hidden rounded-lg">
                        <MapView
                            style={{ flex: 1 }}
                            region={{
                                latitude: pin?.latitude ?? currentLocation?.latitude ?? 40.7128,
                                longitude: pin?.longitude ?? currentLocation?.longitude ?? -74.006,
                                latitudeDelta: pin ? 0.05 : currentLocation ? 0.05 : 40,
                                longitudeDelta: pin ? 0.05 : currentLocation ? 0.05 : 40,
                            }}
                            onPress={async (event) => {
                                const { latitude, longitude } = event.nativeEvent.coordinate;
                                setPin({ latitude, longitude });
                                const label = await reverseGeocode(latitude, longitude);
                                if (label) {
                                    setValue("address", label);
                                }
                            }}>
                            {pin ? <Marker coordinate={pin} /> : null}
                        </MapView>
                    </View>
                </View>

                {isEditing ? (
                    <TouchableOpacity onPress={confirmDelete} disabled={isDeleting} className="mb-4 items-center py-3">
                        <Text className="text-sm text-red-400">{isDeleting ? "Deleting..." : "Delete item"}</Text>
                    </TouchableOpacity>
                ) : null}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
