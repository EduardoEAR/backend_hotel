const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

let porta = 3004;
app.listen(porta, () => {
  console.log("Servidor em execução na porta: " + porta);
});

const sqlite3 = require("sqlite3");

// acessa o arquivo com o banco de dados
var db = new sqlite3.Database("./acessos.db", (err) => {
  if (err) {
    console.log("ERRO: não foi possível conectar ao SQLite.");
    throw err;
  }
  console.log("Conectado ao SQLite!");
});

// cria a tabela acesso, caso ela não exista
db.run(
  `CREATE TABLE IF NOT EXISTS acesso
        (id INTEGER PRIMARY KEY AUTOINCREMENT, 
         quarto_numero INTEGER NOT NULL, 
         status_acesso TEXT NOT NULL, 
         data_hora TEXT NOT NULL)`,
  [],
  (err) => {
    if (err) {
      console.log("ERRO: não foi possível criar tabela.");
      throw err;
    }
  },
);

// POST /acessos - registra e valida tentativa de abertura na fechadura
app.post("/acessos", async (req, res, next) => {
  try {
    const quarto_numero = req.body.quarto_numero;
    const senha_digitada = req.body.senha;
    const data_atual = new Date(); // data e hora do momento da tentativa

    // comunicação inter-serviços
    const respostaSenhas = await axios.get("http://localhost:3003/senhas");
    const senhasAtivas = respostaSenhas.data; // parse automático pelo Axios

    let acessoAutorizado = false; // RN

    // loop das senhas para ver se existe alguma válida para este quarto agora
    for (let i = 0; i < senhasAtivas.length; i++) {
      let s = senhasAtivas[i];
      let inicio = new Date(s.data_inicio);
      let fim = new Date(s.data_fim);

      if (s.quarto_numero == quarto_numero && s.codigo == senha_digitada) {
        if (data_atual >= inicio && data_atual <= fim) {
          acessoAutorizado = true;
          break; // senha válida
        }
      }
    }

    const status = acessoAutorizado ? "Autorizado" : "Negado";

    // log: salva tentativa no banco de dados local
    db.run(
      `INSERT INTO acesso(quarto_numero, status_acesso, data_hora) VALUES(?,?,?)`,
      [quarto_numero, status, data_atual.toISOString()],
      (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Erro ao registrar acesso no banco de dados.");
        } else {
          // devolve a resposta final para a fechadura com base na validação
          if (acessoAutorizado) {
            console.log("Acesso Autorizado para o quarto " + quarto_numero);
            res.status(200).send("Acesso autorizado: fechadura liberada");
          } else {
            console.log("Acesso Negado para o quarto " + quarto_numero);
            res.status(401).send("Acesso negado: senha incorreta ou expirada.");
          }
        }
      },
    );
  } catch (erro) {
    // microsserviço de senhas (porta 3003) offline
    console.log(
      "Erro na comunicação com o microsserviço de Senhas: ",
      erro.message,
    );
    res.status(500).send("Erro interno. Sistema de senhas indisponível.");
  }
});

// GET /acessos - histórico de entradas autorizadas e negadas
app.get("/acessos", (req, res, next) => {
  db.all(`SELECT * FROM acesso`, [], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Erro ao obter histórico.");
    } else {
      res.status(200).json(result);
    }
  });
});
