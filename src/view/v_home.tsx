import { Button, Column, Page } from "elbe-ui";
import { serverAuth } from "../app";
import { AppFooter } from "./v_branding";

export function Home() {
  return (
    <Page title="" narrow footer={<AppFooter />} actions={[]}>
      <Column gap={3}>
        <Button.major
          ariaLabel="add opinion"
          label="hello"
          onTap={async () => {
            fetch("http://localhost:3000/api/rate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "c",
                target: "donauwelle",
                rating: "positive",
                author: "anonymous",
              }),
            });
          }}
        />
        <Button.minor
          ariaLabel="add opinion"
          label="login"
          onTap={async () => {
            await serverAuth.login({
              username: "admin",
              password: "admin",
            });
          }}
        />
        <i>
          Have fun ☺️
          <br />
          yours, Robin
        </i>
      </Column>
    </Page>
  );
}
