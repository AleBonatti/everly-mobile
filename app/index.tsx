import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { AppState, FlatList, Image, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchCategories } from "../src/lib/api/categories";
import { fetchItems, updateItem } from "../src/lib/api/items";
import type { Category, Item } from "../src/lib/api/schemas";
import { useAuth } from "../src/lib/auth/AuthContext";
import { colors } from "../src/lib/theme";

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

function categoryBgTint(color: string): string {
    return color ? `${color}33` : "transparent";
}

const SORT_OPTIONS = [
    { value: "newest" as const, label: "Newest first" },
    { value: "importance" as const, label: "Most important" },
];

function ImportanceDots({ importance }: { importance: number }) {
    return (
        <View className="flex-row gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Text key={n} className={n <= importance ? "text-accent" : "text-border"}>
                    ●
                </Text>
            ))}
        </View>
    );
}

function ItemListCard({ item, category, onToggleArchive, onPress }: { item: Item; category: Category | undefined; onToggleArchive: () => void; onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} className="flex-row gap-3 rounded-xl border border-border bg-elevated p-2.5">
            {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} className="h-24 w-24 rounded-lg" />
            ) : (
                <View className="h-24 w-24 rounded-lg overflow-hidden" style={{ backgroundColor: categoryBgTint(category?.color ?? "") }}>
                    <View className="absolute bottom-1 left-1 right-1 rounded bg-black/70 py-1">
                        <Text className={`text-center text-xs lowercase ${categoryTextClass(category?.color ?? "")}`}>{category?.name ?? "Uncategorized"}</Text>
                    </View>
                </View>
            )}

            <View className="flex-1 justify-center gap-1">
                <Text numberOfLines={1} className="text-base font-medium text-emphasis">
                    {item.title}
                </Text>
                {item.description ? (
                    <Text numberOfLines={2} className="text-sm font-medium text-muted">
                        {item.description}
                    </Text>
                ) : null}
                <View className="mt-1 flex-row items-center justify-between">
                    <ImportanceDots importance={item.importance} />
                    <TouchableOpacity onPress={onToggleArchive} hitSlop={8}>
                        <Text className="text-xs text-accent">{item.isArchived ? "Restore" : "Mark done"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

function ItemGridCard({ item, category, onToggleArchive, onPress }: { item: Item; category: Category | undefined; onToggleArchive: () => void; onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} className="flex-1 overflow-hidden rounded-xl border border-border bg-elevated">
            {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} className="aspect-square w-full" />
            ) : (
                <View className="aspect-square w-full" style={{ backgroundColor: categoryBgTint(category?.color ?? "") }}>
                    <View className="absolute bottom-1.5 left-1.5 right-1.5 rounded bg-black/70 py-1">
                        <Text className={`text-center text-xs font-semibold uppercase tracking-wide ${categoryTextClass(category?.color ?? "")}`}>{category?.name ?? "Uncategorized"}</Text>
                    </View>
                </View>
            )}
            <View className="gap-1 p-2.5">
                <Text numberOfLines={1} className="text-sm font-semibold text-emphasis">
                    {item.title}
                </Text>
                <View className="flex-row items-center justify-between">
                    <ImportanceDots importance={item.importance} />
                    <TouchableOpacity onPress={onToggleArchive} hitSlop={8}>
                        <Text className="text-xs text-accent">{item.isArchived ? "Restore" : "Mark done"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function Index() {
    const { user, logout, refreshUser } = useAuth();
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [showArchived, setShowArchived] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isUserRefreshing, setIsUserRefreshing] = useState(false);
    const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
    const [search, setSearch] = useState("");
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const [sort, setSort] = useState<"newest" | "importance">("newest");
    const [displayMode, setDisplayMode] = useState<"list" | "grid">("grid");
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [isEmailBannerDismissed, setIsEmailBannerDismissed] = useState(false);

    const initials = user?.name
        ? user.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
        : "?";

    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: fetchCategories,
    });

    const itemsQuery = useQuery({
        queryKey: ["items", selectedCategoryIds, showArchived, sort, search],
        queryFn: () =>
            fetchItems({
                category: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
                archived: showArchived,
                sort,
                q: search.trim() || undefined,
            }),
    });

    async function handlePullToRefresh() {
        setIsUserRefreshing(true);
        try {
            await itemsQuery.refetch();
        } finally {
            setIsUserRefreshing(false);
        }
    }

    const toggleArchiveMutation = useMutation({
        mutationFn: (item: Item) => updateItem(item.id, { isArchived: !item.isArchived }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["items"] });
        },
    });

    const categoryById = useMemo(() => {
        const map = new Map<string, Category>();
        for (const category of categoriesQuery.data ?? []) {
            map.set(category.id, category);
        }
        return map;
    }, [categoriesQuery.data]);

    function toggleCategoryFilter(categoryId: string) {
        setSelectedCategoryIds((current) => (current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]));
    }

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextState) => {
            if (nextState === "active") {
                refreshUser();
            }
        });
        return () => subscription.remove();
    }, [refreshUser]);

    const hasActiveFilters = selectedCategoryIds.length > 0 || showArchived;

    return (
        <View className="flex-1 bg-screen pt-16">
            <View className="flex-row items-center px-4 pb-3">
                <View className="flex-1" />
                <Image source={require("../assets/everly-logo-header.png")} className="h-12" resizeMode="contain" />
                <View className="flex-1 items-end">
                    <TouchableOpacity onPress={() => setIsAvatarMenuOpen(true)} className="h-9 w-9 items-center justify-center rounded-full bg-accent">
                        <Text className="text-xs font-bold text-screen">{initials}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {user && !user.emailVerified && !isEmailBannerDismissed ? (
                <View className="mx-4 mb-2 flex-row items-center justify-between gap-2 rounded-lg bg-amber-400/10 border border-amber-400/30 px-3 py-2.5">
                    <Text className="flex-1 text-xs text-amber-300">Check your email to verify your account.</Text>
                    <TouchableOpacity onPress={() => refreshUser()}>
                        <Text className="text-xs font-semibold text-amber-400">Refresh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEmailBannerDismissed(true)} hitSlop={8}>
                        <Text className="text-xs text-neutral-500">✕</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            <View className="px-4 pb-3">
                <View className="flex-row items-center gap-2 rounded-full bg-elevated px-4 py-3.5">
                    <Ionicons name="search" size={15} color={colors.textMuted} />
                    <TextInput value={search} onChangeText={setSearch} placeholder="Search your list..." placeholderTextColor={colors.textMuted} className="flex-1 text-[13px] text-secondary" style={{ paddingVertical: 0, includeFontPadding: false }} />
                </View>
            </View>

            <Modal visible={isAvatarMenuOpen} transparent animationType="fade" onRequestClose={() => setIsAvatarMenuOpen(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setIsAvatarMenuOpen(false)} className="flex-1 bg-black/40">
                    <View className="absolute right-4 top-16 w-40 overflow-hidden rounded-xl border border-border bg-elevated">
                        <TouchableOpacity
                            onPress={() => {
                                setIsAvatarMenuOpen(false);
                                router.push("/category");
                            }}
                            className="border-b border-border px-4 py-3">
                            <Text className="text-md text-primary">Categories</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                setIsAvatarMenuOpen(false);
                                router.push("/settings");
                            }}
                            className="border-b border-border px-4 py-3">
                            <Text className="text-md text-primary">Settings</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setIsAvatarMenuOpen(false);
                                logout();
                            }}
                            className="px-4 py-3">
                            <Text className="text-md text-red-400">Log out</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={isFilterModalOpen} transparent animationType="fade" onRequestClose={() => setIsFilterModalOpen(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setIsFilterModalOpen(false)} className="flex-1 justify-end bg-black/50">
                    <TouchableOpacity activeOpacity={1} className="gap-4 rounded-t-2xl bg-elevated px-4 pb-9 pt-5">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-base font-bold text-emphasis">Filters</Text>
                            <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
                                <Text className="font-semibold text-accent">Done</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="gap-1">
                            <Text className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Categories</Text>
                            <TouchableOpacity onPress={() => setSelectedCategoryIds([])} className="flex-row items-center gap-2.5 py-2">
                                <Text className={selectedCategoryIds.length === 0 ? "text-accent" : "text-muted"}>{selectedCategoryIds.length === 0 ? "✓" : "○"}</Text>
                                <Text className="text-primary">All categories</Text>
                            </TouchableOpacity>
                            {(categoriesQuery.data ?? []).map((category) => {
                                const active = selectedCategoryIds.includes(category.id);
                                return (
                                    <TouchableOpacity key={category.id} onPress={() => toggleCategoryFilter(category.id)} className="flex-row items-center gap-2.5 py-2">
                                        <Text className={active ? "text-accent" : "text-muted"}>{active ? "✓" : "○"}</Text>
                                        <Text className=" text-primary">{category.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View className="flex-row items-center justify-between border-t border-border pt-3.5">
                            <Text className="text-primary">Show archived</Text>
                            <TouchableOpacity onPress={() => setShowArchived((current) => !current)} className={`rounded-full px-3 py-1.5 ${showArchived ? "bg-accent" : "bg-elevated"}`}>
                                <Text className={showArchived ? "text-sm font-semibold text-screen" : "text-sm text-secondary"}>{showArchived ? "On" : "Off"}</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {itemsQuery.isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-muted">Loading...</Text>
                </View>
            ) : (
                <FlatList
                    key={displayMode}
                    data={itemsQuery.data?.items ?? []}
                    keyExtractor={(item) => item.id}
                    numColumns={displayMode === "grid" ? 2 : 1}
                    columnWrapperClassName={displayMode === "grid" ? "gap-2.5" : undefined}
                    contentContainerClassName="flex-grow gap-2.5 px-4"
                    contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
                    refreshControl={<RefreshControl refreshing={isUserRefreshing} onRefresh={handlePullToRefresh} tintColor="#fbbf24" colors={["#fbbf24"]} progressBackgroundColor="#171717" />}
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center gap-2 px-6 py-16">
                            {itemsQuery.isError ? (
                                <Text className="text-center text-red-400">Could not load your list. Pull down to try again.</Text>
                            ) : (
                                <>
                                    <Text className="text-lg text-emphasis">Your list is empty</Text>
                                    <Text className="text-center text-sm text-muted">Heard about a great restaurant, a trip worth taking, or a show you can&apos;t miss? Add it here so you never forget.</Text>
                                </>
                            )}
                        </View>
                    }
                    renderItem={({ item }) => (displayMode === "grid" ? <ItemGridCard item={item} category={categoryById.get(item.categoryId)} onToggleArchive={() => toggleArchiveMutation.mutate(item)} onPress={() => router.push(`/item/${item.id}`)} /> : <ItemListCard item={item} category={categoryById.get(item.categoryId)} onToggleArchive={() => toggleArchiveMutation.mutate(item)} onPress={() => router.push(`/item/${item.id}`)} />)}
                />
            )}

            <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between gap-2.5 rounded-t-xl bg-elevated/90 px-6 pt-4" style={{ paddingBottom: insets.bottom + 12 }}>
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => setIsFilterModalOpen(true)} className="h-8 w-8 items-center justify-center">
                        <Ionicons name="filter-outline" size={24} color={hasActiveFilters ? colors.accent : colors.textPrimary} />
                    </TouchableOpacity>

                    <View>
                        <TouchableOpacity onPress={() => setIsSortMenuOpen((current) => !current)} className="h-8 w-8 items-center justify-center">
                            <Ionicons name="swap-vertical-outline" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        {isSortMenuOpen ? (
                            <View className="absolute bottom-10 left-0 w-44 overflow-hidden rounded-xl border border-border bg-elevated">
                                {SORT_OPTIONS.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        onPress={() => {
                                            setSort(opt.value);
                                            setIsSortMenuOpen(false);
                                        }}
                                        className="flex-row items-center justify-between px-3.5 py-2.5">
                                        <Text className="text-sm text-primary">{opt.label}</Text>
                                        {sort === opt.value ? <Text className="text-accent">✓</Text> : null}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : null}
                    </View>

                    <TouchableOpacity onPress={() => setDisplayMode((current) => (current === "list" ? "grid" : "list"))} className="h-8 w-8 items-center justify-center">
                        <Ionicons name={displayMode === "list" ? "grid-outline" : "list-outline"} size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity testID="add-item-button" onPress={() => router.push("/item/new")} className="h-12 w-12 items-center justify-center rounded-full bg-accent">
                    <Text className="text-xl font-semibold text-screen">+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
