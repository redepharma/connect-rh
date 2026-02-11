import { Sidebar } from "@/components/sidebar";
import { Head } from "./head";
import { Flex } from "antd";

interface DefaultLayoutProps {
  children: React.ReactNode;
  currentNav?: "apps" | "gerenciar" | "downloads" | "ajuda";
}

export default function DefaultLayout({
  children,
  currentNav,
}: DefaultLayoutProps) {
  return (
    <div className="flex h-screen overflow-scroll bg-neutral-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-scroll">
        <Head />
        <main className="container mx-auto flex-grow max-w-7xl px-6 py-6 pt-6 bg-neutral-50">
          {children}
        </main>
      </div>
    </div>
  );
}
