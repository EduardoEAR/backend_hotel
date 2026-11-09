const express = require("express");
const app = express();

app.use(express.json());

let porta = 3003;
app.listen(porta, () => {
  console.log("Servidor em execução na porta: " + porta);
});

const sqlite3 = require("sqlite3");

// acessa o arquivo com o banco de dados
var db = new sqlite3.Database("./senhas.db", (err) => {
  if (err) {
    console.log("ERRO: não foi possível conectar ao SQLite.");
    throw err;
  }
  console.log("Conectado ao SQLite!");
});

// cria a tabela senha, caso ela não exista
db.run(
  `CREATE TABLE IF NOT EXISTS senha
        (id INTEGER PRIMARY KEY AUTOINCREMENT, 
         codigo TEXT NOT NULL,
         pessoa_cpf TEXT NOT NULL,
         quarto_numero INTEGER NOT NULL,
         data_inicio TEXT NOT NULL,
         data_fim TEXT NOT NULL)`,
  [],
  (err) => {
    if (err) {
      console.log("ERRO: não foi possível criar tabela.");
      throw err;
    }
  },
);

// POST /senhas
app.post("/senhas", (req, res, next) => {
  db.run(
    `INSERT INTO senha(codigo, pessoa_cpf, quarto_numero, data_inicio, data_fim) VALUES(?,?,?,?,?)`,
    [
      req.body.codigo,
      req.body.pessoa_cpf,
      req.body.quarto_numero,
      req.body.data_inicio,
      req.body.data_fim,
    ],
    (err) => {
      if (err) {
        console.error(err);
        if (err.message.includes("NOT NULL constraint failed")) {
          return res.status(400).send("Erro: Dados incompletos.");
        }
        return res.status(500).send("Erro ao cadastrar senha.");
      }
      console.log("Senha cadastrada com sucesso!");
      res.status(201).send("Senha cadastrada com sucesso!");
    },
  );
});

// GET /senhas
app.get("/senhas", (req, res, next) => {
  db.all(`SELECT * FROM senha`, [], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Erro ao obter dados.");
    } else {
      res.status(200).json(result);
    }
  });
});

// GET /senhas/<id>
app.get("/senhas/:id", (req, res, next) => {
  db.get(`SELECT * FROM senha WHERE id = ?`, req.params.id, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Erro ao obter dados.");
    } else if (result == null) {
      console.log("Senha não encontrada.");
      res.status(404).send("Senha não encontrada.");
    } else {
      res.status(200).json(result);
    }
  });
});

// PATCH /senhas/<id>
app.patch("/senhas/:id", (req, res, next) => {
  db.run(
    `UPDATE senha SET codigo = COALESCE(?,codigo), pessoa_cpf = COALESCE(?,pessoa_cpf), quarto_numero = COALESCE(?,quarto_numero), data_inicio = COALESCE(?,data_inicio), data_fim = COALESCE(?,data_fim) WHERE id = ?`,
    [
      req.body.codigo,
      req.body.pessoa_cpf,
      req.body.quarto_numero,
      req.body.data_inicio,
      req.body.data_fim,
      req.params.id,
    ],
    function (err) {
      if (err) {
        res.status(500).send("Erro ao alterar dados.");
      } else if (this.changes == 0) {
        console.log("Senha não encontrada.");
        res.status(404).send("Senha não encontrada.");
      } else {
        res.status(200).send("Senha alterada com sucesso!");
      }
    },
  );
});

// DELETE /senhas/<id>
app.delete("/senhas/:id", (req, res, next) => {
  db.run(`DELETE FROM senha WHERE id = ?`, req.params.id, function (err) {
    if (err) {
      res.status(500).send("Erro ao remover senha.");
    } else if (this.changes == 0) {
      console.log("Senha não encontrada.");
      res.status(404).send("Senha não encontrada.");
    } else {
      res.status(200).send("Senha removida com sucesso!");
    }
  });
});
