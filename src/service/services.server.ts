import { schema } from "../shared/m_schema.shared";
import { DbService } from "./s_db.server";
import { SpamDetectService } from "./s_spam.server";
import { StorageService } from "./s_storage.server";

export const serverconfig = {
  databasePath: "./data/data.db",
  spamDetect: {
    maxRequestsInWindow: 10,
    windowMs: 60 * 1000,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? "DEVELOPMENT_SECRET_CHANGE_ME",
    admin: process.env.ADMIN ?? "admin:admin",
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  },
};

export const services = {
  spamDetect: new SpamDetectService(
    serverconfig.spamDetect.maxRequestsInWindow, // maxRequestsInWindow
    serverconfig.spamDetect.windowMs // windowMs (1 minute)
  ),
  storage: new StorageService(
    new DbService(serverconfig.databasePath, schema) // the database
  ),
};
