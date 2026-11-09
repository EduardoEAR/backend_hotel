const express = require("express");
const app = express();

app.use(express.json());

let porta = 3001;
app.listen(porta, () => {
  console.log("Servidor em execução na porta: " + porta);
});

const sqlite3 = require("sqlite3");

// acessa o arquivo com o banco de dados
var db = new sqlite3.Database("./quartos.db", (err) => {
  if (err) {
    console.log("ERRO: não foi possível conectar ao SQLite.");
    throw err;
  }
  console.log("Conectado ao SQLite!");
});

// cria a tabela quarto, caso ela não exista
db.run(
  `CREATE TABLE IF NOT EXISTS quarto
        (numero INTEGER PRIMARY KEY NOT NULL UNIQUE, 
         fechadura_id TEXT NOT NULL UNIQUE, 
         status TEXT NOT NULL)`,
  [],
  (err) => {
    if (err) {
      console.log("ERRO: não foi possível criar tabela.");
      throw err;
    }
  },
);

// POST /quartos
app.post("/quartos", (req, res, next) => {
  db.run(
    `INSERT INTO quarto(numero, fechadura_id, status) VALUES(?,?,?)`,
    [req.body.numero, req.body.fechadura_id, req.body.status],
    (err) => {
      if (err) {
        console.error(err);
        if (err.message.includes("UNIQUE constraint failed")) {
          if (err.message.includes("quarto.fechadura_id")) {
            return res
              .status(409)
              .send("Erro: Fechadura já cadastrada em outro quarto.");
          }
          return res.status(409).send("Erro: Número de quarto já cadastrado.");
        } else if (err.message.includes("NOT NULL constraint failed")) {
          return res.status(400).send("Erro: Dados incompletos.");
        }
        return res.status(500).send("Erro ao cadastrar quarto.");
      }
      console.log("Quarto cadastrado com sucesso!");
      res.status(201).send("Quarto cadastrado com sucesso!");
    },
  );
});

// GET /quartos
app.get("/quartos", (req, res, next) => {
  db.all(`SELECT * FROM quarto`, [], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Erro ao obter dados.");
    } else {
      res.status(200).json(result);
    }
  });
});

// GET /quartos/<numero>
app.get("/quartos/:numero", (req, res, next) => {
  db.get(
    `SELECT * FROM quarto WHERE numero = ?`,
    req.params.numero,
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Erro ao obter dados.");
      } else if (result == null) {
        console.log("Quarto não encontrado.");
        res.status(404).send("Quarto não encontrado.");
      } else {
        res.status(200).json(result);
      }
    },
  );
});

// PATCH /quartos/<numero>
app.patch("/quartos/:numero", (req, res, next) => {
  db.run(
    `UPDATE quarto SET fechadura_id = COALESCE(?,fechadura_id), status = COALESCE(?,status) WHERE numero = ?`,
    [req.body.fechadura_id, req.body.status, req.params.numero],
    function (err) {
      if (err) {
        res.status(500).send("Erro ao alterar dados.");
      } else if (this.changes == 0) {
        console.log("Quarto não encontrado.");
        res.status(404).send("Quarto não encontrado.");
      } else {
        res.status(200).send("Quarto alterado com sucesso!");
      }
    },
  );
});

// DELETE /quartos/<numero>
app.delete("/quartos/:numero", (req, res, next) => {
  db.run(
    `DELETE FROM quarto WHERE numero = ?`,
    req.params.numero,
    function (err) {
      if (err) {
        res.status(500).send("Erro ao remover quarto.");
      } else if (this.changes == 0) {
        console.log("Quarto não encontrado.");
        res.status(404).send("Quarto não encontrado.");
      } else {
        res.status(200).send("Quarto removido com sucesso!");
      }
    },
  );
});
