import { Divider, Menu, MenuProps } from "antd";
import {
  AppstoreOutlined,
  CommentOutlined,
  SkinOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/auth-context";

export function Sidebar() {
  const { pathname } = useRouter();
  const { user } = useAuth();
  type MenuItem = Required<MenuProps>["items"][number];

  const routeKeyMap: Record<string, string> = {
    "/fardamentos": "visaoGeral",
    "/fardamentos/unidades": "unidades",
    "/fardamentos/tipos": "tipos",
    "/fardamentos/variacoes": "variacoes",
    "/fardamentos/estoque": "estoque",
    "/fardamentos/movimentacoes": "movimentacoes",
    "/fardamentos/historico": "historico",
    "/fardamentos/avarias": "avarias",
    "/fardamentos/saldos": "saldos",
  };

  const selectedKey = routeKeyMap[pathname] || "visaoGeral";

  const items: MenuItem[] = [
    {
      label: "Fardamentos",
      key: "fardamentos",
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
            {
              label: (
                <Link href="/fardamentos/movimentacoes" rel="">
                  Movimentações
                </Link>
              ),
              key: "movimentacoes",
            },
            {
              label: (
                <Link href="/fardamentos/historico" rel="">
                  Histórico
                </Link>
              ),
              key: "historico",
            },
            {
              label: (
                <Link href="/fardamentos/avarias" rel="">
                  Avarias
                </Link>
              ),
              key: "avarias",
            },
            {
              label: (
                <Link href="/fardamentos/saldos" rel="">
                  Saldos
                </Link>
              ),
              key: "saldos",
            },
          ],
        },
      ],
    },
    {
      label: "Atualizar Colaborador",
      key: "atualizarColaborador",
      icon: <AppstoreOutlined />,
    },
    {
      label: "Minha Conta",
      key: "minhaConta",
      icon: <AppstoreOutlined />,
    },
    {
      label: "Ajuda",
      key: "ajuda",
      icon: <CommentOutlined />,
    },
  ];

  return (
    <aside className=" text-neutral-700 w-64 border-r border-stone-200 h-full shadow-sm p-4 flex flex-col justify-between">
      <div>
        <Image
          alt="Logo"
          className="w-44 mx-auto py-4"
          src="/logo.png"
          width={176}
          height={56}
          priority
        />
        <Divider className="my-4 " />
        <h2 className="text-center font-bold">{user?.nome}</h2>
        <p className="text-slate-600 text-center">{user?.departamento}</p>
        <Divider className="my-4 " />
        <div className="space-y-2">
          <Menu
            mode="inline"
            defaultOpenKeys={["fardamentos"]}
            selectedKeys={[selectedKey]}
            items={items}
          />
        </div>
      </div>
    </aside>
  );
}
