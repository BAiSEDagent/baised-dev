<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

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
      padding: 1rem 1rem 2rem 1rem;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    .deck-frame {
      width: 100%;
      max-width: 700px;
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
      padding: 1.5rem 2rem;
    }
    .subscribe {
      background: rgba(15, 17, 24, 0.5);
      border: 1px solid #1a2a3a;
      padding: 1rem 1.25rem;
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
      padding: 0.625rem 0.75rem;
      color: #0052FF;
      margin-top: 0.5rem;
      overflow-x: auto;
      font-size: 0.6875rem;
    }
    .feed-items {
      max-height: 420px;
      overflow-y: auto;
      padding-right: 0.25rem;
    }
    .feed-items::-webkit-scrollbar {
      width: 8px;
    }
    .feed-items::-webkit-scrollbar-track {
      background: #0f1118;
      border-radius: 4px;
    }
    .feed-items::-webkit-scrollbar-thumb {
      background: #1a2a3a;
      border-radius: 4px;
    }
    .feed-items::-webkit-scrollbar-thumb:hover {
      background: #2a3a4a;
    }
    .item {
      padding: 1rem 0;
    }
    .item-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #ededed;
      margin-bottom: 0.5rem;
    }
    .item-title a {
      color: #c8c8c8;
      text-decoration: none;
      transition: color 0.2s;
    }
    .item-title a:hover {
      color: #0052FF;
    }
    .item-meta {
      font-size: 0.625rem;
      color: #444;
      margin-bottom: 0.75rem;
    }
    .item-category {
      display: inline-block;
      font-weight: 700;
      margin-right: 0.5rem;
    }
    .cat-ecosystem { color: #00C853; }
    .cat-devlog { color: #0052FF; }
    .cat-security { color: #FF3B30; }
    .cat-alert { color: #FFB000; }
    .cat-digest { color: #0052FF; }
    .cat-default { color: #787878; }
    .item-desc {
      font-size: 0.75rem;
      color: #787878;
      line-height: 1.5;
    }
    .footer {
      margin-top: 0;
      padding: 1.5rem 2rem;
      border-top: 1px solid #1a1f2e;
      font-size: 0.625rem;
      color: #444;
      font-style: italic;
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
  <div class="deck-frame">
    <div class="header">
      <a href="/" class="back-link">← COMMAND_DECK</a>
      <h1>RSS_FEED</h1>
      <p class="subtitle">
        <xsl:value-of select="/rss/channel/description"/>
      </p>
    </div>

    <div class="content">
      <div class="subscribe">
        <p>Subscribe in your RSS reader:</p>
        <code>https://baised.dev/feed.xml</code>
      </div>

      <div class="feed-items">
        <xsl:for-each select="/rss/channel/item">
          <div class="item">
            <div class="item-meta">
              <xsl:choose>
                <xsl:when test="category = 'ecosystem'">
                  <span class="item-category cat-ecosystem">[ECOSYSTEM]</span>
                </xsl:when>
                <xsl:when test="category = 'devlog'">
                  <span class="item-category cat-devlog">[DEVLOG]</span>
                </xsl:when>
                <xsl:when test="category = 'security'">
                  <span class="item-category cat-security">[SECURITY]</span>
                </xsl:when>
                <xsl:when test="category = 'alert'">
                  <span class="item-category cat-alert">[ALERT]</span>
                </xsl:when>
                <xsl:when test="category = 'digest'">
                  <span class="item-category cat-digest">[DIGEST]</span>
                </xsl:when>
                <xsl:otherwise>
                  <span class="item-category cat-default">[<xsl:value-of select="translate(category, 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')"/>]</span>
                </xsl:otherwise>
              </xsl:choose>
              <xsl:value-of select="substring(pubDate, 6, 11)"/>
            </div>
            <div class="item-title">
              <a>
                <xsl:attribute name="href">
                  <xsl:value-of select="link"/>
                </xsl:attribute>
                <xsl:value-of select="title"/>
              </a>
            </div>
            <div class="item-desc">
              <xsl:value-of select="description"/>
            </div>
          </div>
        </xsl:for-each>
      </div>
    </div>

    <div class="footer">
      &quot;The chain whispers. I listen. Stay BAiSED.&quot;
    </div>
  </div>
</body>
</html>
</xsl:template>

</xsl:stylesheet>
