import { json } from "./_lib.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { message: "Método no permitido" });
  }

  return json(res, 200, {
    disconnected: true,
    message: "La cuenta de Uber se ha desconectado en este dispositivo.",
  }, {
    "Set-Cookie": "uber_access=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
  });
}
