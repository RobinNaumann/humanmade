import { Column, FlexLayout, Page, Row, Text, useLayoutMode } from "elbe-ui";
import { appInfo } from "../shared/info.shared";
import { AppFooter } from "./v_branding";

export function Home() {
  const layoutMode = useLayoutMode();
  return (
    <Page title="humanmade" narrow footer={<AppFooter />} actions={[]}>
      <Column gap={2}>
        <Text.h1
          v={"Don't be tricked by AI generated content.\nSupport human artists"}
        />
        <Text.m>
          While watching an animated YouTube video essay a few weeks ago, I
          suddenly realized that both the narrator's voice and the visuals were
          AI-generated. This was not disclosed anywhere in the video description
          or credits. It struck me how seamlessly AI can now mimic human
          creativity, to the point where it's nearly impossible to distinguish
          between human-made and AI-generated content. <br />
        </Text.m>
        <Text.h3 v={"Help highlight human artistry"} />
        <Text.m>
          So, I decided to write a little Browser Extensions where users can
          register the extent to which a channel's content is AI-generated. I
          believe that by crowdsourcing this information, we can help viewers
          make more informed decisions about the content they consume and
          support genuine human creativity.
          <br />
          <br />
          <b>yours,</b>
          <br />
          <img
            alt="Robin Handdrawn"
            style={{ height: "2rem" }}
            src="https://robbb.in/donate/assets/robin_handdrawn.svg"
          />
        </Text.m>
        <_StoreLinks />
        <Text.h3 v={"Screenshots"} />
        <FlexLayout direction={layoutMode.isMobile ? "column" : "row"}>
          <img
            style={{
              minWidth: "10rem",
              flex: layoutMode.isMobile ? "none" : 1,
              borderRadius: ".5rem",
            }}
            src="/assets/cws_sc_1.png"
          />
          <img
            style={{
              minWidth: "10rem",
              flex: layoutMode.isMobile ? "none" : 1,
              borderRadius: ".5rem",
            }}
            src="/assets/cws_sc_2.png"
          />
        </FlexLayout>
        <Text.m>
          The extension is <b>open source</b> and available on the Chrome Web
          Store and Firefox Add-ons. Feel free to contribute on{" "}
          <a href={appInfo.repository}>GitHub</a> or reach out to me on{" "}
          <a href={appInfo.social.bluesky}>Bluesky</a> if you have any questions
          or suggestions!
        </Text.m>
      </Column>
    </Page>
  );
}

function _StoreLinks() {
  return (
    <Row gap={3} wrap main="center" style={{ marginBottom: "3rem" }}>
      <a href={appInfo.store.cws}>
        <img
          alt="Get it on Chrome Web Store"
          src="/assets/store/cws.png"
          style={{ height: "3.5rem" }}
        />
      </a>
      <a href={appInfo.store.mozilla}>
        <img
          alt="Get it on Firefox Add-ons"
          src="/assets/store/mozilla.png"
          style={{ height: "3.5rem" }}
        />
      </a>
    </Row>
  );
}
