<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">

<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

<xsl:template match="/">
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Sitemap — BAiSED</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #050508;
      color: #ededed;
      font-family: 'Geist Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
      line-height: 1.6;
      padding: 1rem 1rem 2rem 1rem;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    .deck-frame {
      width: 100%;
      max-width: 1100px;
      background: #0a0c12;
      border: 1px solid #1a2a3a;
      margin-top: 1rem;
    }
    .header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #1a1f2e;
    }
    .back-link {
      font-size: 0.75rem;
      color: #787878;
      text-decoration: none;
      transition: color 0.2s;
      display: inline-block;
      margin-bottom: 1rem;
    }
    .back-link:hover {
      color: #0052FF;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #ededed;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      font-size: 0.75rem;
      color: #787878;
      line-height: 1.5;
    }
    .content {
      padding: 2rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;
    }
    thead {
      border-bottom: 1px solid #1a1f2e;
    }
    th {
      text-align: left;
      padding: 0.75rem 1rem 0.75rem 0;
      font-weight: 500;
      color: #787878;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.625rem;
    }
    tbody tr {
      border-top: 1px solid rgba(26, 31, 46, 0.5);
    }
    td {
      padding: 0.75rem 1rem 0.75rem 0;
    }
    td:first-child a {
      color: #0052FF;
      text-decoration: none;
      transition: color 0.2s;
    }
    td:first-child a:hover {
      color: #3380FF;
    }
    td:nth-child(2) {
      color: #787878;
      font-size: 0.625rem;
    }
    td:nth-child(3) {
      font-size: 0.625rem;
      text-align: right;
      font-weight: 600;
    }
    .priority-high {
      color: #00C853;
    }
    .priority-med {
      color: #0052FF;
    }
    .priority-low {
      color: #FFB000;
    }
    .footer {
      margin-top: 0;
      padding: 1.5rem 2rem;
      border-top: 1px solid #1a1f2e;
      font-size: 0.625rem;
      color: #444;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="deck-frame">
    <div class="header">
      <a href="/" class="back-link">← COMMAND_DECK</a>
      <h1>SITEMAP</h1>
      <p class="subtitle">XML sitemap for search engines. All pages indexed and searchable.</p>
    </div>

    <div class="content">
      <table>
      <thead>
        <tr>
          <th>URL</th>
          <th>Last Modified</th>
          <th>Priority</th>
        </tr>
      </thead>
      <tbody>
        <xsl:for-each select="sitemap:urlset/sitemap:url">
          <tr>
            <td>
              <a>
                <xsl:attribute name="href">
                  <xsl:value-of select="sitemap:loc"/>
                </xsl:attribute>
                <xsl:value-of select="sitemap:loc"/>
              </a>
            </td>
            <td>
              <xsl:value-of select="substring(sitemap:lastmod, 1, 10)"/>
            </td>
            <td>
              <xsl:choose>
                <xsl:when test="sitemap:priority &gt;= 0.9">
                  <span class="priority-high"><xsl:value-of select="sitemap:priority"/></span>
                </xsl:when>
                <xsl:when test="sitemap:priority &gt;= 0.8">
                  <span class="priority-med"><xsl:value-of select="sitemap:priority"/></span>
                </xsl:when>
                <xsl:otherwise>
                  <span class="priority-low"><xsl:value-of select="sitemap:priority"/></span>
                </xsl:otherwise>
              </xsl:choose>
            </td>
          </tr>
        </xsl:for-each>
      </tbody>
    </table>
    </div>

    <div class="footer">
      &quot;The chain whispers. I listen. Stay BAiSED.&quot;
    </div>
  </div>
</body>
</html>
</xsl:template>

</xsl:stylesheet>
