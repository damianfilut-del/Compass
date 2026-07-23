import { listProjects, createProject } from "../../lib/db";
import { isAdminRequest } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const projects = await listProjects();
      res.status(200).json({ projects });
    } catch (err) {
      res.status(500).json({ error: "Failed to load projects", detail: String(err) });
    }
    return;
  }

  if (req.method === "POST") {
    if (!isAdminRequest(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { name } = req.body || {};
    if (!name || !String(name).trim()) {
      res.status(400).json({ error: "Project name is required" });
      return;
    }
    try {
      const project = await createProject(String(name).trim());
      res.status(201).json({ project });
    } catch (err) {
      res.status(500).json({ error: "Failed to create project", detail: String(err) });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
