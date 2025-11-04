// /api/getlink.js
// Node-safe version of your link converter logic

// Simple helpers
function normalizeUrlCandidate(input) {
  let s = input.trim();
  if (!s) return null;
  s = s.replace(/^<+|>+$/g, '');
  return s;
}

function tryParseURL(str) {
  try {
    return new URL(str);
  } catch {
    return null;
  }
}

// Core logic
function extractProductID(urlStr) {
  const url = tryParseURL(urlStr);
  if (!url) return { id: null, platform: null, raw: null, reason: 'invalid_url' };
  const host = url.hostname;
  const full = urlStr;

  if (/taobao\.com|tmall\.com/.test(host) || full.includes('item.taobao')) {
    const m = full.match(/[?&]id=(\d{4,})/);
    if (m) {
      const id = m[1];
      return { id, platform: 'taobao', raw: `https://item.taobao.com/item.htm?id=${id}` };
    }
    const m2 = full.match(/\/detail\/(\d+)/);
    if (m2) {
      return { id: m2[1], platform: 'taobao', raw: `https://item.taobao.com/item.htm?id=${m2[1]}` };
    }
    return { id: null, platform: 'taobao', raw: null, reason: 'needs_redirect_resolution' };
  }

  if (/1688\.com/.test(host) || full.includes('offer/')) {
    const m = full.match(/offer\/(\d+)\.html/);
    if (m) return { id: m[1], platform: '1688', raw: `https://detail.1688.com/offer/${m[1]}.html` };
    return { id: null, platform: '1688', raw: null, reason: 'needs_redirect_resolution' };
  }

  if (/weidian\.com/.test(host) || full.includes('weidian.com')) {
    const m = full.match(/[?&](?:itemID|itemId)=(\d+)/);
    if (m) return { id: m[1], platform: 'weidian', raw: `https://weidian.com/item.html?itemID=${m[1]}` };
    const m2 = full.match(/weidian\.com\/item\/(\d+)/);
    if (m2) return { id: m2[1], platform: 'weidian', raw: `https://weidian.com/item.html?itemID=${m2[1]}` };
    return { id: null, platform: 'weidian', raw: null, reason: 'needs_redirect_resolution' };
  }

  return { id: null, platform: null, raw: null, reason: 'unsupported_domain' };
}

// Mulebuy agent template
const AGENTS = {
  mulebuy: {
    template: 'https://mulebuy.com/item?url={encodedRaw}'
  }
};

function buildAgentLink(agentKey, ctx) {
  const a = AGENTS[agentKey];
  if (!a) return null;
  return a.template.replace(/\{(.*?)\}/g, (_, key) => {
    if (key === 'encodedRaw') return encodeURIComponent(ctx.raw || '');
    if (key === 'encodedLink') return encodeURIComponent(ctx.raw || '');
    if (key === 'raw') return ctx.raw || '';
    if (key === 'id') return ctx.id || '';
    if (key === 'platform') return ctx.platform || '';
    return '';
  });
}

// API handler
export default function handler(req, res) {
  try {
    const { link } = req.query;
    if (!link) {
      return res.status(400).json({ error: "Missing 'link' parameter" });
    }

    const normalized = normalizeUrlCandidate(link);
    const extracted = extractProductID(normalized);

    if (!extracted.id || !extracted.raw) {
      return res.status(400).json({ error: "Could not extract product info", reason: extracted.reason });
    }

    const mulebuy = buildAgentLink('mulebuy', extracted);

    if (!mulebuy) {
      return res.status(500).json({ error: "Failed to build Mulebuy link" });
    }

    res.status(200).json({
      platform: extracted.platform,
      id: extracted.id,
      source: extracted.raw,
      converted: mulebuy
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
