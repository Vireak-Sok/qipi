const nextConfig = {
  poweredByHeader: false,
  // The page shell is read by the server and must accompany Vercel functions.
  outputFileTracingIncludes: {
    "/*": ["./public/index.html"]
  }
};

export default nextConfig;
