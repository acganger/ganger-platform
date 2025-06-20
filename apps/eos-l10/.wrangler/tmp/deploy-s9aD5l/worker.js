var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        service: "eos-l10-management",
        deployment: "r2-cloudflare-workers"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (url.pathname === "/") {
      url.pathname = "/index.html";
    }
    if (url.pathname.endsWith("/")) {
      url.pathname += "index.html";
    }
    if (!url.pathname.includes(".") && !url.pathname.endsWith("/")) {
      url.pathname += ".html";
    }
    const key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
    try {
      const object = await env.EOS_L10_BUCKET.get(key);
      if (!object) {
        const indexObject = await env.EOS_L10_BUCKET.get("index.html");
        if (indexObject) {
          return new Response(indexObject.body, {
            headers: {
              "Content-Type": "text/html",
              "Cache-Control": "public, max-age=86400"
            }
          });
        }
        return new Response("Not Found", { status: 404 });
      }
      const contentType = getContentType(key);
      return new Response(object.body, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": getCacheControl(key),
          "ETag": object.etag
        }
      });
    } catch (error) {
      console.error("R2 fetch error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
};
function getContentType(key) {
  const ext = key.split(".").pop()?.toLowerCase();
  const types = {
    "html": "text/html",
    "css": "text/css",
    "js": "application/javascript",
    "json": "application/json",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "svg": "image/svg+xml",
    "ico": "image/x-icon",
    "woff": "font/woff",
    "woff2": "font/woff2",
    "ttf": "font/ttf",
    "eot": "application/vnd.ms-fontobject",
    "webmanifest": "application/manifest+json"
  };
  return types[ext] || "application/octet-stream";
}
__name(getContentType, "getContentType");
function getCacheControl(key) {
  if (key.includes("/_next/static/")) {
    return "public, max-age=31536000, immutable";
  }
  if (key === "sw.js" || key.endsWith(".js") && key.includes("workbox")) {
    return "public, max-age=0, must-revalidate";
  }
  if (key.endsWith(".html")) {
    return "public, max-age=86400";
  }
  return "public, max-age=86400";
}
__name(getCacheControl, "getCacheControl");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
