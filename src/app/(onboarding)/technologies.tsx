import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown, FadeInUp, FadeOutUp, LinearTransition } from "react-native-reanimated";
import { Button } from "@/components/ui/Button";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { useAuth } from "@/context/AuthContext";
import { friendlyAuthError } from "@/services/authService";
import { saveTechnologies } from "@/services/profileService";
import { MAX_TECHNOLOGIES, TECH_CATALOG } from "@/data/techCatalog";
import { AppText as Text } from "@/components/ui/AppText";

type ListItem =
  | { type: "search" }
  | { type: "chips" }
  | { type: "category"; id: string; name: string }
  | { type: "tech"; id: string; name: string; category: string };

export default function OnboardingTechnologies() {
  const { user, profile, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<string[]>(profile?.technologies ?? []);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = Boolean(profile?.onboarding_complete);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TECH_CATALOG.filter((cat) => (activeCategory ? cat.id === activeCategory : true)).map((cat) => ({
      ...cat,
      items: q ? cat.items.filter((i) => i.toLowerCase().includes(q)) : cat.items,
    })).filter((cat) => cat.items.length > 0);
  }, [query, activeCategory]);

  const listItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [{ type: "search" }, { type: "chips" }];
    for (const cat of filtered) {
      items.push({ type: "category", id: cat.id, name: cat.name });
      for (const name of cat.items) {
        items.push({ type: "tech", id: `${cat.id}:${name}`, name, category: cat.id });
      }
    }
    return items;
  }, [filtered]);

  function toggle(name: string) {
    setLimitMessage(null);
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((t) => t !== name);
      if (prev.length >= MAX_TECHNOLOGIES) {
        setLimitMessage(`You can select up to ${MAX_TECHNOLOGIES} technologies. Remove one to add another.`);
        return prev;
      }
      return [...prev, name];
    });
  }

  async function handleFinish() {
    if (!user) return;
    if (selected.length === 0) {
      setLimitMessage("Select at least one technology to continue.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveTechnologies(user.id, selected, true);
      await refreshProfile();
      router.replace("/(tabs)");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSaving(false);
    }
  }

  function renderItem({ item }: { item: ListItem }) {
    if (item.type === "search") {
      return (
        <View className="mb-3 min-h-[54px] flex-row items-center gap-3 rounded-2xl border border-line bg-white px-4">
          <Ionicons name="search-outline" size={19} color="#77736C" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search languages, tools..."
            placeholderTextColor="#A5A199"
            autoCorrect={false}
            autoCapitalize="none"
            className="min-h-[52px] flex-1 text-[14px] text-ink"
            style={{ fontFamily: "NexaLight" }}
          />
        </View>
      );
    }
    if (item.type === "chips") {
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
          <Pressable onPress={() => setActiveCategory(null)} accessibilityRole="button" accessibilityState={{ selected: !activeCategory }} className={`rounded-full border px-4 py-2.5 ${!activeCategory ? "border-ink bg-ink" : "border-line bg-white"}`}>
            <Text className={`text-[11px] font-semibold ${!activeCategory ? "text-white" : "text-ink"}`}>All</Text>
          </Pressable>
          {TECH_CATALOG.map((cat) => (
            <Pressable key={cat.id} onPress={() => setActiveCategory(cat.id)} accessibilityRole="button" accessibilityState={{ selected: activeCategory === cat.id }} className={`rounded-full border px-4 py-2.5 ${activeCategory === cat.id ? "border-ink bg-ink" : "border-line bg-white"}`}>
              <Text className={`text-[11px] font-semibold ${activeCategory === cat.id ? "text-white" : "text-ink"}`}>{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      );
    }
    if (item.type === "category") {
      return <Text className="mb-2 mt-3 text-[10px] font-bold tracking-[1.5px] text-gold">{item.name.toUpperCase()}</Text>;
    }
    const isSelected = selected.includes(item.name);
    return (
      <Animated.View layout={LinearTransition.duration(180)}>
        <Pressable onPress={() => toggle(item.name)} accessibilityRole="checkbox" accessibilityState={{ checked: isSelected }} className={`mb-2.5 min-h-[54px] flex-row items-center justify-between rounded-[17px] border px-4 py-3 active:opacity-85 ${isSelected ? "border-gold bg-pale-gold" : "border-line bg-white"}`}>
          <Text className={`text-[14px] ${isSelected ? "font-semibold text-ink" : "text-ink"}`}>{item.name}</Text>
          <View className={`h-[22px] w-[22px] items-center justify-center rounded-[7px] border ${isSelected ? "border-gold bg-gold" : "border-line bg-white"}`}>
            {isSelected ? <Text className="text-[12px] font-bold text-white">✓</Text> : null}
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <StatusBar style="dark" />
      <View className="flex-1 px-5 pt-6">
        <OnboardingHeader
          step={3} onBack={() => router.back()} title="What do you want to learn?"
          description={`Choose up to ${MAX_TECHNOLOGIES} languages, frameworks, libraries, databases, and tools to build your personalized path.`}
        />

        <Animated.View entering={FadeInDown.delay(100).duration(380)} layout={LinearTransition.springify().damping(18)} className="mt-5">
          <View className="flex-row items-center justify-between rounded-2xl border border-line bg-white px-4 py-3">
            <View>
              <Text className="text-[11px] font-medium text-muted">YOUR FOCUS</Text>
              <Text className="mt-0.5 text-[15px] font-bold text-ink">
                {selected.length}
                <Text className="font-medium text-muted"> / {MAX_TECHNOLOGIES} selected</Text>
              </Text>
            </View>
            {selected.length > 0 ? (
              <Pressable onPress={() => setSelected([])} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear selected technologies">
                <Text className="text-[12px] font-semibold text-gold">Clear all</Text>
              </Pressable>
            ) : null}
          </View>

          {selected.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
              {selected.map((name) => (
                <Animated.View key={name} entering={FadeInDown.duration(220)} exiting={FadeOutUp.duration(160)}>
                  <Pressable onPress={() => toggle(name)} accessibilityLabel={`Remove ${name}`} className="flex-row items-center gap-1.5 rounded-full border border-gold/40 bg-pale-gold px-3.5 py-2">
                    <Text className="text-[11px] font-semibold text-ink">{name}</Text>
                    <Text className="text-[11px] font-semibold text-gold">×</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          ) : null}
        </Animated.View>

        {limitMessage ? (
          <Animated.View entering={FadeInUp.duration(220)} className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <Text className="text-[11px] leading-[16px] text-amber-800">{limitMessage}</Text>
          </Animated.View>
        ) : null}

        {error ? (
          <Animated.View entering={FadeInUp.duration(220)} className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5">
            <Text className="text-[11px] leading-[16px] text-rose-700">{error}</Text>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.delay(180).duration(400)} className="mt-4 flex-1">
          <Text className="mb-2 text-[10px] font-bold tracking-[1.4px] text-muted">EXPLORE TECHNOLOGIES</Text>
          <FlatList
            data={listItems}
            keyExtractor={(item) => (item.type === "tech" ? item.id : item.type === "category" ? `cat-${item.id}` : item.type)}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
            ListEmptyComponent={
              <Text className="mt-6 text-center text-[13px] text-muted">No technologies match your search.</Text>
            }
          />
        </Animated.View>

        <View className="border-t border-line/70 bg-paper pb-2 pt-3">
          <Button label={editing ? "Save preferences" : "Finish setup"} onPress={handleFinish} disabled={selected.length === 0} loading={saving} arrow />
        </View>
      </View>
    </SafeAreaView>
  );
}