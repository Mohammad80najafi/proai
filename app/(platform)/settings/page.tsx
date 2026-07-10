import { LogOut, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { logoutAction } from "@/features/auth/actions";
import { SettingsForm } from "@/features/social/settings-form";
import { requireUser } from "@/lib/auth/dal";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export const metadata = { title: "تنظیمات" };

export default async function SettingsPage() {
  const user = await requireUser(); await connectToDatabase();
  const profile = await User.findById(user.id).select("displayName bio messagingPolicy").lean<{ displayName: string; bio: string; messagingPolicy: string } | null>();
  return <div className="mx-auto max-w-3xl space-y-7"><PageHeader eyebrow="حساب کاربری" title="تنظیمات پروفایل" description="هویت عمومی و حریم پیام‌های خصوصی خود را مدیریت کنید." /><Card className="p-5 sm:p-7"><SettingsForm profile={profile ?? { displayName: user.displayName, bio: "", messagingPolicy: "mutual" }} /></Card><Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><ShieldCheck className="mt-1 size-5 text-success" /><div><h2 className="font-semibold">نشست امن</h2><p className="mt-1 text-xs leading-6 text-muted">با خروج، نشست فعلی در پایگاه داده نیز باطل می‌شود.</p></div></div><form action={logoutAction}><Button type="submit" variant="danger"><LogOut className="size-4" />خروج از حساب</Button></form></Card></div>;
}
