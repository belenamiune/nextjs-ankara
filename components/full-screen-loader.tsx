type FullScreenLoaderProps = {
  text?: string;
};

export default function FullScreenLoader({
  text = "Cargando",
}: FullScreenLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="flex min-w-[220px] flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-black" />
        </div>

        <p className="mt-4 text-sm font-semibold text-gray-800">{text}</p>
        <p className="mt-1 text-xs text-gray-500">Esperá un momento</p>
      </div>
    </div>
  );
}