"use client";
import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from "@chakra-ui/react";
const system = createSystem(
  defaultConfig,
  defineConfig({
    theme: {
      tokens: {
        colors: {
          forest: { value: "#203b30" },
          forestDark: { value: "#172c24" },
          cream: { value: "#f7f5ef" },
          paper: { value: "#fffefa" },
          ink: { value: "#233a30" },
          muted: { value: "#60695e" },
          brass: { value: "#8b6a31" },
          sage: { value: "#e5e9df" },
          line: { value: "#dcded4" },
        },
        fonts: {
          body: { value: '"Manrope", Arial, sans-serif' },
          heading: { value: '"DM Sans", Arial, sans-serif' },
          editorial: { value: '"DM Serif Display", Georgia, serif' },
        },
        radii: { editorial: { value: "2px" } },
      },
    },
    globalCss: {
      html: { scrollBehavior: "smooth" },
      body: { bg: "cream", color: "ink", fontFamily: "body" },
      "::selection": { bg: "sage", color: "forest" },
      "*:focus-visible": { outline: "2px solid #8b6a31", outlineOffset: "4px" },
    },
  }),
);
export function Provider({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
