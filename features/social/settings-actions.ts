"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import type { ContentActionState } from "@/features/content/mutation-helpers";

const profileSchema = z.object({ displayName: z.string().trim().min(2, "نام نمایشی خیلی کوتاه است.").max(60), bio: z.string().trim().max(320, "معرفی باید حداکثر ۳۲۰ نویسه باشد."), messagingPolicy: z.enum(["everyone", "following", "mutual", "nobody"]) });

function avatarExtension(bytes: Uint8Array, type: string) {
  if (type === "image/png" && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (type === "image/webp" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

export async function updateProfileAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({ displayName: formData.get("displayName"), bio: formData.get("bio"), messagingPolicy: formData.get("messagingPolicy") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "اطلاعات معتبر نیست." };
  let avatar: string | undefined;
  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (file.size > 1_500_000) return { status: "error", message: "حجم تصویر باید کمتر از ۱٫۵ مگابایت باشد." };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const extension = avatarExtension(bytes, file.type);
    if (!extension) return { status: "error", message: "فقط تصویر PNG، JPEG یا WebP معتبر پذیرفته می‌شود." };
    const directory = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(path.join(directory, filename), bytes, { flag: "wx" });
    avatar = `/uploads/avatars/${filename}`;
  }
  try {
    await connectToDatabase();
    await User.updateOne({ _id: user.id, accountStatus: "active" }, { $set: { ...parsed.data, ...(avatar ? { avatar } : {}) } });
  } catch { return { status: "error", message: "ذخیره تغییرات انجام نشد." }; }
  revalidatePath(`/users/${user.username}`); revalidatePath("/settings");
  return { status: "success", message: "پروفایل شما به‌روز شد." };
}
