"use client";
import { Box, Text } from "@chakra-ui/react";
import { Wrap, Eyebrow, Editorial, TextLink } from "./design";
import { Brand } from "./storefront";
export function InformationPage({ privacy = false }: { privacy?: boolean }) {
  return (
    <Wrap py="10">
      <Brand />
      <Box maxW="760px" py="16">
        <Eyebrow>WEBSITE PREVIEW INFORMATION</Eyebrow>
        <Editorial as="h1">
          {privacy ? "Your information." : "Before you place an order."}
        </Editorial>
        <Text fontSize="13px" lineHeight="2" mt="8">
          {privacy
            ? "The enquiry form asks for your name, email, phone number, property postcode and furnishing requirements so that the team can respond to your request. In preview mode, enquiries and administration drafts are stored only in this browser. Live enquiry storage requires the configured database."
            : "The supplied photography shows furnishing inspiration. Product specifications, quantities, availability, accessories, delivery arrangements and installation charges must be confirmed in your quotation. A saved preview enquiry does not place an order."}
        </Text>
        <Text fontSize="13px" lineHeight="2" mt="6">
          {privacy
            ? "Basket contents and preview drafts use local browser storage. No advertising analytics have been added. If online payments are enabled, Stripe handles the payment page. Address search, when configured, sends the search you enter to Mapbox. Please avoid entering sensitive information into the message field."
            : "Online payments are disabled until the administrator connects and verifies the payment service, sets prices and stock, and confirms delivery charges. This private preview is for review and configuration. The business must supply its final trading terms, returns policy, legal details and privacy policy before a public launch."}
        </Text>
        <Text fontSize="13px" lineHeight="2" mt="6">
          {privacy
            ? "For a request about your enquiry or personal information, call 0141 778 8433. The final business privacy policy, retention period and contact details must be confirmed before public launch."
            : "For a real furnishing enquiry, call 0141 778 8433 or 07757 765427. We will talk through the next step with you."}
        </Text>
        <Box mt="8">
          <TextLink href="/">Back to the collection</TextLink>
        </Box>
      </Box>
    </Wrap>
  );
}
