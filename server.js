const http = require("http");
const fs = require("fs");
const path = require("path");

const DEFAULT_PORT = Number(process.env.PORT) || 8080;
const HOST = "127.0.0.1";
const ROOT = __dirname;
let activePort = DEFAULT_PORT;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function resolvePath(urlPath) {
  const safePath = decodeURIComponent(urlPath.split("?")[0]);
  const relativePath = safePath === "/" ? "/index.html" : safePath;
  const normalized = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  return path.join(ROOT, normalized);
}

function sendNotFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("404 - Archivo no encontrado");
}

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url || "/");

  if (!filePath.startsWith(ROOT)) {
    sendNotFound(res);
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendNotFound(res);
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || "application/octet-stream";

    fs.readFile(filePath, (readError, data) => {
      if (readError) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("500 - Error interno al leer el archivo");
        return;
      }

      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
  });
});

server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    activePort += 1;
    server.listen(activePort, HOST);
    return;
  }
  console.error("Error del servidor:", error);
});

server.on("listening", () => {
  const address = server.address();
  if (address && typeof address === "object") {
    activePort = address.port;
  }
  console.log(`Servidor activo en http://${HOST}:${activePort}`);
});

server.listen(activePort, HOST);
