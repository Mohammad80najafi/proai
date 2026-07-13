import { redirect } from "next/navigation";

import { getAuthHref, getSafeRedirectPath } from "@/lib/auth/redirect";

type RegisterPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const nextValue = Array.isArray(params.next) ? params.next[0] : params.next;
  redirect(getAuthHref("/login", getSafeRedirectPath(nextValue)));
}
