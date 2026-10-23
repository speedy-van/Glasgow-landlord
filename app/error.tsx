"use client";
import { Box, Button, Heading, Text } from "@chakra-ui/react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Box
      p="10"
      minH="80vh"
      display="grid"
      placeContent="center"
      textAlign="center"
    >
      <Heading mb="4">Let’s try that again.</Heading>
      <Text mb="6">
        We could not load this page. Please retry, or call 0141 778 8433.
      </Text>
      <Button bg="forest" color="white" onClick={reset}>
        Try again
      </Button>
    </Box>
  );
}
