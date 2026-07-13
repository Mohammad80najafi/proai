"use client";

import { useActionState, useRef, useState } from "react";
import { Camera, LoaderCircle, Save, ShieldCheck, LogOut, User, Eye } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/form-controls";
import { Badge } from "@/components/ui/badge";
import type { ContentActionState } from "@/features/content/mutation-helpers";
import { updateProfileAction } from "@/features/social/settings-actions";
import { logoutAction } from "@/features/auth/actions";

const initialState: ContentActionState = { status: "idle" };

const messagingOptions = [
  { value: "everyone", label: "همه کاربران", description: "هر کاربری می‌تواند پیام دهد." },
  { value: "following", label: "افرادی که دنبال می‌کنم", description: "فقط افرادی که آن‌ها را دنبال می‌کنید." },
  { value: "mutual", label: "دنبال‌کردن دوطرفه", description: "فقط افرادی که هر دو طرف یکدیگر را دنبال کنید." },
  { value: "nobody", label: "هیچ‌کس", description: "هیچ‌کس اجازه شروع گفت‌وگو ندارد." },
] as const;

type Tab = "profile" | "privacy" | "account";

const tabs: { key: Tab; label: string; icon: typeof User }[] = [
  { key: "profile", label: "پروفایل", icon: User },
  { key: "privacy", label: "حریم خصوصی", icon: Eye },
  { key: "account", label: "حساب کاربری", icon: ShieldCheck },
];

export function SettingsForm({
  profile,
  username,
  displayName,
}: {
  profile: { displayName: string; bio: string; messagingPolicy: string; avatar?: string | null };
  username: string;
  displayName: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [messagingPolicy, setMessagingPolicy] = useState(profile.messagingPolicy);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile preview header */}
      <Card elevated className="overflow-hidden">
        <div className="relative h-28 bg-gradient-to-br from-indigo-600/20 via-slate-900 to-slate-900">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%22.65%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%20opacity%3D%22.08%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
        </div>
        <div className="px-5 pb-5 sm:px-7">
          <div className="-mt-10 flex items-end gap-4">
            <div className="relative group">
              <Avatar
                src={previewUrl ?? profile.avatar}
                alt={displayName}
                size="xl"
                className="ring-4 ring-[#080b13]"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="تغییر تصویر"
              >
                <Camera className="size-5 text-white" />
              </button>
            </div>
            <div className="min-w-0 pb-1">
              <h2 className="text-lg font-bold text-white truncate" dir="auto">{displayName}</h2>
              <p className="text-sm text-slate-500" dir="auto">@{username}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-white/[0.025] p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/[0.09] text-white shadow-sm"
                  : "text-slate-500 hover:bg-white/[0.045] hover:text-slate-200"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content — profile & privacy share one form, account has its own */}
      {(activeTab === "profile" || activeTab === "privacy") && (
        <form action={action} className="space-y-6">
          {activeTab === "privacy" && (
            <>
              <input type="hidden" name="displayName" value={profile.displayName} />
              <input type="hidden" name="bio" value={profile.bio} />
            </>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 animate-soft-enter">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
                      <User className="size-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">اطلاعات پروفایل</h3>
                      <p className="text-xs text-slate-500">نام نمایشی و معرفی کوتاه خود را مدیریت کنید.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Input
                    name="displayName"
                    label="نام نمایشی"
                    defaultValue={profile.displayName}
                    required
                    hint="نامی که دیگران در پروفایل شما می‌بینند."
                  />
                  <Textarea
                    name="bio"
                    label="معرفی کوتاه"
                    defaultValue={profile.bio}
                    rows={4}
                    hint="حداکثر ۳۲۰ نویسه — خودتان را معرفی کنید."
                  />
                  <div>
                    <input
                      ref={fileInputRef}
                      name="avatar"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <div className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-white/[0.05] text-slate-400">
                          <Camera className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-200">تصویر پروفایل</p>
                          <p className="text-xs text-slate-500">PNG، JPEG یا WebP — حداکثر ۱٫۵ مگابایت</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          انتخاب فایل
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-6 animate-soft-enter">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-300">
                      <Eye className="size-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">حریم پیام‌ها</h3>
                      <p className="text-xs text-slate-500">مشخص کنید چه کسانی می‌توانند گفت‌وگو را شروع کنند.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {messagingOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                          messagingPolicy === opt.value
                            ? "border-indigo-400/30 bg-indigo-400/[0.06]"
                            : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="messagingPolicy"
                          value={opt.value}
                          checked={messagingPolicy === opt.value}
                          onChange={() => setMessagingPolicy(opt.value)}
                          className="sr-only"
                        />
                        <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          messagingPolicy === opt.value
                            ? "border-indigo-400 bg-indigo-400"
                            : "border-slate-600"
                        }`}>
                          {messagingPolicy === opt.value && (
                            <span className="size-2 rounded-full bg-white" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-slate-100">{opt.label}</span>
                          <p className="text-xs text-slate-500">{opt.description}</p>
                        </div>
                        {opt.value === "nobody" && (
                          <Badge variant="red" dot>محدود</Badge>
                        )}
                        {opt.value === "everyone" && (
                          <Badge variant="green" dot>باز</Badge>
                        )}
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Global feedback + save */}
          {state.message && (
            <div
              role={state.status === "error" ? "alert" : undefined}
              className={`rounded-xl p-3.5 text-sm font-medium ${
                state.status === "error"
                  ? "border border-red-400/20 bg-red-500/10 text-red-200"
                  : "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {state.message}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
              {pending ? "در حال ذخیره…" : "ذخیره تغییرات"}
            </Button>
          </div>
        </form>
      )}

      {activeTab === "account" && (
        <div className="space-y-6 animate-soft-enter">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
                  <ShieldCheck className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">امنیت حساب</h3>
                  <p className="text-xs text-slate-500">وضعیت نشست و گزینه‌های امنیتی حساب شما.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-200">نشست فعال</h4>
                    <p className="mt-1 text-xs leading-5 text-emerald-300/70">
                      نشست فعلی شما معتبر است. با خروج، این نشست در پایگاه داده باطل خواهد شد.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
              <p className="text-xs text-slate-600">
                خروج شما را از تمام دستگاه‌ها خارج می‌کند.
              </p>
              <form action={logoutAction}>
                <Button type="submit" variant="danger" size="md">
                  <LogOut className="size-4" />
                  خروج از حساب
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
