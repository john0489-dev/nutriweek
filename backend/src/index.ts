import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { menuRouter } from "./routes/menu";
import { authRouter } from "./routes/auth";
import { profilesRouter } from "./routes/profiles";
import { favoritesRouter } from "./routes/favorites";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "nutriweek-backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/profiles", profilesRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/menu", menuRouter);

/**
 * Serve o build web do app mobile (gerado por `expo export --platform web`
 * e copiado para `backend/public` no build de produção — ver
 * render-build.sh). Mesma origem do backend, então o app não precisa de
 * CORS nem de configurar URL de API: `EXPO_PUBLIC_API_URL=""` no build faz o
 * cliente usar caminhos relativos (`/api/...`).
 *
 * Em desenvolvimento local esse diretório normalmente não existe — nesse
 * caso o servidor segue funcionando normalmente como API pura (é assim que
 * `npm run dev` + `expo start` funcionam hoje).
 */
const publicDir = path.join(__dirname, "..", "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  // SPA fallback: qualquer rota que não seja /api/* ou /health devolve o
  // index.html, deixando o roteamento (React Navigation) decidir no cliente.
  app.get(/^(?!\/api\/|\/health).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
} else {
  // eslint-disable-next-line no-console
  console.log(
    "[web] backend/public não encontrado — servindo só a API (rode `npm run build:web` para gerar o build web)."
  );
}

const port = Number(process.env.PORT ?? 3333);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`NutriWeek backend rodando em http://localhost:${port}`);
});
