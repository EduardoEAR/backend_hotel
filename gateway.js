const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();

let porta = 3000;
app.listen(porta, () => {
  console.log("API Gateway em execução na porta: " + porta);
});

const configProxy = (portaDestino) => ({
  target: `http://localhost:${portaDestino}`,
  changeOrigin: true,
  pathRewrite: (path, req) => req.originalUrl,
});

// roteamento para os microsserviços
app.use("/quartos", createProxyMiddleware(configProxy(3001)));
app.use("/pessoas", createProxyMiddleware(configProxy(3002)));
app.use("/senhas", createProxyMiddleware(configProxy(3003)));
app.use("/acessos", createProxyMiddleware(configProxy(3004)));
