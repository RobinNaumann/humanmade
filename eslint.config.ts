import js from "@eslint/js";
import { ESLint } from "eslint";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

function endsWithAny(str: string, ...suffixes: string[]): boolean {
  return suffixes.some((suffix) => str.endsWith(suffix));
}

function startsWithAny(str: string, ...prefixes: string[]): boolean {
  return prefixes.some((prefix) => str.startsWith(prefix));
}

function isServerFile(path: string) {
  return endsWithAny(path, ".server", ".server.ts", ".server.js");
}

function isSharedFile(path: string) {
  return endsWithAny(path, ".shared", ".shared.ts", ".shared.js");
}

export const elzpack: ESLint.Plugin & {
  recommended: { [key: string]: "error" | "warn" | "off" };
} = {
  meta: {
    name: "elzpack",
    version: "1.2.3",
  },
  processors: {},
  recommended: {
    "elzpack/no-cross-import-server": "warn",
    "elzpack/no-cross-import-client": "warn",
  },
  rules: {
    "no-cross-import-server": {
      meta: {
        type: "problem",
        docs: {
          description: "disallow importing server code in the client",
        },
        schema: [],
        messages: {
          noServerImport:
            "Importing from server files (server.ts) is not allowed in client files.",
        },
      },
      create(context) {
        const fn = context.filename;
        if (fn.endsWith(".server.ts")) return {};
        if (!endsWithAny(fn, ".tsx", ".jsx", ".js", ".ts")) return {};
        return {
          ImportDeclaration(node) {
            const path = node.source.value;

            // if it is a package import, skip it
            if (!(typeof path === "string")) return;
            if (!startsWithAny(path, ".", "/")) return;
            if (isSharedFile(path)) return;

            if (isServerFile(path)) {
              context.report({ node, messageId: "noServerImport" });
            }
          },
          CallExpression(node) {
            if (
              node.callee.type !== "Identifier" ||
              node.callee.name !== "require" ||
              !node.arguments.length ||
              node.arguments[0].type !== "Literal" ||
              typeof node.arguments[0].value !== "string"
            )
              return;

            const path = node.arguments[0].value;
            // if it is a package import, skip it
            if (!startsWithAny(path, ".", "/")) return;
            if (isSharedFile(path)) return;

            if (isServerFile(path)) {
              context.report({ node, messageId: "noServerImport" });
            }
          },
        };
      },
    },
    "no-cross-import-client": {
      meta: {
        type: "problem",
        docs: {
          description: "disallow importing client code in the server",
        },
        schema: [],
        messages: {
          noClientImport:
            "Importing from client files (.ts) is not allowed in server files (.server.ts).",
        },
      },
      create(context) {
        const fn = context.filename;
        if (!endsWithAny(fn, ".server.js", ".server.ts")) return {};
        return {
          ImportDeclaration(node) {
            const path = node.source.value;

            // if it is a package import, skip it
            if (!(typeof path === "string")) return;
            if (!startsWithAny(path, ".", "/")) return;
            if (isSharedFile(path)) return;

            if (!isServerFile(path)) {
              context.report({ node, messageId: "noClientImport" });
            }
          },
          CallExpression(node) {
            if (
              node.callee.type !== "Identifier" ||
              node.callee.name !== "require" ||
              !node.arguments.length ||
              node.arguments[0].type !== "Literal" ||
              typeof node.arguments[0].value !== "string"
            )
              return;

            const path = node.arguments[0].value;
            // if it is a package import, skip it
            if (!startsWithAny(path, ".", "/")) return;
            if (isSharedFile(path)) return;

            if (!isServerFile(path)) {
              context.report({ node, messageId: "noClientImport" });
            }
          },
        };
      },
    },
  },
};

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: {
      js,
      elzpack,
    },
    extends: [
      //"js/recommended",
      //  "preact"
    ],
    rules: {
      ...elzpack.recommended,
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "no-constant-condition": "warn",
    },
  },
  tseslint.configs.base,
]);
