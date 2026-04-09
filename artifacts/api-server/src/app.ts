import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { authMiddleware } from "./middlewares/authMiddleware";
import { errorHandler } from "./middlewares/errorHandler";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Lock CORS to the configured app origin in production; fall back to
// echoing the request origin in development so a Vite dev server on
// a different port can still hit the API.
const appOrigin = process.env.APP_ORIGIN;
app.use(
  cors({
    credentials: true,
    origin: process.env.NODE_ENV === "production" && appOrigin ? appOrigin : true,
  }),
);
app.use(cookieParser());
// Bounded request bodies: enough for a pulse check or a 1:1 note, not
// enough for an attacker to exhaust memory with a single payload.
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));
app.use(authMiddleware);

app.use("/api", router);

// Must be the LAST middleware so every route (including async throws)
// flows into the centralised error handler with a consistent JSON body.
app.use(errorHandler);

export default app;
