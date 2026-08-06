"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full h-touch-target bg-white border border-error text-error font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-error-container transition-colors"
    >
      <Icon name="logout" />
      Sign Out
    </button>
  );
}
