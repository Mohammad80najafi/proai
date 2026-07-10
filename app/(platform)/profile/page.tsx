import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";

export default async function ProfileRedirectPage() { const user = await requireUser(); redirect(`/users/${user.username}`); }
