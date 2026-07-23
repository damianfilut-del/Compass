import { submitResponse, listResponses, getProject } from "../../lib/db";
import { isAdminRequest } from "../../lib/auth";
import { ALL_MOIS } from "../../lib/content";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { projectId, name, role, answers } = req.body || {};
    if (!projectId || !answers || typeof answers !== "object") {
      res.status(400).json({ error: "projectId and answers are required" });
      return;
    }
    const project = await getProject(Number(projectId));
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const validIds = new Set(ALL_MOIS.map((m) => m.id));
    for (const key of Object.keys(answers)) {
      if (!validIds.has(key)) {
        res.status(400).json({ error: "Unknown question id: " + key });
        return;
      }
      const a = answers[key];
      if (!a || typeof a.score !== "number" || a.score < 1 || a.score > 4) {
        res.status(400).json({ error: "Invalid answer for " + key });
        return;
      }
    }
    try {
      const saved = await submitResponse({
        projectId: Number(projectId),
        name: String(name || "").slice(0, 200),
        role: String(role || "").slice(0, 200),
        answers,
      });
      res.status(201).json({ id: saved.id });
    } catch (err) {
      res.status(500).json({ error: "Failed to save response", detail: String(err) });
    }
    return;
  }

  if (req.method === "GET") {
    if (!isAdminRequest(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { projectId } = req.query;
    if (!projectId) {
      res.status(400).json({ error: "projectId is required" });
      return;
    }
    try {
      const responses = await listResponses(Number(projectId));
      res.status(200).json({ responses });
    } catch (err) {
      res.status(500).json({ error: "Failed to load responses", detail: String(err) });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
