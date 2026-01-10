//
// "app.server.ts" IS THE ENTRY POINT TO YOUR APPLICATION.
// YOU CAN MODIFY IT, BUT MAKE SURE NOT TO REMOVE IT
//

import {
  donauServerRun,
  JWTAuth,
  logger,
  parameter,
  route,
  sendError,
  serveFrontend,
} from "donau/server";
import { handleServerCalls } from "donau/servercalls/server";
import { serverconfig, services } from "./service/services.server";
import { serverCallDefinitions } from "./shared/calls.shared";
import { appInfo } from "./shared/info.shared";

const PORT = Number.parseInt(process.env.PORT ?? "3000");

const jwtAuth = new JWTAuth({
  secretKey: serverconfig.auth.jwtSecret,
  // remove onSignUp if you don't want to allow sign up
  onUserCreate: async (user, pwHash) => {
    await services.storage.setUser(user, pwHash, "user");
  },
  // this provides a rich user object to your routes
  getUser: async (username) => {
    return {
      ...(await services.storage.getUser(username)),
      password_hash: "***",
    };
  },
  // load the password hash from your database
  getPasswordHash: async (username) => {
    const user = await services.storage.getUser(username);
    return user?.password_hash;
  },
});

const serverCallRoutes = handleServerCalls(serverCallDefinitions, {
  listUsers: async () => {
    const users = await services.storage.listUsers();
    return { users };
  },
  listScores: async ({ type }) => {
    return {
      scores: await services.storage.listTargetSummary(type, null, null),
    };
  },
});

donauServerRun(
  PORT,
  {
    cors: { origin: serverconfig.cors.origin, credentials: true },
    auth: jwtAuth,
    info: {
      title: appInfo.name + " API",
      version: appInfo.version,
      description: appInfo.description,
    },
    routes: [
      ...serverCallRoutes,
      route("/rate", {
        method: "post",
        description: `submit a rating for a target

## example:
\`\`\`
{
  "type": "yc",                         // youtube channel
  "target": "UC_x5XG1OV2P6uZZ5FSM9Ttw", // channel id
  "author": "user123",                  // your user id
  "rating": {                           // ratings (0-4, null = no rating)
    "ai_voice": 4,
    "ai_visual": 3,
    "ai_text": 2
  }
}
\`\`\``,

        parameters: {
          body: parameter.body({
            type: "object",
            properties: {
              type: { type: "string", required: true },
              target: { type: "string", required: true },
              rating: { type: "object", required: true },
              author: { type: "string", required: true },
            },
          }),
        },
        handler: async (req, res) => {
          try {
            await services.spamDetect.spamGuard(req);
            const ip = services.spamDetect.ip(req);

            await services.storage.addRating(ip, {
              type: req.body?.type,
              target: req.body?.target,
              author: req.body?.author,
              ai_voice: req.body?.rating?.ai_voice ?? null,
              ai_visual: req.body?.rating?.ai_visual ?? null,
              ai_text: req.body?.rating?.ai_text ?? null,
            });
            res.status(200).send({ success: true });
          } catch (error: any) {
            if (error?.code) return sendError(res, error);
            console.error("[/rate] unexpected error: ", error);
            res
              .status(400)
              .send({ success: false, error: "could not add opinion" });
          }
        },
      }),
      route("/score", {
        method: "get",
        description: "returns a greeting to you",
        parameters: {
          type: parameter.query({ type: "string" }),
          target: parameter.query({ type: "string" }),
          author: parameter.query({ type: "string", optional: true }),
        },
        worker: async ({ type, target, author }) => {
          return await services.storage.getTargetSummary(
            type,
            target,
            author ?? null
          );
        },
      }),
    ],
  },
  [process.env.SERVE_FRONTEND === "true" ? serveFrontend("client") : null]
);

// set admin user on first run
async function createAdminUser() {
  const creds = serverconfig.auth.admin?.split(":");
  if (!(creds?.length === 2)) {
    logger.warning("could not create admin user, invalid ADMIN env var");
    return;
  }
  await jwtAuth.createUser(creds[0], creds[1]);
  console.log(`admin user '${creds[0]}' created`);
}

createAdminUser();
