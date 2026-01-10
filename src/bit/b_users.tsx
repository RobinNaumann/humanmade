import { createBit } from "elbe-ui";
import { makeServerCall } from "../app";

export const UsersBit = createBit({
  debugLabel: "UsersBit",
  worker: () => makeServerCall.listUsers({}),
});

export const ScoresBit = createBit({
  debugLabel: "ScoresBit",
  worker: async (params: { type: string }) =>
    await makeServerCall.listScores({ type: params.type }),
});
