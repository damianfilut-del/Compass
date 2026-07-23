import { isAdminRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  res.status(200).json({ isAdmin: isAdminRequest(req) });
}
