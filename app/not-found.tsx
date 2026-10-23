"use client";
import { Box, Heading, Text } from "@chakra-ui/react";
export default function NotFound() {
  return (
    <Box p="12" textAlign="center">
      <Heading>That page has moved.</Heading>
      <Text my="5">
        Find your way back to our furniture and furnishing collections.
      </Text>
      <a href="/">Back to home →</a>
    </Box>
  );
}
