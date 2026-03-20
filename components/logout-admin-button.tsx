"use client";

import { useRouter } from "next/navigation";

const LogoutAdminButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin-logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--ankara-mint)] hover:bg-[var(--surface-mint)]"
    >
      Salir de admin
    </button>
  );
};

export default LogoutAdminButton;