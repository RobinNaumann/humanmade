import { serverCall } from "donau/servercalls/shared";
import { schema } from "./m_schema.shared";
export const serverCallDefinitions = {
  listOpinion: serverCall<
    { type: string; target?: string },
    { opinions: (typeof schema.opinion)[] }
  >(),

  deleteOpinion: serverCall<{ id: number }, {}>(),
  listUsers: serverCall<{}, { users: (typeof schema.user)[] }>(),
  deleteUser: serverCall<{ id: string }, {}>(),
};
