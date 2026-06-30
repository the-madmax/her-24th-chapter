const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["three", "@react-three/drei", "@react-three/fiber"]
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0, must-revalidate"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
