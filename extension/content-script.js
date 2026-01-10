function TiberComponents(ctxt) {
  const theme = {
    c_accent: "#E85A53",
  };

  const c = {
    Element: (p) => {
      const type = p.type ?? "div";
      const id = p.id ?? ctxt.getNextId();
      const customAttrs = Object.entries(p.attributes ?? {})
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ");
      const children = typeof p.inner === "string" ? [p.inner] : p.inner;
      if (typeof p.style === "string") p.style = [p.style];
      let style = (p.style ?? [])
        .filter((s) => s && s.length > 0)
        .flat()
        .join("; ");

      if (p.scrollable) {
        style = "flex: 1; overflow: auto;" + (style ?? "");
        ctxt.addListener(id, "scroll", (e) => {
          ctxt.onScrollChange(id, e.target.scrollTop);
        });
      }

      if (p.onClick) ctxt.addListener(id, "click", p.onClick);
      if (p.onMouseOver) ctxt.addListener(id, "mouseover", p.onMouseOver);
      if (p.onMouseOut) ctxt.addListener(id, "mouseout", p.onMouseOut);

      return `<${type} id="${id}" ${customAttrs} style="${style}">${
        children?.join("") ?? ""
      }</${type}>`;
    },

    Row: (p) =>
      c.Element({
        ...p,
        style: [
          "display: flex",
          "flex-direction: row",
          "justify-content: center",
          "align-items: center",
          "gap: 16px",
          p.style,
        ],
      }),

    Column: (p) =>
      c.Element({
        ...p,
        style: [
          "display: flex",
          "flex-direction: column",
          "justify-content: start",
          "align-items: stretch",
          "gap: 16px",
          p.style,
        ],
      }),

    Button: (p) =>
      c.Element({
        ...p,
        type: "button",
        style: [
          "font-size: 16px",
          "color: white",
          `background: ${theme.c_accent}`,
          "border: none",
          "padding: 11px 16px",
          "border-radius: 4px",
          "font-weight: bold",
          p.style,
        ],
      }),

    Text: (p) => c.Element({ ...p }),

    TextHint: (p) =>
      c.Element({
        ...p,
        style: ["font-size: 14px", "color: #ccc", p.style],
      }),

    Image: (p) =>
      c.Element({
        ...p,
        type: "img",
        attributes: {
          ...(p.attributes ?? {}),
          src: p.src,
          height: p.height,
        },
        style: ["object-fit: contain", p.style],
      }),

    Card: (p) =>
      c.Column({
        ...p,
        id: p.id,
        style: [
          "background: #555",
          "border: 2px solid #666",
          "border-radius: 8px",
          "padding: 16px",
          "box-shadow: 0 2px 16px rgba(0,0,0,0.2)",
          p.style,
        ],
      }),

    LabelValue: (p) =>
      c.Column({
        style: ["gap: 4px", "width: 96px"],
        attributes: {
          title: p.title ?? "",
        },
        inner: [
          c.Text({
            inner: p.value,
            style: [
              "font-weight: bold; text-align: center; font-size: 22.4px;",
              p.style,
            ],
          }),
          c.Text({ inner: p.label, style: ["flex: 1; text-align: center;"] }),
        ],
      }),
  };
  return c;
}

function render(root, prefix, builder) {
  let idCounter = 0;
  let listeners = [];
  let state = {};
  let effects = [];
  let _scrollCache = {};

  function _reRender() {
    idCounter = 0;
    listeners = [];

    const ctxt = {
      state: state,
      setState: (newState) => {
        state = { ...state, ...newState };
        _reRender();
      },
      addListener: (id, type, listener) => {
        listeners.push({ id, type, listener });
      },
      getNextId: () => {
        return `tiber-auto-id-${prefix}-${idCounter++}`;
      },
      onScrollChange: (id, scrollTop) => {
        _scrollCache[id] = scrollTop;
      },
    };

    const c = TiberComponents(ctxt);
    root.innerHTML = builder({
      c,
      state,
      setState: ctxt.setState,
      useEffect: (effect) => {
        effects.push(effect);
      },
    });

    for (const l of listeners) {
      const el = document.getElementById(l.id);
      if (el) el.addEventListener(l.type, l.listener);
    }

    // restore scroll positions
    for (const id in _scrollCache) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollTop = _scrollCache[id];
      } else {
        delete _scrollCache[id];
      }
    }
  }
  console.log("Initial render");
  _reRender();
  console.log("Initial render complete");
  // run the effects once after initial render
  for (const effect of [...effects]) {
    console.warn("Running effect");
    effect();
  }
}

// ============== END OF FRAMEWORK ==============

const ratingTypes = [
  {
    key: "ai",
    icon: "bot.svg",
    color: "#E61B83ff",
    label: "Mostly AI-generated content",
  },
  {
    key: "mixed",
    icon: "brain.svg",
    color: "#FF9900ff",
    label: "Moderate AI usage",
  },
  {
    key: "human",
    icon: "hand.svg",
    color: "#7daf4cff",
    label: "Human-made content",
  },
  // fallback
  {
    key: "unknown",
    icon: "question.svg",
    color: "#888888ff",
    label: "Unknown / not rated",
  },
];

const ids = {
  avatarBase: "humanmade-avatar-base",
  avatarBack: "humanmade-avatar-back",
  avatarIcon: "humanmade-avatar-icon",
};

window.addEventListener("load", () => {
  console.info("HUMANMADE: content script loaded");
  // state shape:
  // {
  //    dialogOpen: boolean,
  //
  //    channel: string,
  //    score: {audio: number, visual: number, text: number}
  //
  //    userRated: boolean,
  //    rating: {audio: 0|1|2, visual: 0|1|2, text: 0|1|2}
  // }
  const dialogRoot = document.createElement("div");
  dialogRoot.id = "humanmade-modal-root";
  dialogRoot.style.zIndex = "10000";
  document.body.appendChild(dialogRoot);
  render(dialogRoot, "well", ({ c, state, setState, useEffect }) => {
    useEffect(async () => {
      while (!document.querySelector("#owner")) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      console.info("HUMANMADE: page ready, adding channel icon");
      addChannelIcon(() => setState({ dialogOpen: true }));
      setChannelIconType(0);
    });

    function LickertScale(p) {
      const options = ["AI", "MIXED", "HUMAN"];

      const selectedType = ratingTypes[p.value] ?? ratingTypes[3];

      return c.Column({
        style: "gap: 8px;",
        inner: [
          c.TextHint({
            inner: `The ${p.label} usually are:`,
            style: "color: white;",
          }),
          c.Row({
            id: p.id,
            style: [
              "gap: 0px",
              "justify-content: space-between",
              `border: 2px solid ${selectedType.color}`,
              "border-radius: 4px",
              "overflow: hidden",
              "padding: 0",
            ],
            inner: options.map((option, i) =>
              c.Button({
                inner: option,
                onClick: () => p.onChange?.(i),
                style: [
                  "flex: 1",
                  "margin: 0",
                  "border: none",
                  "border-radius: 0",
                  `${
                    i === p.value
                      ? `background: ${selectedType.color};`
                      : "background: transparent;"
                  }`,
                ],
              })
            ),
          }),
        ],
      });
    }

    function Header() {
      const height = `24`;
      return c.Row({
        inner: [
          c.Image({
            src: chrome.runtime.getURL(`/assets/icons/github.svg`),
            onClick: () =>
              window.open("https://github.com/RobinNaumann/humanmade/"),
            style: [
              "margin: 16px",
              "margin-bottom: 0",
              "cursor: pointer",
              `height: ${height}px`,
            ],
          }),
          c.Image({
            src: chrome.runtime.getURL(`/assets/humanmade_dark.png`),
            style: [
              "margin: 16px",
              "margin-bottom: 0",
              `height: ${height}px`,
              "flex: 1",
            ],
          }),
          c.Image({
            src: chrome.runtime.getURL(`/assets/icons/x.svg`),
            onClick: () => setState({ dialogOpen: false }),
            style: [
              "margin: 16px",
              "margin-bottom: 0",
              "cursor: pointer",
              `height: ${height}px`,
            ],
          }),
        ],
      });
    }

    function ScoreCard() {
      const score = state.score;

      const scores = state.score
        ? {
            audio: ratingTypes[score.audio] ?? ratingTypes[3],
            visual: ratingTypes[score.visual] ?? ratingTypes[3],
            text: ratingTypes[score.text] ?? ratingTypes[3],
          }
        : null;

      return c.Card({
        style: "gap: 4px",
        inner: [
          c.Text({
            inner: "current rating",
            style: "font-weight: bold; font-size: 16px; ",
          }),
          c.TextHint({
            inner: `videos of the channel ${
              state.channelName ?? "?"
            } have been rated by other users as:`,
            style: "margin-bottom: 16px;",
          }),
          !scores
            ? c.Text({
                inner: "no ratings yet",
                style: "font-style: italic; color: #ccc; text-align: center;",
              })
            : c.Row({
                inner: Object.entries(scores).map(([key, val]) =>
                  c.LabelValue({
                    label: key,
                    value: val.key.toUpperCase(),
                    style: [`color: ${val.color}`],
                    title: val.label,
                  })
                ),
              }),
        ],
      });
    }

    function RateCard() {
      const hasRated = state.userRated ?? false;

      return c.Card({
        style: "gap: 4px",
        inner: hasRated
          ? [
              c.Text({
                inner: "rating has already been submitted",
                style:
                  "font-weight: bold; font-size: 16px; text-align: center;",
              }),
              c.TextHint({
                inner: "by you or a user at your IP address. Thanks!",
                style: " text-align: center;",
              }),
            ]
          : [
              c.Text({
                inner: "submit rating & help others",
                style: "font-weight: bold; font-size: 16px; ",
              }),
              c.TextHint({
                inner: `consider an average video of the channel ${
                  state.channelName ?? "--"
                }`,
                style: "margin-bottom: 16px;",
              }),
              c.Column({
                inner: [
                  LickertScale({
                    id: "humanmade-lickert-audio",
                    label: "audio / speech",
                    value: state.rating?.audio ?? 0,
                    onChange: (val) =>
                      setState({
                        ...state,
                        rating: { ...state.rating, audio: val },
                      }),
                  }),
                  LickertScale({
                    id: "humanmade-lickert-visual",
                    label: "visuals / imagery",
                    value: state.rating?.visual ?? 0,
                    onChange: (val) =>
                      setState({
                        ...state,
                        rating: { ...state.rating, visual: val },
                      }),
                  }),
                  LickertScale({
                    id: "humanmade-lickert-text",
                    label: "content / script",
                    value: state.rating?.text ?? 0,
                    onChange: (val) =>
                      setState({
                        ...state,
                        rating: { ...state.rating, text: val },
                      }),
                  }),
                ],
              }),
              c.Button({
                id: "humanmade-modal-close",
                inner: "submit rating",
                style: "flex: 1; margin-top: 16px",

                onClick: () => {
                  console.log("Submit rating clicked");
                  setState({ dialogOpen: false });
                },
              }),
            ],
      });
    }

    console.warn("Rendering modal dialog, open =", state.dialogOpen);

    return c.Element({
      style: [
        "position: fixed;",
        "top: 0;",
        "left: 0;",
        "width: 100%;",
        "height: 100%;",
        "background: rgba(0,0,0,0.5);",
        "backdrop-filter: blur(4px);",
        "z-index: 10001;",
        `display: ${state.dialogOpen ? "flex" : "none"}`,
        "justify-content: center;",
        "align-items: center;",
      ],
      inner: [
        c.Element({
          id: "humanmade-modal-dialog",
          style: [
            "font-family: Arial, Helvetica, sans-serif;",
            "font-size: 16px;",
            "color: #fff;",
            "background: #444;",
            "border: 2px solid #333;",
            "border-radius: 8px;",
            // large shadow for prominence:
            "box-shadow: 0 4px 32px rgba(0,0,0,.5);",
            "width: 400px",
          ],
          inner: [
            c.Column({
              style: ["height: 480px", "max-height: 480px"],
              inner: [
                Header(),
                c.Column({
                  scrollable: true,
                  style: ["padding: 16px", "padding-top: 0", "gap: 24px"],
                  inner: [
                    c.Text({
                      inner:
                        "This extension lets you rate the extent to which content is human-made.",
                      style: "text-align: center;",
                    }),
                    ScoreCard(),
                    RateCard(),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });
});

function addChannelIcon(onTap) {
  if (document.querySelector(`#${ids.avatarBase}`)) return;

  console.info("HUMANMADE: adding avatar circle");

  const elOwner = document.querySelector("#owner");
  const elAvatar = document.querySelector("#avatar");
  if (!elAvatar || !elOwner) {
    console.warn("HUMANMADE: could not find avatar or owner element");
    return;
  }
  // get the avatar size:
  const rect = elAvatar.getBoundingClientRect();
  const size = Math.max(Math.round(rect.width), Math.round(rect.height));

  // prepend a circle before the avatar
  const elBase = document.createElement("div");
  elBase.id = ids.avatarBase;
  elBase.style.width = `${size}px`;
  elBase.style.height = `${size}px`;
  elBase.style.borderRadius = "50%";
  elBase.style.marginRight = "8px";
  elBase.style.zIndex = "9999";
  elBase.style.display = "none";
  elBase.style.position = "relative";
  elBase.addEventListener("click", (e) => {
    console.log("HUMANMADE: avatar circle clicked");
    e.stopPropagation();
    e.preventDefault();
    onTap?.();
  });

  const elBack = document.createElement("div");
  elBack.id = ids.avatarBack;
  elBack.style.position = "absolute";
  elBack.style.width = `${size}px`;
  elBack.style.height = `${size}px`;
  elBack.style.top = "50%";
  elBack.style.left = "50%";
  elBack.style.transform = "translate(-50%, -50%)";
  elBack.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 141 133" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><g><path d="M39.51,123.244c-32.13,-17.963 -50.385,-49.103 -32.422,-81.232c17.963,-32.13 65.384,-53.161 97.514,-35.198c32.13,17.963 45.136,57.641 29.91,90.826c-15.351,33.456 -62.871,43.568 -95.001,25.605Z" style="fill:currentColor;"/></g></svg>`;

  const elIcon = document.createElement("img");
  elIcon.id = ids.avatarIcon;
  elIcon.style.position = "absolute";
  elIcon.style.width = `${size * 0.6}px`;
  elIcon.style.height = `${size * 0.6}px`;
  elIcon.style.top = "50%";
  elIcon.style.left = "50%";
  elIcon.style.transform = "translate(-50%, -50%)";
  elIcon.style.objectFit = "contain";

  //elIcon.src = chrome.runtime.getURL("/assets/icons/brain.svg");
  elBase.appendChild(elBack);
  elBase.appendChild(elIcon);
  elOwner.prepend(elBase);
}

function setChannelIconType(type) {
  const elBase = document.querySelector(`#${ids.avatarBase}`);
  const elBack = document.querySelector(`#${ids.avatarBack}`);
  const elIcon = document.querySelector(`#${ids.avatarIcon}`);
  //if (!elBase || !elBack || !elIcon) return;

  const style = ratingTypes[type];

  if (!style) {
    console.warn(`HUMANMADE: unknown avatar type "${type}"`);
    elBase.style.display = "none";
    return;
  }

  elBase.setAttribute("title", style.label || "Humanmade content rating");
  elBase.style.display = "block";
  elBack.style.color = style.color;
  elIcon.src = chrome.runtime.getURL(`/assets/icons/${style.icon}`);
}
