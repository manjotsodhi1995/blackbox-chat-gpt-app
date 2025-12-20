export const baseURL = (() => {
  // Allow explicit override via environment variable (useful for ngrok, custom domains, etc.)
  if (process.env.MCP_BASE_URL) {
    return process.env.MCP_BASE_URL;
  }
  
  // Development mode
  if (process.env.NODE_ENV == "development") {
    return "http://localhost:3000";
  }
  
  // Production/Vercel
  return "https://" +
    (process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL);
})();
