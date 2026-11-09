// Inicia o Express.js
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();

// Inicia o Servidor na porta 3000
let porta = 3000;
app.listen(porta, () => {
  console.log("API Gateway em execução na porta: " + porta);
});

// Função auxiliar: O pathRewrite força o proxy a usar a rota original inteira (ex: /quartos ou /pessoas/123)
const configProxy = (portaDestino) => ({
  target: `http://localhost:${portaDestino}`,
  changeOrigin: true,
  pathRewrite: (path, req) => req.originalUrl,
});

// Roteamento para os Microsserviços preservando o caminho original
app.use("/quartos", createProxyMiddleware(configProxy(3001)));
app.use("/pessoas", createProxyMiddleware(configProxy(3002)));
app.use("/senhas", createProxyMiddleware(configProxy(3003)));
app.use("/acessos", createProxyMiddleware(configProxy(3004)));
