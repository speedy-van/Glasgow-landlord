"use client";

import { Box, Flex, Grid, Image, Skeleton, Text } from "@chakra-ui/react";
import { Editorial, Eyebrow, Wrap } from "@/components/design";

export default function Loading() {
  return (
    <Box as="main" minH="100svh" bg="cream">
      <Wrap py={{ base: "6", md: "9" }}>
        <Flex align="center" gap="3">
          <Image src="/favicon.svg" alt="" w="44px" h="44px" />
          <Text fontSize="11px" fontWeight="600" letterSpacing=".12em">
            LANDLORD SOLUTIONS
          </Text>
        </Flex>
        <Grid
          templateColumns={{ base: "1fr", md: "1fr 1fr" }}
          gap={{ base: "10", md: "16" }}
          alignItems="center"
          py={{ base: "12", md: "16" }}
        >
          <Box>
            <Eyebrow color="brass">Considered spaces. Everyday living.</Eyebrow>
            <Editorial as="h1" fontSize={{ base: "40px", md: "58px" }}>
              A little inspiration is on its way.
            </Editorial>
            <Text role="status" color="muted" mt="6" fontSize="sm">
              Loading your page…
            </Text>
            <Box aria-hidden="true" mt="9">
              <Skeleton height="12px" maxW="280px" borderRadius="0" mb="3" />
              <Skeleton height="12px" maxW="210px" borderRadius="0" />
            </Box>
          </Box>
          <Skeleton
            aria-hidden="true"
            height={{ base: "280px", md: "540px" }}
            borderRadius="0"
          />
        </Grid>
      </Wrap>
    </Box>
  );
}
