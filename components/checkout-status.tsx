"use client";
import { useEffect } from "react";
import { Box, Text } from "@chakra-ui/react";
import { Wrap, Eyebrow, Editorial, Action } from "./design";
import { Brand } from "./storefront";
import { CART_KEY } from "@/lib/client";
export function CheckoutStatus({
  paid,
  reference,
}: {
  paid: boolean;
  reference?: string;
}) {
  useEffect(() => {
    if (paid)
      try {
        localStorage.removeItem(CART_KEY);
        sessionStorage.removeItem("checkout-attempt");
      } catch {}
  }, [paid]);
  return (
    <Wrap py="10">
      <Brand />
      <Box maxW="600px" py="20">
        <Eyebrow>{paid ? "PAYMENT VERIFIED" : "PAYMENT STATUS"}</Eyebrow>
        <Editorial>
          {paid
            ? "Thank you. We have your order."
            : "We’re checking the details."}
        </Editorial>
        <Text mt="7" fontSize="13px" lineHeight="2" color="muted">
          {paid
            ? "Your payment has been confirmed by Stripe. Our team will coordinate delivery with you."
            : "We could not confirm a completed payment from this link. Do not pay again if your bank shows a charge. Contact our team on 0141 778 8433 with your payment reference."}
        </Text>
        {reference && (
          <Text fontSize="11px" mt="5">
            Order reference: {reference}
          </Text>
        )}
        <Action mt="8" asChild>
          <a href="/">Back to the collection</a>
        </Action>
      </Box>
    </Wrap>
  );
}
