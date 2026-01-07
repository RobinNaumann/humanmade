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
    console.log("Creating user", user, pwHash);
    await services.storage.setUser(user, pwHash, "user");
  },
  // this provides a rich user object to your routes
  getUser: async (username) => {
    return services.storage.getUser(username);
  },
  // load the password hash from your database
  getPasswordHash: async (username) => {
    const user = await services.storage.getUser(username);
    return user?.password_hash;
  },
});

const serverCallRoutes = handleServerCalls(serverCallDefinitions, {
  listOpinion: async ({ type, target }) => {
    const opinions = await services.storage.listOpinion(type, target);
    return { opinions };
  },
  deleteOpinion: async ({ id }) => {
    await services.storage.removeOpinion(id);
    return {};
  },
  listUsers: async () => {
    const users = await services.storage.listUsers();
    return { users };
  },
  deleteUser: async ({ id }) => {
    await services.storage.deleteUser(id);
    return {};
  },
});

donauServerRun(
  PORT,
  {
    cors: { origin: "http://localhost:5173", credentials: true },
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
        description: "Adds a opinion for a target",

        parameters: {
          body: parameter.body({
            type: "object",
            properties: {
              type: { type: "string", required: true },
              target: { type: "string", required: true },
              rating: { type: "string", required: true },
              author: { type: "string", required: true },
            },
          }),
        },
        handler: async (req, res) => {
          await services.spamDetect.spamGuard(req);
          const ip = services.spamDetect.ip(req);

          services.storage.addOpinion(ip, {
            type: req.body?.type,
            target: req.body?.target,
            rating: req.body?.rating.rating,
            author: req.body?.author,
          });

          /*const { type, target, rating, author } = req.body;
          const opinionData: Omit<typeof schema.opinion, "id"> = {
            type,
            target,
            rating: rating.rating,
            author: rating.author,
          };
          await storageService.addOpinion(opinionData);
          res.status(201).send({});*/
          res.status(200).send({ error: "Not implemented" });
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
          const rating = await services.storage.getTargetSummary(
            type,
            target,
            author ?? null
          );
          return {
            meta: {
              type: type,
              target: target,
            },
            ratings: rating.ratings,
            youRated: rating.userRated,
          };
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
  logger.info(`admin user '${creds[0]}' created`);
}

createAdminUser();
