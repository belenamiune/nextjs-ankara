import dynamic from "next/dynamic";

const ThemeToggleClient = dynamic(() => import("./theme-toggle-client"), {
  ssr: false,
});

export default function ThemeToggle() {
  return <ThemeToggleClient />;
}