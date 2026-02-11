import { usePathname } from "next/navigation";
import { Divider, Menu, MenuProps } from "antd";
import {
  AppstoreOutlined,
  CommentOutlined,
  SkinOutlined,
} from "@ant-design/icons";
import Link from "next/link";

export function Sidebar() {
  const pathname = usePathname();
  type MenuItem = Required<MenuProps>["items"][number];

  const items: MenuItem[] = [
    {
      label: "Fardamentos",
      key: "sub1",
      icon: <SkinOutlined />,
      children: [
        {
          type: "group",
          label: "",
          children: [
            {
              label: (
                <Link href="/" rel="">
                  Visão Geral
                </Link>
              ),
              key: "visaoGeral",
            },
            {
              label: (
                <Link href="/fardamentos/unidades" rel="">
                  Unidades
                </Link>
              ),
              key: "unidades",
            },
            {
              label: (
                <Link href="/fardamentos/tipos" rel="">
                  Tipos
                </Link>
              ),
              key: "tipos",
            },
            {
              label: (
                <Link href="/fardamentos/variacoes" rel="">
                  Variações
                </Link>
              ),
              key: "variacoes",
            },
            {
              label: (
                <Link href="/fardamentos/estoque" rel="">
                  Estoque
                </Link>
              ),
              key: "estoque",
            },
          ],
        },
      ],
    },
    {
      label: "Atualizar Colaborador",
      key: "sub2",
      icon: <AppstoreOutlined />,
    },
    {
      label: "Minha Conta",
      key: "sub3",
      icon: <AppstoreOutlined />,
    },
    {
      label: "Ajuda",
      key: "sub4",
      icon: <CommentOutlined />,
    },
  ];

  return (
    <aside className="bg-neutral-50 text-neutral-700 w-64 border-r border-stone-200 h-full shadow-sm p-4 flex flex-col justify-between">
      <div>
        <img alt="Logo" className="w-44 mx-auto py-4" src="/logo.png" />
        <Divider className="my-4 bg-stone-200" />
        <h2 className="text-center font-bold"></h2>
        <Divider className="my-4 bg-stone-200" />
        <div className="space-y-2">
          <Menu
            mode="inline"
            defaultOpenKeys={["sub1"]}
            selectedKeys={[pathname.replace("/", "") || "visaoGeral"]}
            items={items}
          />
        </div>
      </div>
    </aside>
  );
}
