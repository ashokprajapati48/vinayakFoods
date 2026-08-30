import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow all local-network devices (phones, tablets, kitchen screens)
  // to load JS/CSS assets from this dev server without being blocked.
  allowedDevOrigins: [
    "10.62.192.190",   // current laptop Wi-Fi IP
    "10.*.*.*",        // any 10.x.x.x LAN device
    "192.168.*.*",     // any 192.168.x.x LAN device
    "172.*.*.*",       // any 172.x.x.x LAN device
  ],
};

export default nextConfig;
