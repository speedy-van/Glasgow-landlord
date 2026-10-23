"use client";

import Link from "next/link";
import { Box, Grid, Image, Text } from "@chakra-ui/react";
import {
  Action,
  Editorial,
  Eyebrow,
  TextLink,
  Wrap,
} from "@/components/design";

export default function NotFound() {
  return (
    <Box as="main" minH="100svh" bg="cream">
      <Wrap py={{ base: "6", md: "9" }}>
        <Link href="/" aria-label="Landlord Solutions home">
          <Image src="/favicon.svg" alt="" w="44px" h="44px" />
        </Link>
        <Grid
          templateColumns={{ base: "1fr", md: "1fr 1fr" }}
          gap={{ base: "10", md: "16" }}
          alignItems="center"
          py={{ base: "12", md: "16" }}
        >
          <Box maxW="520px">
            <Eyebrow color="brass">404 · A different direction</Eyebrow>
            <Editorial as="h1" fontSize={{ base: "44px", md: "64px" }}>
              There’s another space waiting.
            </Editorial>
            <Text
              color="muted"
              fontSize="sm"
              lineHeight="1.9"
              mt="6"
              maxW="400px"
            >
              We couldn’t find this page. Explore our furniture and furnishing
              collections, or start again from home.
            </Text>
            <Box mt="8">
              <Action asChild>
                <Link href="/shop">Explore the collection</Link>
              </Action>
            </Box>
            <Box mt="4">
              <TextLink href="/">Back to home</TextLink>
            </Box>
          </Box>
          <Box
            overflow="hidden"
            bg="sage"
            maxH={{ base: "260px", md: "620px" }}
          >
            <Image
              src="/images/soft-living.webp"
              alt="A relaxed living room with soft seating and a wooden coffee table"
              width="1350"
              height="1800"
              w="full"
              h={{ base: "260px", md: "620px" }}
              objectFit="cover"
              objectPosition="center 60%"
            />
          </Box>
        </Grid>
      </Wrap>
    </Box>
  );
}
