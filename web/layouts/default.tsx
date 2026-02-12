import { Sidebar } from "@/components/sidebar";
import { Head } from "./head";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

interface DefaultLayoutProps {
  children: React.ReactNode;
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <div className="flex h-screen ">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-y-scroll overflow-x-hidden">
        <Head />
        <main className="container mx-auto grow max-w-7xl px-6 py-6 pt-6">
          {children}
        </main>
      </div>
      <div className="fixed top-4 right-4">
        <ThemeSwitcher />
      </div>
    </div>
  );
}
