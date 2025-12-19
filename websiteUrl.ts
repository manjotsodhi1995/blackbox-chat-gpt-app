export const websiteURL = (() => {
  const url = process.env.BLACKBOX_V0CC_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://" +
        (process.env.VERCEL_ENV === "production"
          ? process.env.VERCEL_PROJECT_PRODUCTION_URL
          : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL));
  
  // Log the URL being used (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log("[MCP] Using website URL:", url);
    console.log("[MCP] BLACKBOX_V0CC_URL:", process.env.BLACKBOX_V0CC_URL || "not set");
  }
  
  return url;
})();

