import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // src/lib/file-upload.ts tillåter filer upp till 5 MB, men Next.js
    // Server Actions har en egen gräns (1 MB som standard) på själva
    // HTTP-anropet - den måste höjas separat, annars stoppas stora filer
    // redan innan de når vår egen 5 MB-kontroll. Lite marginal utöver 5 MB
    // för multipart/form-data-overhead (gränsvärden, fältnamn m.m.).
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
