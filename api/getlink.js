export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const link = searchParams.get("link");

  if (!link) {
    return new Response(
      JSON.stringify({ error: "Missing ?link=" }),
      { headers: { "content-type": "application/json" } }
    );
  }

  try {
    const resp = await fetch(`https://agent-link-converter

.vercel.app/?link=${encodeURIComponent(link)}`);
    const text = await resp.text();

    const match = text.match(/https:\/\/mulebuy\.com\/product[^"']+/);
    const mulebuy = match ? match[0] : null;

    return new Response(
      JSON.stringify({ mulebuy }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { headers: { "content-type": "application/json" } }
    );
  }
}
