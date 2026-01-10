import { serverCall } from "donau/servercalls/shared";
import { schema, ScoreModel } from "./m_schema.shared";
export const serverCallDefinitions = {
  listScores: serverCall<{ type: string }, { scores: ScoreModel[] }>({
    auth: true,
  }),
  listUsers: serverCall<{}, { users: (typeof schema.user)[] }>({ auth: true }),
  //deleteOpinion: serverCall<{ id: number }, {}>({ auth: true }),
  //deleteUser: serverCall<{ id: string }, {}>({ auth: true }),
  /*listOpinion: serverCall<
    { type: string; target?: string },
    { opinions: (typeof schema.opinion)[] }
  >({ auth: true }),*/
};
