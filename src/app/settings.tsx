import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, TextInput, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button } from "@/components/ui/Button";
import { AppText as Text } from "@/components/ui/AppText";
import { useAuth } from "@/context/AuthContext";
import { runAccountAction } from "@/services/accountService";
import { friendlyAuthError } from "@/services/authService";
import * as profileService from "@/services/profileService";
import { CareerGoal, ProfessionalStatus, UserProfile } from "@/types";
import { Ionicons } from "@expo/vector-icons";

interface ProfileForm {
  fullName: string;
  phone: string;
  github: string;
  portfolio: string;
  technologies: string;
}

type ConfirmationAction = "deactivate" | "delete" | "logout";

const statusOptions: { value: ProfessionalStatus; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "employed", label: "Employed" },
];

const goalOptions: { value: CareerGoal; label: string }[] = [
  { value: "job_search", label: "Job search" },
  { value: "skill_improvement", label: "Skill growth" },
  { value: "quick_revision", label: "Quick revision" },
];

function formFromProfile(profile: UserProfile | null): ProfileForm {
  return {
    fullName: profile?.full_name ?? "",
    phone: profile?.phone_number ?? "",
    github: profile?.github_url ?? "",
    portfolio: profile?.portfolio_url ?? "",
    technologies: profile?.technologies.join(", ") ?? "",
  };
}

function normalizedUrl(value: string, label: string, github = false): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error(`Enter a valid ${label} URL.`);
  }
  if (url.protocol !== "https:" || (github && url.hostname.toLowerCase() !== "github.com")) {
    throw new Error(github ? "Enter a valid github.com profile link." : `Enter a valid ${label} URL.`);
  }
  return url.toString();
}

function profileErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return friendlyAuthError(error);
}

function Field({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize = "sentences", }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "phone-pad" | "url"; autoCapitalize?: "none" | "sentences" | "words"; }) {
  return (
    <View className="gap-1.5">
      <Text className="text-[12px] font-semibold text-ink">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A5A199"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className="min-h-[50px] rounded-2xl border border-line bg-white px-4 py-3 text-[14px] text-ink"
        style={{ fontFamily: "NexaLight" }}
      />
    </View>
  );
}

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const profileVersion = profile?.updated_at ?? null;
  const [draft, setDraft] = useState(() => ({ profileVersion, form: formFromProfile(profile), status: profile?.professional_status ?? null, goal: profile?.career_goal ?? null, }));
  if (draft.profileVersion !== profileVersion) {
    setDraft({ profileVersion, form: formFromProfile(profile), status: profile?.professional_status ?? null, goal: profile?.career_goal ?? null, });
  }
  const { form, status, goal } = draft;
  const [signedAvatar, setSignedAvatar] = useState<{ path: string; url: string } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountAction, setAccountAction] = useState<"deactivate" | "delete" | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!profile?.avatar_path || removePhoto) return () => { active = false; };
    const path = profile.avatar_path;
    profileService.getAvatarUrl(path)
      .then((url) => { if (active) setSignedAvatar({ path, url }); })
      .catch((err: unknown) => {
        if (active) setError(profileErrorMessage(err));
      });
    return () => { active = false; };
  }, [profile?.avatar_path, removePhoto]);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setDraft((current) => ({ ...current, form: { ...current.form, [key]: value } }));
  }

  async function pickPhoto() {
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8, });
      if (!result.canceled) {
        setSelectedPhoto(result.assets[0]);
        setRemovePhoto(false);
      }
    } catch (err) {
      setError(profileErrorMessage(err));
    }
  }

  async function saveProfile() {
    if (!user) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    const fullName = form.fullName.trim();
    if (!fullName) {
      setError("Please enter your name.");
      return;
    }

    setSaving(true);
    setError(null);
    let newAvatarPath: string | null = null;
    let cleanupWarning: string | null = null;
    const previousAvatarPath = profile?.avatar_path ?? null;
    try {
      const githubUrl = normalizedUrl(form.github, "GitHub", true);
      const portfolioUrl = normalizedUrl(form.portfolio, "portfolio");
      if (selectedPhoto) {
        newAvatarPath = await profileService.uploadAvatar(user.id, selectedPhoto.uri, selectedPhoto.mimeType ?? null);
      }

      await profileService.updateProfile(user.id, {
        full_name: fullName,
        phone_number: form.phone.trim() || null,
        github_url: githubUrl,
        portfolio_url: portfolioUrl,
        technologies: form.technologies.split(",").map((item) => item.trim()).filter(Boolean),
        professional_status: status,
        career_goal: goal,
        ...(newAvatarPath ? { avatar_path: newAvatarPath } : {}),
        ...(removePhoto ? { avatar_path: null } : {}),
      });

      if (previousAvatarPath && (newAvatarPath || removePhoto)) {
        try {
          await profileService.removeAvatar(previousAvatarPath);
        } catch (cleanupError) {
          console.warn("Profile was saved, but the previous avatar could not be removed:", cleanupError);
          cleanupWarning = "Your profile was saved, but the previous profile photo could not be removed.";
        }
      }
      setSelectedPhoto(null);
      setRemovePhoto(false);
      await refreshProfile();
      if (cleanupWarning) {
        setError(cleanupWarning);
      } else {
        Alert.alert("Profile saved", "Your profile and preferences have been updated.");
      }
    } catch (err) {
      if (newAvatarPath) {
        try {
          await profileService.removeAvatar(newAvatarPath);
        } catch (cleanupError) {
          console.error("Unable to clean up an unlinked profile photo:", cleanupError);
        }
      }
      setError(profileErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    if (saving || accountAction) return;
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
      setConfirmation(null);
      router.replace("/(auth)/login");
    } catch (err) {
      setError(profileErrorMessage(err));
    } finally {
      setSigningOut(false);
    }
  }

  async function handleAccountAction(action: "deactivate" | "delete") {
    if (saving || signingOut || accountAction) return;
    setAccountAction(action);
    setError(null);
    try {
      await runAccountAction(action);
      await signOut("local");
      setConfirmation(null);
      router.replace("/(auth)/login");
    } catch (err) {
      setError(profileErrorMessage(err));
    } finally {
      setAccountAction(null);
    }
  }

  function openConfirmation(action: ConfirmationAction) {
    setError(null);
    setConfirmation(action);
  }

  function closeConfirmation() {
    if (accountAction || signingOut) return;
    setConfirmation(null);
    setError(null);
  }

  async function confirmAction() {
    if (confirmation === "deactivate" || confirmation === "delete") {
      await handleAccountAction(confirmation);
    } else if (confirmation === "logout") {
      await handleSignOut();
    }
  }

  const confirmationDetails = confirmation
    ? {
      deactivate: {
        title: "Deactivate account?",
        message: "Sign-in will be paused and your profile will be retained. Contact Learna support to reactivate your account.",
        actionLabel: "Deactivate",
        icon: "pause-circle-outline" as const,
        accent: "#B8860B",
        background: "#FDF1DD",
      },
      delete: {
        title: "Delete account permanently?",
        message: "This permanently deletes your account, profile details, and profile photo. This action cannot be undone.",
        actionLabel: "Delete account",
        icon: "trash-outline" as const,
        accent: "#BE3A35",
        background: "#FDECEB",
      },
      logout: {
        title: "Log out?",
        message: "You can sign back in anytime to continue learning where you left off.",
        actionLabel: "Log out",
        icon: "log-out-outline" as const,
        accent: "#514B40",
        background: "#F1EFEA",
      },
    }[confirmation]
    : null;
  const confirming = accountAction !== null || signingOut;

  const displayedAvatar = selectedPhoto?.uri ?? (!removePhoto && signedAvatar && signedAvatar.path === profile?.avatar_path ? signedAvatar.url : null);

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <StatusBar style="dark" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="flex-row items-center gap-2 border-b border-line px-5 py-4">
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color="#25231F" />
          </Pressable>
          <Text className="text-[15px] font-semibold text-ink">Profile & settings</Text>
          <View className="w-12" />
        </View>

        <View>
          <View className="flex-row items-start gap-3 bg-white px-5 py-6">
            <View className="items-center">
              <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#F1DFC0] bg-pale-gold">
                {displayedAvatar ? (
                  <Image source={{ uri: displayedAvatar }} className="h-24 w-24" />
                ) : (
                  <Text className="text-[32px] font-bold text-gold">
                    {(form.fullName || "L").trim().charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Pressable onPress={pickPhoto} disabled={saving} className="mt-3 rounded-full bg-pale-gold px-4 py-2">
                <Text className="text-[12px] font-semibold text-gold">
                  {selectedPhoto || profile?.avatar_path ? "Change photo" : "Add profile photo"}
                </Text>
              </Pressable>
              {profile?.avatar_path || selectedPhoto ? (
                <Pressable onPress={() => { setSelectedPhoto(null); setRemovePhoto(true); }} className="mt-2 py-1" accessibilityRole="button">
                  <Text className="text-[11px] text-muted">Remove photo</Text>
                </Pressable>
              ) : null}
            </View>
            <View className="ml-3">
              <Text className="mt-4 text-[17px] font-semibold text-ink">{form.fullName || "Your profile"}</Text>
              <Text className="mt-1 text-[12px] text-muted">{profile?.email ?? ""}</Text>
              <Text className="mt-1 text-[12px] text-muted">{profile?.portfolio_url ?? ""}</Text>
            </View>
          </View>

          <View className="px-5">
            <Text className="mt-8 text-[10px] font-bold tracking-[1.6px] text-gold">PERSONAL DETAILS</Text>
            <View className="mt-3 gap-4">
              <Field label="Full name" value={form.fullName} onChangeText={(value) => update("fullName", value)} placeholder="Your name" />
              <Field label="Mobile number" value={form.phone} onChangeText={(value) => update("phone", value)} placeholder="Add a mobile number" keyboardType="phone-pad" />
              <Field label="GitHub profile" value={form.github} onChangeText={(value) => update("github", value)} placeholder="github.com/username" keyboardType="url" autoCapitalize="none" />
              <Field label="Personal portfolio" value={form.portfolio} onChangeText={(value) => update("portfolio", value)} placeholder="yourportfolio.com" keyboardType="url" autoCapitalize="none" />
            </View>

            <Text className="mt-8 text-[10px] font-bold tracking-[1.6px] text-gold">LEARNING PREFERENCES</Text>
            <View className="mt-3 gap-5 rounded-[20px] border border-line bg-white p-4">
              <View>
                <Text className="mb-2 text-[12px] font-semibold text-ink">Professional status</Text>
                <View className="flex-row gap-2">
                  {statusOptions.map((option) => (
                    <Pressable key={option.value} onPress={() => setDraft((current) => ({ ...current, status: option.value }))} className={`rounded-full border px-4 py-2.5 ${status === option.value ? "border-gold bg-pale-gold" : "border-line bg-white"}`}>
                      <Text className={`text-[12px] font-semibold ${status === option.value ? "text-gold" : "text-muted"}`}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View>
                <Text className="mb-2 text-[12px] font-semibold text-ink">Learning goal</Text>
                <View className="flex-row flex-wrap gap-2">
                  {goalOptions.map((option) => (
                    <Pressable key={option.value} onPress={() => setDraft((current) => ({ ...current, goal: option.value }))} className={`rounded-full border px-3 py-2.5 ${goal === option.value ? "border-gold bg-pale-gold" : "border-line bg-white"}`}>
                      <Text className={`text-[11px] font-semibold ${goal === option.value ? "text-gold" : "text-muted"}`}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Field label="Technologies" value={form.technologies} onChangeText={(value) => update("technologies", value)} placeholder="JavaScript, React, CSS" />
            </View>

            <View className="mt-6">
              <Button label="Save changes" onPress={saveProfile} loading={saving} disabled={accountAction !== null || signingOut} />
              {error ? <Text className="mt-3 text-center text-[12px] text-rose-600">{error}</Text> : null}
            </View>

            <Text className="mt-8 text-[10px] font-bold tracking-[1.6px] text-rose-700">DANGER ZONE</Text>
            <View className="mt-3 gap-3 rounded-[20px] border border-rose-200 bg-white p-4">
              <Text className="text-[12px] leading-[18px] text-muted">Deactivation pauses sign-in and keeps your data. Permanent deletion removes your account and profile data.</Text>
              <Button label="Deactivate account" variant="secondary" onPress={() => openConfirmation("deactivate")} loading={accountAction === "deactivate"} disabled={accountAction !== null || saving || signingOut} />
              <Pressable onPress={() => openConfirmation("delete")} disabled={accountAction !== null || saving || signingOut} className="min-h-[48px] items-center justify-center rounded-2xl border border-rose-300 bg-white px-4">
                <Text className="text-[13px] font-semibold text-rose-700">
                  {accountAction === "delete" ? "Deleting account…" : "Delete account permanently"}
                </Text>
              </Pressable>
              <Button label="Log out" variant="secondary" onPress={() => openConfirmation("logout")} loading={signingOut} disabled={accountAction !== null || saving} />
            </View>

            <Text className="mt-8 text-center text-[10px] tracking-[0.8px] text-muted">
              LEARNA · PREP WITH PURPOSE
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={confirmation !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={closeConfirmation}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, backgroundColor: "rgba(0,0,0,0.55)", }}>
          {confirmationDetails ? (
            <View accessibilityViewIsModal style={{ width: "100%", maxWidth: 420, padding: 24, borderRadius: 28, backgroundColor: "#FFFEFC", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", elevation: 12, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, }}>
              <View className="flex-row items-start justify-between">
                <View style={{ height: 36, width: 36, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: confirmationDetails.background, }}>
                  <Ionicons name={confirmationDetails.icon} size={22} color={confirmationDetails.accent} />
                </View>
                <Pressable onPress={closeConfirmation} disabled={confirming} accessibilityRole="button" accessibilityLabel="Close confirmation" hitSlop={10} style={{ height: 36, width: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F3EF", }}>
                  <Ionicons name="close" size={20} color="#77736C" />
                </Pressable>
              </View>

              <Text className="mt-5 text-[20px] font-bold leading-[27px] text-ink">{confirmationDetails.title}</Text>
              <Text className="mt-2 text-[14px] leading-[21px] text-muted">{confirmationDetails.message}</Text>

              {error ? (
                <Text accessibilityRole="alert" className="mt-4 text-[12px] leading-[18px] text-rose-700">{error}</Text>
              ) : null}

              <View className="mt-6 flex-row gap-3">
                <Pressable onPress={closeConfirmation} disabled={confirming} accessibilityRole="button" className="min-h-[50px] flex-1 items-center justify-center rounded-2xl border border-line bg-white px-3">
                  <Text className="text-[13px] font-semibold text-muted">Cancel</Text>
                </Pressable>
                <Pressable onPress={confirmAction} disabled={confirming} accessibilityRole="button" accessibilityState={{ disabled: confirming, busy: confirming }} className="min-h-[50px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl px-3" style={{ backgroundColor: confirmationDetails.accent }}>
                  {confirming ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                  <Text className="text-center text-[13px] font-bold text-white">
                    {confirming ? "Please wait…" : confirmationDetails.actionLabel}
                  </Text>
                </Pressable>
              </View>
              {confirmation === "delete" ? (
                <Text className="mt-4 text-center text-[11px] leading-[16px] text-rose-700">This cannot be undone.</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}