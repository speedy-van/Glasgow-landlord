"use client";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  IconButton,
  Image,
  Input,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  LogOut,
  CircleAlert,
  ShieldCheck,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Eyebrow, Editorial, Action, TextLink } from "./design";
import { Brand } from "./storefront";
import { FormField } from "./quote-form";

function AuthFrame({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <Grid
      as="main"
      minH="100dvh"
      bg="cream"
      templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
    >
      <Flex
        direction="column"
        minW="0"
        px={{ base: "6", md: "12", xl: "20" }}
        py={{ base: "7", md: "10" }}
      >
        <Brand />
        <Box
          flex="1"
          display="grid"
          alignItems="center"
          py={{ base: "12", md: "16" }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
          >
            <Box maxW="420px" w="full" mx="auto">
              {children}
            </Box>
          </motion.div>
        </Box>
        <chakra.a
          href="/"
          display="inline-flex"
          alignItems="center"
          alignSelf="flex-start"
          gap="3"
          fontSize="12px"
          color="muted"
          minH="44px"
        >
          <ArrowLeft size={15} aria-hidden="true" /> Back to the collection
        </chakra.a>
      </Flex>
      <Box
        display={{ base: "none", lg: "block" }}
        position="relative"
        minH="100dvh"
        bg="forest"
        overflow="hidden"
      >
        <Image
          src="/images/oak-bedroom.webp"
          alt="A carefully furnished bedroom with warm oak furniture"
          w="full"
          h="full"
          position="absolute"
          inset="0"
          objectFit="cover"
        />
        <Box position="absolute" inset="0" bg="blackAlpha.300" />
        <Box
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          p={{ lg: "10", xl: "16" }}
          bg="forest"
          color="cream"
        >
          <Eyebrow color="cream">GLASGOW LANDLORD SOLUTIONS</Eyebrow>
          <Editorial fontSize={{ lg: "44px", xl: "54px" }}>
            Considered spaces.
            <br />
            Every detail in place.
          </Editorial>
          <Text mt="5" fontSize="13px" lineHeight="1.8" color="whiteAlpha.800">
            Your collection, conversations and orders. Together in one
            workspace.
          </Text>
        </Box>
      </Box>
    </Grid>
  );
}

export function AdminUnavailable() {
  return (
    <AuthFrame>
      <Box color="forest" mb="7">
        <LockKeyhole size={30} strokeWidth={1.4} aria-hidden="true" />
      </Box>
      <Eyebrow>YOUR PRIVATE WORKSPACE</Eyebrow>
      <Editorial as="h1" fontSize={{ base: "42px", md: "52px" }}>
        We’ll be back shortly.
      </Editorial>
      <Text
        color="muted"
        mt="6"
        mb="7"
        fontSize="14px"
        lineHeight="1.9"
        role="status"
      >
        Administration is temporarily unavailable. Please try again later.
      </Text>
      <TextLink href="/">Explore the collection</TextLink>
    </AuthFrame>
  );
}

export function AdminSignIn() {
  const router = useRouter();
  const busy = useRef(false);
  const mounted = useRef(true);
  const activeRequest = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      activeRequest.current?.abort();
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const controller = new AbortController();
    activeRequest.current = controller;
    let navigating = false;
    try {
      const result = await authClient.signIn.email({
        email: String(form.get("email") ?? "")
          .trim()
          .toLowerCase(),
        password: String(form.get("password") ?? ""),
        fetchOptions: { signal: controller.signal },
      });
      if (!mounted.current || controller.signal.aborted) return;
      if (result.error) {
        setError(
          result.error.status === 429
            ? "Too many attempts. Wait a minute and try again."
            : "We could not verify these sign-in details. Please try again.",
        );
        return;
      }
      navigating = true;
      router.replace("/admin");
      router.refresh();
    } catch {
      if (mounted.current)
        setError("We could not connect. Check your connection and try again.");
    } finally {
      if (!navigating) {
        busy.current = false;
        if (mounted.current) setLoading(false);
      }
    }
  }
  return (
    <AuthFrame>
      <Flex
        w="54px"
        h="54px"
        bg="sage"
        color="forest"
        align="center"
        justify="center"
        mb="8"
      >
        <LockKeyhole size={24} strokeWidth={1.4} aria-hidden="true" />
      </Flex>
      <Eyebrow>ADMINISTRATION</Eyebrow>
      <Editorial as="h1" fontSize={{ base: "44px", md: "56px" }}>
        Welcome back.
      </Editorial>
      <Text fontSize="14px" color="muted" lineHeight="1.8" mt="5" mb="8">
        Sign in to take care of your collection, orders and enquiries.
      </Text>
      <chakra.form onSubmit={submit} aria-busy={loading}>
        <Stack gap="5">
          <FormField id="admin-email" label="Email address" required>
            <Input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={200}
              placeholder="you@example.com"
            />
          </FormField>
          <FormField id="admin-password" label="Password" required>
            <Box position="relative" w="full">
              <Input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                maxLength={128}
                pr="14"
              />
              <IconButton
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                variant="plain"
                position="absolute"
                right="1"
                top="1"
                h="44px"
                w="44px"
                color="muted"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </IconButton>
            </Box>
          </FormField>
          {error && (
            <Flex
              role="alert"
              fontSize="13px"
              color="red.800"
              bg="red.50"
              p="4"
              gap="3"
              align="flex-start"
            >
              <CircleAlert
                size={18}
                style={{ flexShrink: 0, marginTop: 2 }}
                aria-hidden="true"
              />
              <Text lineHeight="1.7">{error}</Text>
            </Flex>
          )}
          <Action
            type="submit"
            loading={loading}
            loadingText="Signing in…"
            arrow={false}
            w="full"
            mt="2"
          >
            Sign in to your workspace
          </Action>
        </Stack>
      </chakra.form>
      <Flex
        align="flex-start"
        gap="3"
        mt="7"
        pt="6"
        borderTop="1px solid"
        borderColor="line"
        color="muted"
      >
        <ShieldCheck
          size={17}
          style={{ flexShrink: 0, marginTop: 2 }}
          aria-hidden="true"
        />
        <Text fontSize="12px" lineHeight="1.8">
          Access is reserved for authorised administrators.
        </Text>
      </Flex>
    </AuthFrame>
  );
}

export function AdminSignOut() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const mounted = useRef(true);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      activeRequest.current?.abort();
    };
  }, []);
  async function signOut() {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError("");
    const controller = new AbortController();
    activeRequest.current = controller;
    try {
      const result = await authClient.signOut({
        fetchOptions: { signal: controller.signal },
      });
      if (!mounted.current || controller.signal.aborted) return;
      if (result.error) throw new Error("Sign out failed");
      window.location.assign("/admin/sign-in");
    } catch {
      pending.current = false;
      if (mounted.current) {
        setError("Sign out failed. Please try again.");
        setLoading(false);
      }
    }
  }
  return (
    <Box mt="4">
      <Button
        variant="ghost"
        color="inherit"
        fontSize="12px"
        minH="44px"
        loading={loading}
        loadingText="Signing out…"
        onClick={() => void signOut()}
      >
        <LogOut size={15} aria-hidden="true" /> Sign out
      </Button>
      {error && (
        <Text role="alert" fontSize="12px" mt="2">
          {error}
        </Text>
      )}
    </Box>
  );
}
