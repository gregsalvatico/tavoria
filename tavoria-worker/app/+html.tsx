import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <link rel="icon" type="image/png" href="/favicon.png?v=4" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              *{scrollbar-width:none}
              *::-webkit-scrollbar{display:none;width:0;height:0}
              a:hover,
              button:not(:disabled):hover,
              [role="button"]:not([aria-disabled="true"]):hover,
              [role="link"]:not([aria-disabled="true"]):hover,
              div[tabindex="0"]:not([aria-disabled="true"]):hover{
                background-image:linear-gradient(rgba(14,26,36,.07),rgba(14,26,36,.07));
              }
              a:hover,[role="link"]:hover{border-radius:8px}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
