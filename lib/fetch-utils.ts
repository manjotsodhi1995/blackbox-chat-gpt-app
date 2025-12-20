/**
 * Fetch utility with ngrok support
 * 
 * Automatically adds ngrok-skip-browser-warning header to bypass ngrok warning pages
 */

interface FetchOptions extends RequestInit {
  skipNgrokWarning?: boolean;
}

/**
 * Enhanced fetch function that automatically adds ngrok-skip-browser-warning header
 * when making requests to ngrok URLs
 */
export async function fetchWithNgrokSupport(
  url: string | URL,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipNgrokWarning = true, headers = {}, ...restOptions } = options;
  
  // Check if URL is an ngrok URL
  const urlString = typeof url === 'string' ? url : url.toString();
  const isNgrokUrl = urlString.includes('ngrok-free.dev') || urlString.includes('ngrok.io');
  
  // Add ngrok-skip-browser-warning header if needed
  const enhancedHeaders = new Headers(headers);
  if (skipNgrokWarning && isNgrokUrl) {
    enhancedHeaders.set('ngrok-skip-browser-warning', 'true');
  }
  
  // Also add a custom User-Agent to bypass ngrok warning
  if (skipNgrokWarning && isNgrokUrl && !enhancedHeaders.has('User-Agent')) {
    enhancedHeaders.set('User-Agent', 'MCP-Server/1.0');
  }
  
  return fetch(url, {
    ...restOptions,
    headers: enhancedHeaders,
  });
}

