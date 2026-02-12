import { ThemeProvider, useTheme } from "@/components/ThemeContext";
import "@/styles/globals.css";
import "antd/dist/reset.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, ThemeConfig, theme as antdTheme } from "antd";
import ptBR from "antd/locale/pt_BR";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/auth-context";
import { ToasterProvider } from "@/components/toaster";

const themeLight: ThemeConfig = {
  token: {
    colorInfo: "#1677ffba",
    colorPrimary: "#fa541c",
    colorTextBase: "#404040",
    colorBgBase: "#fafafa",
    wireframe: false,
  },
  components: {
    Menu: {
      itemActiveBg: "#000",
      itemSelectedBg: "rgba(226, 232, 240, 1)",
      itemSelectedColor: "#404040",
      subMenuItemSelectedColor: "#404040",

      itemHoverBg: "rgba(226, 232, 240, 1)",
    },
  },
  algorithm: antdTheme.defaultAlgorithm,
};

const themeDark: ThemeConfig = {
  token: {
    colorInfo: "#1677ffba",
    colorPrimary: "#fa541c",
    colorTextBase: "#fafafa",
    colorBgBase: "#151517",
    wireframe: false,
  },
  // components: {
  //   Menu: {
  //     itemActiveBg: "#000",
  //     itemSelectedBg: "rgba(226, 232, 240, 1)",
  //     itemSelectedColor: "#404040",
  //     subMenuItemSelectedColor: "#404040",
  //     itemHoverBg: "rgba(226, 232, 240, 1)",
  //   },
  // },
  algorithm: antdTheme.darkAlgorithm,
};

function ThemeAppWrapper({ Component, pageProps }: AppProps) {
  const { isDarkMode } = useTheme();

  return (
    <AuthProvider>
      <ConfigProvider locale={ptBR} theme={isDarkMode ? themeDark : themeLight}>
        <div
          style={{
            backgroundColor: isDarkMode ? "#151517" : "#fafafa",
            minHeight: "100vh",
            transition: "background-color 0.3s",
          }}
        >
          <Component {...pageProps} />
        </div>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default function App(props: AppProps) {
  return (
    <AntdRegistry>
      <ThemeProvider>
        <AuthProvider>
          <ToasterProvider>
            <ThemeAppWrapper {...props} />
          </ToasterProvider>
        </AuthProvider>
      </ThemeProvider>
    </AntdRegistry>
  );
}
