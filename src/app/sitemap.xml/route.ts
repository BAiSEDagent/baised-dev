export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://baised.dev';
  const now = new Date().toISOString();

  const routes = [
    { url: baseUrl, priority: 1.0 },
    { url: `${baseUrl}/agents`, priority: 0.9 },
    { url: `${baseUrl}/digest`, priority: 0.8 },
    { url: `${baseUrl}/search`, priority: 0.7 },
    { url: `${baseUrl}/dashboard`, priority: 0.8 },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${route.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
