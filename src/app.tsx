import { useServerCallsWithAuth } from "donau/servercalls/client";
import { useServerChannels } from "donau/serverchannels/client";

import {
  AssetLogo,
  Button,
  ElbeApp,
  Icons,
  makeL10n,
  makeThemeContext,
  renderElbe,
  Route,
} from "elbe-ui";
import { Moewe, moewe } from "moewe";
import { StrictMode, useState } from "react";
import { AuthProvider } from "./bit/b_auth";
import { serverCallDefinitions } from "./shared/calls.shared";
import { appInfo } from "./shared/info.shared";
import { UserModel } from "./shared/m_schema.shared";
import { AdminPage } from "./view/v_admin";
import { AppFooter } from "./view/v_branding";
import { Home } from "./view/v_home";

function _currentBrowser(): string {
  try {
    const ua = navigator?.userAgent;
    if (!ua) return "unknown browser";
    if (ua.indexOf("Firefox") !== -1) return "firefox";
    if (ua.indexOf("Edg/") !== -1) return "edge";
    if (ua.indexOf("Chrome") !== -1) return "chrome";
    if (ua.indexOf("Safari") !== -1) return "safari";
    return "unknown browser";
  } catch {
    return "unknown browser";
  }
}

await new Moewe({
  host: "open.moewe.app",
  project: "7840850589cb73c1",
  app: "15c64dadcc9948b8",
  appVersion: appInfo.version,
  deviceModel: _currentBrowser(),
}).init();

export const { serverChannels } = useServerChannels({
  port: import.meta.env.VITE_API_PORT,
});

export const { makeServerCall, serverAuth } = useServerCallsWithAuth(
  serverCallDefinitions,
  {
    port: import.meta.env.VITE_API_PORT,
    auth: {
      loginArgs: { username: "", password: "" },
      userModel: {} as UserModel,
    },
  },
);

// you can define localized strings that automatically adapt to
// the browsers language
export const L10n = makeL10n(
  { en_US: { tagline: "easily write web apps with server logic." } },
  { de_DE: { tagline: "Schreibe Web-Apps mit Server-Logik." } },
);

const _themeContext = makeThemeContext({
  seed: {
    color: { accent: "#E85A53", base: "#f4e7e6" },
    type: {
      body: { family: ["Averia Serif"], bold: false, size: 1.1 },
      heading: { family: ["Averia Serif"], bold: true, size: 2.3 },
    },
  },
});
export const { useTheme, WithTheme } = _themeContext;

function App() {
  const [dark, setDark] = useState(false);
  const [highVis, setHighVis] = useState(false);

  return (
    <L10n.L10n>
      <AuthProvider>
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
          branding={{
            logo: <AssetLogo src="/assets/favicon.png" height={2.2} />,
          }}
          footer={<AppFooter />}
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
            <Home />
          </Route>
          <Route path="/admin">
            <AdminPage />
          </Route>
        </ElbeApp>
      </AuthProvider>
    </L10n.L10n>
  );
}

moewe().event("web_open");

renderElbe(
  <StrictMode>
    <App />
  </StrictMode>,
);
