import { useServerCallsWithAuth } from "donau/servercalls/client";
import { useServerChannels } from "donau/serverchannels/client";
import "elbe-ui/dist/elbe.css";

import {
  Button,
  Column,
  ElbeApp,
  Icons,
  makeL10n,
  makeThemeContext,
  Page,
  renderElbe,
  Route,
} from "elbe-ui";
import { StrictMode, useState } from "react";
import { serverCallDefinitions } from "./shared/calls.shared";
import { schema } from "./shared/m_schema.shared";
import { AppFooter } from "./view/v_footer";

export const { serverChannels } = useServerChannels({
  port: import.meta.env.VITE_API_PORT,
});

export const { makeServerCall, serverAuth } = useServerCallsWithAuth(
  serverCallDefinitions,
  {
    port: import.meta.env.VITE_API_PORT,
    auth: {
      loginArgs: { username: "", password: "" },
      userModel: { typeof: schema.user },
    },
  }
);

// you can define localized strings that automatically adapt to
// the browsers language
export const L10n = makeL10n(
  { en_US: { tagline: "easily write web apps with server logic." } },
  { de_DE: { tagline: "Schreibe Web-Apps mit Server-Logik." } }
);

const _themeContext = makeThemeContext({
  seed: { color: { accent: "#E85A53" } },
});
export const { useTheme, WithTheme } = _themeContext;

function App() {
  const [dark, setDark] = useState(false);
  const [highVis, setHighVis] = useState(false);

  return (
    <L10n.L10n>
      <ElbeApp
        title={"humanmade"}
        key={dark ? "dark" : "light"}
        themeContext={_themeContext}
        themeSelector={(c) => ({
          color: {
            ...c.color,
            selection: {
              ...c.color.selection,
              mode: dark ? "dark" : "light",
              contrast: highVis ? "highvis" : "normal",
            },
          },
        })}
        icons={{
          logo: "/assets/humanmade_light.png",
          logoDark: "/assets/humanmade_dark.png",
        }}
        globalActions={[
          <Button.plain
            label="High Visibility"
            ariaLabel="toggle high visibility mode"
            icon={highVis ? Icons.Paintbrush : Icons.Contrast}
            onTap={() => setHighVis(!highVis)}
          />,
          <Button.plain
            label="Dark Mode"
            ariaLabel="toggle dark mode"
            icon={dark ? Icons.Sun : Icons.Moon}
            onTap={() => setDark(!dark)}
          />,
        ]}
      >
        <Route path="/">
          <_Home />
        </Route>
      </ElbeApp>
    </L10n.L10n>
  );
}

function _Home() {
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
                type: "channel",
                target: "donauwelle",
                rating: { rating: "positive", author: "anonymous" },
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

renderElbe(
  <StrictMode>
    <App />
  </StrictMode>
);
