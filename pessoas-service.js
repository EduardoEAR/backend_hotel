const express = require("express");
const app = express();

app.use(express.json());

let porta = 3002;
app.listen(porta, () => {
  console.log("Servidor em execução na porta: " + porta);
});

const sqlite3 = require("sqlite3");

// acessa o arquivo com o banco de dados
var db = new sqlite3.Database("./pessoas.db", (err) => {
  if (err) {
    console.log("ERRO: não foi possível conectar ao SQLite.");
    throw err;
  }
  console.log("Conectado ao SQLite!");
});

// cria a tabela pessoa, caso ela não exista
db.run(
  `CREATE TABLE IF NOT EXISTS pessoa
        (nome TEXT NOT NULL, 
         cpf TEXT PRIMARY KEY NOT NULL UNIQUE, 
         tipo_perfil TEXT NOT NULL)`,
  [],
  (err) => {
    if (err) {
      console.log("ERRO: não foi possível criar tabela.");
      throw err;
    }
  },
);

// POST /pessoas
app.post("/pessoas", (req, res, next) => {
  db.run(
    `INSERT INTO pessoa(nome, cpf, tipo_perfil) VALUES(?,?,?)`,
    [req.body.nome, req.body.cpf, req.body.tipo_perfil],
    (err) => {
      if (err) {
        console.error(err);
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(409).send("Erro: CPF já cadastrado.");
        } else if (err.message.includes("NOT NULL constraint failed")) {
          return res.status(400).send("Erro: Dados incompletos.");
        }
        return res.status(500).send("Erro ao cadastrar pessoa.");
      }
      console.log("Pessoa cadastrada com sucesso!");
      res.status(201).send("Pessoa cadastrada com sucesso!");
    },
  );
});

// GET /pessoas
app.get("/pessoas", (req, res, next) => {
  db.all(`SELECT * FROM pessoa`, [], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Erro ao obter dados.");
    } else {
      res.status(200).json(result);
    }
  });
});

// GET /pessoas/<cpf>
app.get("/pessoas/:cpf", (req, res, next) => {
  db.get(
    `SELECT * FROM pessoa WHERE cpf = ?`,
    req.params.cpf,
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Erro ao obter dados.");
      } else if (result == null) {
        console.log("Pessoa não encontrada.");
        res.status(404).send("Pessoa não encontrada.");
      } else {
        res.status(200).json(result);
      }
    },
  );
});

// PATCH /pessoas/<cpf>
app.patch("/pessoas/:cpf", (req, res, next) => {
  if (req.body.cpf && req.body.cpf !== req.params.cpf) {
    return res.status(400).send("Erro: Não é permitido alterar o CPF de uma pessoa já cadastrada.");
  }
  db.run(
    `UPDATE pessoa SET nome = COALESCE(?,nome), tipo_perfil = COALESCE(?,tipo_perfil) WHERE cpf = ?`,
    [req.body.nome, req.body.tipo_perfil, req.params.cpf],
    function (err) {
      if (err) {
        res.status(500).send("Erro ao alterar dados.");
      } else if (this.changes == 0) {
        console.log("Pessoa não encontrada.");
        res.status(404).send("Pessoa não encontrada.");
      } else {
        res.status(200).send("Pessoa alterada com sucesso!");
      }
    },
  );
});

// DELETE /pessoas/<cpf>
app.delete("/pessoas/:cpf", (req, res, next) => {
  db.run(`DELETE FROM pessoa WHERE cpf = ?`, req.params.cpf, function (err) {
    if (err) {
      res.status(500).send("Erro ao remover pessoa.");
    } else if (this.changes == 0) {
      console.log("Pessoa não encontrada.");
      res.status(404).send("Pessoa não encontrada.");
    } else {
      res.status(200).send("Pessoa removida com sucesso!");
    }
  });
});
