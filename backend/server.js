// Backend da Lista de Tarefas — Node.js + Express + Supabase (Postgres)
// As tarefas agora ficam salvas de verdade no banco de dados.

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Conexão com o Supabase (variáveis de ambiente) ----------
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
    : null;

// Se as variáveis não estiverem configuradas, avisa de forma clara
app.use("/api", (req, res, next) => {
  if (!supabase) {
    return res.status(500).json({
      error: "Banco de dados não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_KEY.",
    });
  }
  next();
});

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

const dbError = (res, error) => {
  console.error(error);
  return res.status(500).json({ error: "Erro ao acessar o banco de dados." });
};

// ---------- Rotas ----------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API da Lista de Tarefas funcionando.", database: Boolean(supabase) });
});

// READ — listar
app.get("/api/tasks", async (req, res) => {
  const { data, error } = await supabase.from("tasks").select("*").order("id", { ascending: true });
  if (error) return dbError(res, error);
  res.json(data);
});

// CREATE — criar
app.post("/api/tasks", async (req, res) => {
  const invalid = validateTitle(req.body.title);
  if (invalid) return res.status(400).json({ error: invalid });

  const { data, error } = await supabase
    .from("tasks")
    .insert({ title: req.body.title.trim(), done: false })
    .select()
    .single();
  if (error) return dbError(res, error);
  res.status(201).json(data);
});

// UPDATE — editar título e/ou status
app.put("/api/tasks/:id", async (req, res) => {
  const changes = {};

  if (req.body.title !== undefined) {
    const invalid = validateTitle(req.body.title);
    if (invalid) return res.status(400).json({ error: invalid });
    changes.title = req.body.title.trim();
  }
  if (req.body.done !== undefined) changes.done = Boolean(req.body.done);

  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ error: "Nada para atualizar." });
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(changes)
    .eq("id", Number(req.params.id))
    .select()
    .maybeSingle();
  if (error) return dbError(res, error);
  if (!data) return res.status(404).json({ error: "Tarefa não encontrada." });
  res.json(data);
});

// DELETE — excluir
app.delete("/api/tasks/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", Number(req.params.id))
    .select()
    .maybeSingle();
  if (error) return dbError(res, error);
  if (!data) return res.status(404).json({ error: "Tarefa não encontrada." });
  res.json(data);
});

// ---------- Inicialização ----------
// Na Vercel o app é exportado; localmente ele sobe na porta 3001.
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
}
