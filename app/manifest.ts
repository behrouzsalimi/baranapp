import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "اپلیکیشن باران",
    short_name: "باران",
    description: "برنامه تمرین و انگیزه باران",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f3ff",
    theme_color: "#7c3aed",
    orientation: "portrait",
    lang: "fa",
    dir: "rtl",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}