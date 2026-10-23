"use client";

import Link from "next/link";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Action, Editorial, Eyebrow, Wrap } from "@/components/design";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Box as="main" minH="100svh" bg="cream">
      <Wrap py={{ base: "6", md: "9" }}>
        <Link href="/" aria-label="Landlord Solutions home">
          <Image src="/favicon.svg" alt="" w="44px" h="44px" />
        </Link>
        <Flex
          minH="calc(100svh - 150px)"
          align="center"
          py={{ base: "12", md: "20" }}
        >
          <Box maxW="650px">
            <Eyebrow color="brass">A brief interruption</Eyebrow>
            <Editorial as="h1" fontSize={{ base: "44px", md: "68px" }}>
              This space needs a moment.
            </Editorial>
            <Text
              role="alert"
              color="muted"
              fontSize={{ base: "sm", md: "md" }}
              lineHeight="1.8"
              mt="6"
              maxW="450px"
            >
              We couldn’t load this page. Please try again, or return to the
              collection to find something for your space.
            </Text>
            <Flex gap="3" wrap="wrap" mt="9">
              <Action arrow={false} onClick={reset}>
                Try again <RotateCcw size={16} aria-hidden="true" />
              </Action>
              <Action secondary arrow={false} asChild>
                <Link href="/shop">
                  Explore the collection{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </Action>
            </Flex>
          </Box>
        </Flex>
        <Text color="muted" fontSize="10px" letterSpacing=".1em">
          LANDLORD SOLUTIONS · GLASGOW
        </Text>
      </Wrap>
    </Box>
  );
}
