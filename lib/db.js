import { Pool } from "pg";
import fs from "fs";
import path from "path";

const usePostgres = !!process.env.POSTGRES_URL;

let pool = null;
function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

const LOCAL_DB_PATH = path.join(process.cwd(), "data.local.json");

function readLocal() {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    return { projects: [], responses: [], nextProjectId: 1, nextResponseId: 1 };
  }
  return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf-8"));
}
function writeLocal(data) {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
}

export async function initDb() {
  if (!usePostgres) return;
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await p.query(`
    CREATE TABLE IF NOT EXISTS responses (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      respondent_name TEXT,
      respondent_role TEXT,
      answers JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
}

export async function listProjects() {
  if (usePostgres) {
    await initDb();
    const p = getPool();
    const { rows } = await p.query(`
      SELECT pr.id, pr.name,
        (SELECT COUNT(*) FROM responses r WHERE r.project_id = pr.id)::int AS response_count
      FROM projects pr ORDER BY pr.created_at ASC;
    `);
    return rows;
  }
  const data = readLocal();
  return data.projects.map((pr) => ({
    id: pr.id,
    name: pr.name,
    response_count: data.responses.filter((r) => r.project_id === pr.id).length,
  }));
}

export async function createProject(name) {
  if (usePostgres) {
    await initDb();
    const p = getPool();
    const { rows } = await p.query(
      `INSERT INTO projects (name) VALUES ($1) RETURNING id, name;`,
      [name]
    );
    return rows[0];
  }
  const data = readLocal();
  const project = { id: data.nextProjectId++, name };
  data.projects.push(project);
  writeLocal(data);
  return project;
}

export async function submitResponse({ projectId, name, role, answers }) {
  if (usePostgres) {
    await initDb();
    const p = getPool();
    const { rows } = await p.query(
      `INSERT INTO responses (project_id, respondent_name, respondent_role, answers)
       VALUES ($1, $2, $3, $4) RETURNING id;`,
      [projectId, name, role, JSON.stringify(answers)]
    );
    return rows[0];
  }
  const data = readLocal();
  const response = {
    id: data.nextResponseId++,
    project_id: projectId,
    respondent_name: name,
    respondent_role: role,
    answers,
  };
  data.responses.push(response);
  writeLocal(data);
  return { id: response.id };
}

export async function listResponses(projectId) {
  if (usePostgres) {
    await initDb();
    const p = getPool();
    const { rows } = await p.query(
      `SELECT id, respondent_name, respondent_role, answers, created_at
       FROM responses WHERE project_id = $1 ORDER BY created_at ASC;`,
      [projectId]
    );
    return rows.map((r) => ({ ...r, answers: r.answers }));
  }
  const data = readLocal();
  return data.responses.filter((r) => r.project_id === projectId);
}

export async function getProject(projectId) {
  if (usePostgres) {
    await initDb();
    const p = getPool();
    const { rows } = await p.query(`SELECT id, name FROM projects WHERE id = $1;`, [projectId]);
    return rows[0] || null;
  }
  const data = readLocal();
  return data.projects.find((pr) => pr.id === Number(projectId)) || null;
}
