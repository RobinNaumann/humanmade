import { Card, Column, FlexSpace, Page, Row, SectionCard, Text } from "elbe-ui";
import { useAuth } from "../bit/b_auth";
import { ScoresBit, UsersBit } from "../bit/b_users";
import { AppFooter } from "./v_branding";
import { LoginButton } from "./v_login";

export function AdminPage() {
  const { user, signIn, signOut } = useAuth();

  return (
    <Page
      title="admin tools"
      narrow
      footer={<AppFooter />}
      actions={[<LoginButton />]}
    >
      {user ? (
        <ScoresBit.Provider type="c">
          <UsersBit.Provider>
            <Column gap={3}>
              <_UsersList />
              <_ScoresList />
            </Column>
          </UsersBit.Provider>
        </ScoresBit.Provider>
      ) : (
        <Column cross="center" main="center" flex>
          <Text v="please log in to access admin tools" />
        </Column>
      )}
    </Page>
  );
}

function _UsersList() {
  const usersBit = UsersBit.use();

  return usersBit.mapUI(({ users }) => (
    <Column gap={2}>
      <SectionCard title="users" hint="list of all registered users">
        {users.map((u) => (
          <Card bordered key={u.id}>
            <Row>
              <Text bold v={u.id} />
              <FlexSpace />
              <Text v={`role: ${u.role}`} />
            </Row>
          </Card>
        ))}
      </SectionCard>
    </Column>
  ));
}

function _ScoresList() {
  const scoresBit = ScoresBit.use();

  return scoresBit.mapUI(({ scores }) => (
    <Column gap={2}>
      <SectionCard title="scores" hint="list of all scores">
        {scores.map((s) => (
          <Card bordered key={s.meta.target}>
            <Row>
              <Text bold v={s.meta.target} />
              <FlexSpace />
              <Text v={`text: ${s.score.ai_text?.toPrecision(1) ?? "-"}`} />
              <Text v={`audio: ${s.score.ai_audio?.toPrecision(1) ?? "-"}`} />
              <Text v={`visual: ${s.score.ai_visual?.toPrecision(1) ?? "-"}`} />
            </Row>
          </Card>
        ))}
      </SectionCard>
    </Column>
  ));
}
