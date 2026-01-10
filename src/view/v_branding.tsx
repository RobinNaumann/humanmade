import { Footer } from "elbe-ui";
import { appInfo } from "../shared/info.shared";

export function AppFooter() {
  return (
    <Footer
      marginTop={3}
      right={[{ label: "source", href: appInfo.repository }]}
      copyright={appInfo.name}
      version={appInfo.version}
      legal={{
        label: "imprint/impressum",
        href: appInfo.imprint,
      }}
    />
  );
}
