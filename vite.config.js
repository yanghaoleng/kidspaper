import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  base: mode === "workplace" ? "/" : "/kidspaper/",
  build: { outDir: mode === "workplace" ? "dist-workplace" : "dist" },
  server: {
    proxy:
      mode === "workplace"
        ? { "/api": "http://127.0.0.1:4318" }
        : { "/kidspaper/api": "http://127.0.0.1:4317" },
  },
  plugins: [
    react(),
    ...(mode === "workplace"
      ? [
          {
            name: "partner-entry",
            transformIndexHtml: {
              order: "pre",
              handler: (html) =>
                html
                  .replace("/src/main.jsx", "/src/workplace/main.jsx")
                  .replace(
                    "小小人物报 · Kidspaper",
                    "同路人 · Partner｜给工作中的自己一份小报",
                  )
                  .replace(
                    "和孩子聊一会儿，为他做一份专属的童年特别刊。记录小小的想法、家人的爱与尚未展开的可能。",
                    "从八个问题开始，整理工作中的成就、消耗与选择，留下一份属于自己的职场人物报。",
                  )
                  .replace("#fffaf0", "#f5f2ea")
                  .replace(
                    "</head>",
                    '<link rel="icon" href="/partner.svg"/></head>',
                  ),
            },
          },
        ]
      : []),
  ],
}));
