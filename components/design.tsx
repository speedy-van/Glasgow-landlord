"use client";
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  chakra,
  Box,
  Button,
  Heading,
  Text,
  type ButtonProps,
  type BoxProps,
} from "@chakra-ui/react";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import Link from "next/link";
const DesignLink = chakra(Link);
export const contentWidth = "1320px";
export function Wrap({ children, ...props }: BoxProps) {
  return (
    <Box
      maxW={contentWidth}
      mx="auto"
      px={{ base: "5", md: "10", xl: "14" }}
      {...props}
    >
      {children}
    </Box>
  );
}
export function Eyebrow({
  children,
  color = "muted",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Text
      textTransform="uppercase"
      letterSpacing=".19em"
      fontSize="11px"
      fontWeight="700"
      color={color}
      mb="5"
    >
      {children}
    </Text>
  );
}
export function Editorial({ children, ...props }: BoxProps) {
  return (
    <Box
      as="h2"
      fontFamily="editorial"
      fontWeight="400"
      fontSize={{ base: "42px", md: "60px" }}
      lineHeight="1.04"
      letterSpacing="-.025em"
      {...props}
    >
      {children}
    </Box>
  );
}
export function Action({
  children,
  secondary = false,
  arrow = true,
  asChild,
  ...props
}: ButtonProps & { secondary?: boolean; arrow?: boolean }) {
  const arrowIcon = arrow ? <ArrowUpRight size={16} /> : null;
  const content =
    asChild && isValidElement(children) ? (
      cloneElement(
        children as ReactElement<{ children?: ReactNode }>,
        {},
        <>
          {(children as ReactElement<{ children?: ReactNode }>).props.children}
          {arrowIcon}
        </>,
      )
    ) : (
      <>
        {children}
        {arrowIcon}
      </>
    );
  return (
    <Button
      asChild={asChild}
      h="52px"
      px="7"
      bg={secondary ? "transparent" : "forest"}
      color={secondary ? "forest" : "white"}
      border="1px solid"
      borderColor={secondary ? "line" : "forest"}
      borderRadius="0"
      fontSize="13px"
      fontWeight="600"
      gap="5"
      _hover={{
        bg: secondary ? "sage" : "forestDark",
        transform: "translateY(-1px)",
      }}
      transition="background .2s,transform .2s"
      {...props}
    >
      {content}
    </Button>
  );
}
export function TextLink({
  href,
  children,
  light = false,
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <DesignLink
      href={href}
      display="inline-flex"
      alignItems="center"
      gap="6"
      color={light ? "white" : "forest"}
      borderBottom="1px solid"
      borderColor={light ? "whiteAlpha.400" : "line"}
      py="3"
      fontSize="13px"
      fontWeight="600"
      _hover={{ borderColor: light ? "white" : "forest" }}
    >
      {children}
      <ArrowRight size={16} />
    </DesignLink>
  );
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <Box
      border="1px solid"
      borderColor="line"
      p={{ base: "8", md: "16" }}
      textAlign="center"
      bg="paper"
    >
      <Heading fontSize="24px" fontWeight="500" mb="3">
        {title}
      </Heading>
      <Text fontSize="sm" color="muted" maxW="450px" mx="auto" mb="6">
        {description}
      </Text>
      {children}
    </Box>
  );
}
