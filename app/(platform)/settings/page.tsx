import { SettingsForm } from "@/features/social/settings-form";
import { requireUser } from "@/lib/auth/dal";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export const metadata = { title: "تنظیمات" };

export default async function SettingsPage() {
  const user = await requireUser();
  await connectToDatabase();
  const profile = await User.findById(user.id)
    .select("displayName bio messagingPolicy avatar username")
    .lean<{
      displayName: string;
      bio: string;
      messagingPolicy: string;
      avatar?: string | null;
      username: string;
    } | null>();

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <SettingsForm
        profile={{
          displayName: profile?.displayName ?? user.displayName,
          bio: profile?.bio ?? "",
          messagingPolicy: profile?.messagingPolicy ?? "mutual",
          avatar: profile?.avatar,
        }}
        username={profile?.username ?? user.username ?? ""}
        displayName={profile?.displayName ?? user.displayName}
      />
    </div>
  );
}
