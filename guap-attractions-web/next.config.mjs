/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * В режиме разработки отключаем файловый кэш Webpack: на путях вроде OneDrive
   * часто бывают ENOENT при rename файлов кэша (.pack.gz_), из‑за чего ломается
   * сборка и маршруты отдают 404/500. Минус — чуть медленнее первые компиляции.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
