// Backend da Lista de Tarefas — Node.js + Express
// Os dados ficam em memória: ao reiniciar (ou em um "cold start" da Vercel),
// as duas tarefas de exemplo voltam automaticamente.

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- "Banco de dados" em memória com 2 exemplos ----------
let tasks = [
  {
    id: 1,
    title: "Bem-vindo! Marque esta tarefa como concluída",
    done: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Edite ou exclua esta tarefa de exemplo",
    done: false,
    createdAt: new Date().toISOString(),
  },
];
let nextId = 3;

// ---------- Validação ----------
function validateTitle(title) {
  if (typeof title !== "string" || title.trim() === "") {
    return "O título da tarefa não pode ficar vazio.";
  }
  if (title.trim().length > 120) {
    return "O título deve ter no máximo 120 caracteres.";
  }
  return null;
}

// ---------- Rotas ----------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API da Lista de Tarefas funcionando." });
});

// READ — listar
app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

// CREATE — criar
app.post("/api/tasks", (req, res) => {
  const error = validateTitle(req.body.title);
  if (error) return res.status(400).json({ error });

  const task = {
    id: nextId++,
    title: req.body.title.trim(),
    done: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  res.status(201).json(task);
});

// UPDATE — editar título e/ou status
app.put("/api/tasks/:id", (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: "Tarefa não encontrada." });

  if (req.body.title !== undefined) {
    const error = validateTitle(req.body.title);
    if (error) return res.status(400).json({ error });
    task.title = req.body.title.trim();
  }
  if (req.body.done !== undefined) {
    task.done = Boolean(req.body.done);
  }
  res.json(task);
});

// DELETE — excluir
app.delete("/api/tasks/:id", (req, res) => {
  const index = tasks.findIndex((t) => t.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: "Tarefa não encontrada." });
  }
  const [removed] = tasks.splice(index, 1);
  res.json(removed);
});

// ---------- Inicialização ----------
// Na Vercel o app é exportado; localmente ele sobe na porta 3001.
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
}
