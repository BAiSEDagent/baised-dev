<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

<xsl:template match="/">
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>RSS Feed — BAiSED</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #050508;
      color: #ededed;
      font-family: 'Geist Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
      line-height: 1.6;
      padding: 2rem;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      background: #0a0c12;
      border: 1px solid #1a2a3a;
      padding: 2rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
      color: #ededed;
    }
    .subtitle {
      font-size: 0.75rem;
      color: #787878;
      margin-bottom: 2rem;
      line-height: 1.5;
    }
    .subscribe {
      background: #0f1118;
      border: 1px solid #1a2a3a;
      padding: 1rem;
      margin-bottom: 2rem;
      font-size: 0.75rem;
    }
    .subscribe p {
      color: #787878;
      margin-bottom: 0.5rem;
    }
    .subscribe code {
      display: block;
      background: #050508;
      border: 1px solid #1a2a3a;
      padding: 0.5rem;
      color: #ededed;
      margin-top: 0.5rem;
      overflow-x: auto;
    }
    .item {
      border-top: 1px solid #1a1f2e;
      padding: 1.5rem 0;
    }
    .item:first-child {
      border-top: none;
      padding-top: 0;
    }
    .item-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #ededed;
      margin-bottom: 0.5rem;
    }
    .item-title a {
      color: #0052FF;
      text-decoration: none;
      transition: color 0.2s;
    }
    .item-title a:hover {
      color: #3380FF;
    }
    .item-meta {
      font-size: 0.625rem;
      color: #444;
      margin-bottom: 0.75rem;
    }
    .item-desc {
      font-size: 0.75rem;
      color: #c8c8c8;
      line-height: 1.5;
    }
    .footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #1a1f2e;
      font-size: 0.625rem;
      color: #444;
    }
    a {
      color: #0052FF;
      text-decoration: none;
      transition: color 0.2s;
    }
    a:hover {
      color: #3380FF;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>RSS_FEED</h1>
    <p class="subtitle">
      <xsl:value-of select="/rss/channel/description"/>
      <br/>
      <a href="/">← Back to site</a>
    </p>

    <div class="subscribe">
      <p>Subscribe in your RSS reader:</p>
      <code>https://baised.dev/feed.xml</code>
    </div>

    <div>
      <xsl:for-each select="/rss/channel/item">
        <div class="item">
          <div class="item-title">
            <a>
              <xsl:attribute name="href">
                <xsl:value-of select="link"/>
              </xsl:attribute>
              <xsl:value-of select="title"/>
            </a>
          </div>
          <div class="item-meta">
            <xsl:value-of select="pubDate"/> · <xsl:value-of select="category"/>
          </div>
          <div class="item-desc">
            <xsl:value-of select="description"/>
          </div>
        </div>
      </xsl:for-each>
    </div>

    <div class="footer">
      Updated: <xsl:value-of select="/rss/channel/lastBuildDate"/> · baised.dev
    </div>
  </div>
</body>
</html>
</xsl:template>

</xsl:stylesheet>
