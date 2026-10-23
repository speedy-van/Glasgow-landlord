"use client";
import { useEffect } from "react";
import { Box, Flex, Grid, Image, Text } from "@chakra-ui/react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Clock3, ArrowLeft } from "lucide-react";
import { Wrap, Eyebrow, Editorial, Action } from "./design";
import { Brand } from "./storefront";
import { updateCart } from "@/lib/cart-store";
export function CheckoutStatus({
  paid,
  reference,
}: {
  paid: boolean;
  reference?: string;
}) {
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (paid) {
      updateCart(() => []);
      try {
        sessionStorage.removeItem("checkout-attempt");
      } catch {}
    }
  }, [paid]);
  return (
    <Wrap as="main" py={{ base: "7", md: "10" }}>
      <Brand />
      <Grid
        templateColumns={{ base: "1fr", lg: "1fr 0.8fr" }}
        gap={{ base: "10", lg: "20" }}
        alignItems="center"
        py={{ base: "14", md: "20" }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3 }}
        >
          <Box maxW="620px">
            <Flex
              w="58px"
              h="58px"
              bg="sage"
              color="forest"
              justify="center"
              align="center"
              mb="8"
            >
              {paid ? (
                <Check size={27} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Clock3 size={27} strokeWidth={1.5} aria-hidden="true" />
              )}
            </Flex>
            <Eyebrow>{paid ? "PAYMENT VERIFIED" : "PAYMENT STATUS"}</Eyebrow>
            <Editorial as="h1" fontSize={{ base: "42px", md: "60px" }}>
              {paid
                ? "Thank you. We have your order."
                : "We’re checking the details."}
            </Editorial>
            <Text
              mt="7"
              fontSize="14px"
              lineHeight="1.9"
              color="muted"
              role="status"
            >
              {paid
                ? "Your payment has been confirmed by Stripe. Our team will coordinate delivery with you."
                : "We could not confirm a completed payment from this link. Do not pay again if your bank shows a charge. Contact our team on 0141 778 8433 with your payment reference."}
            </Text>
            {reference && (
              <Box
                mt="7"
                borderTop="1px solid"
                borderBottom="1px solid"
                borderColor="line"
                py="5"
              >
                <Text
                  fontSize="10px"
                  color="muted"
                  letterSpacing=".12em"
                  textTransform="uppercase"
                  mb="2"
                >
                  Order reference
                </Text>
                <Text fontSize="13px" overflowWrap="anywhere">
                  {reference}
                </Text>
              </Box>
            )}
            <Action mt="8" asChild w={{ base: "full", sm: "auto" }}>
              <a href="/">Back to the collection</a>
            </Action>
            {!paid && (
              <Text mt="5" fontSize="12px">
                <a href="tel:01417788433">Call 0141 778 8433</a>
              </Text>
            )}
          </Box>
        </motion.div>
        <Box display={{ base: "none", lg: "block" }}>
          <Image
            src="/images/calm-bedroom.webp"
            alt="Soft neutral furnishings in a restful bedroom"
            w="full"
            h="560px"
            objectFit="cover"
          />
          <Text fontSize="11px" color="muted" mt="4">
            Thoughtfully furnished. Ready for everyday life.
          </Text>
        </Box>
      </Grid>
      <Flex
        gap="2"
        align="center"
        fontSize="12px"
        color="muted"
        borderTop="1px solid"
        borderColor="line"
        pt="5"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        <a href="/contact">Talk to our team</a>
      </Flex>
    </Wrap>
  );
}
