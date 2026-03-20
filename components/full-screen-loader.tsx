import Image from "next/image";

type FullScreenLoaderProps = {
  text?: string;
};

export default function FullScreenLoader({
  text = "Cargando",
}: FullScreenLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="flex min-w-[240px] flex-col items-center rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
        <div className="relative mb-4">
          <div className="absolute inset-0 animate-pulse rounded-full bg-[var(--surface-mint)] blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)]">
            <Image
              src="/logo.png"
              alt="Logo Ankara"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
          </div>
        </div>

        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--border)]" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--ankara-blue)] dark:border-t-[var(--ankara-mint)]" />
        </div>

        <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">{text}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">Esperá un momento</p>
      </div>
    </div>
  );
}