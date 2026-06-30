export async function onRequest(context) {
  const { request, env } = context;

  // Extract query parameters from incoming request
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Construct the target URL to QR Maker API
  const targetUrl = new URL('https://qrmaker.ryanmarch.me/api/qr');
  targetUrl.search = searchParams.toString();

  // Set the Bearer authorization header using the environment variable secret
  const headers = new Headers();
  const apiKey = env.MOTION_POSTER_API_KEY;
  if (apiKey) {
    headers.set('Authorization', `Bearer ${apiKey}`);
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: headers
    });

    // Return the response back to the client (preserving headers like content-type, cache-control)
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to proxy request to QR Maker API' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
