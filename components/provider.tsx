"use client";
import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from "@chakra-ui/react";
import { MotionConfig } from "framer-motion";
const system = createSystem(
  defaultConfig,
  defineConfig({
    theme: {
      tokens: {
        colors: {
          forest: { value: "#253d35" },
          forestDark: { value: "#192d26" },
          cream: { value: "#f6f3ec" },
          paper: { value: "#fffdf8" },
          ink: { value: "#273c33" },
          muted: { value: "#60675e" },
          brass: { value: "#846343" },
          sage: { value: "#e7e9df" },
          line: { value: "#dcdcd1" },
        },
        fonts: {
          body: { value: '"Manrope", Arial, sans-serif' },
          heading: { value: '"Manrope", Arial, sans-serif' },
          editorial: { value: '"Cormorant Garamond", Georgia, serif' },
        },
        radii: { editorial: { value: "2px" } },
      },
    },
    globalCss: {
      html: { scrollBehavior: "smooth" },
      body: {
        bg: "cream",
        color: "ink",
        fontFamily: "body",
        lineHeight: "1.7",
      },
      "::selection": { bg: "sage", color: "forest" },
      "*:focus-visible": { outline: "2px solid #8b6a31", outlineOffset: "4px" },
    },
  }),
);
export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ChakraProvider>
  );
}
