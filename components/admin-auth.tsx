"use client";
import { useRef, useState, type FormEvent } from "react";
import {
  Box,
  Button,
  Field,
  Input,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Wrap, Eyebrow, Editorial, Action, TextLink } from "./design";

export function AdminUnavailable() {
  return (
    <Wrap py="16">
      <Box maxW="560px" mx="auto" py="16">
        <Eyebrow>YOUR WORKSPACE</Eyebrow>
        <Editorial>We’ll be back shortly.</Editorial>
        <Text color="muted" mt="6" lineHeight="1.8">
          Administration is temporarily unavailable. Please try again later.
        </Text>
        <TextLink href="/">Return to the website</TextLink>
      </Box>
    </Wrap>
  );
}

export function AdminSignIn() {
  const router = useRouter();
  const busy = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await authClient.signIn.email({
        email: String(form.get("email") ?? "")
          .trim()
          .toLowerCase(),
        password: String(form.get("password") ?? ""),
      });
      if (result.error) {
        setError(
          result.error.status === 429
            ? "Too many attempts. Wait a minute and try again."
            : "We could not verify these sign-in details. Please try again.",
        );
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("We could not connect. Check your connection and try again.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  return (
    <Wrap minH="100dvh" display="grid" placeItems="center" py="12">
      <Box
        w="full"
        maxW="440px"
        bg="paper"
        border="1px solid"
        borderColor="line"
        p={{ base: "6", md: "10" }}
      >
        <Box color="brass" mb="7">
          <LockKeyhole size={28} strokeWidth={1.4} />
        </Box>
        <Eyebrow>ADMINISTRATION</Eyebrow>
        <Editorial fontSize={{ base: "38px", md: "44px" }}>
          Welcome back.
        </Editorial>
        <Text fontSize="sm" color="muted" mt="5" mb="8">
          Sign in to take care of your products, orders and spaces.
        </Text>
        <chakra.form onSubmit={submit}>
          <Stack gap="5">
            <Field.Root required>
              <Field.Label htmlFor="admin-email">
                Email address <Field.RequiredIndicator />
              </Field.Label>
              <Input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={200}
                bg="white"
                h="12"
                borderColor="line"
                rounded="0"
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label htmlFor="admin-password">
                Password <Field.RequiredIndicator />
              </Field.Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
                bg="white"
                h="12"
                borderColor="line"
                rounded="0"
              />
            </Field.Root>
            {error && (
              <Text role="alert" fontSize="sm" color="red.700">
                {error}
              </Text>
            )}
            <Action
              type="submit"
              loading={loading}
              loadingText="Signing in"
              arrow={false}
              w="full"
            >
              Sign in
            </Action>
          </Stack>
        </chakra.form>
        <TextLink href="/">Return to the website</TextLink>
      </Box>
    </Wrap>
  );
}

export function AdminSignOut() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  async function signOut() {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign out failed");
      window.location.assign("/admin/sign-in");
    } catch {
      setError("Sign out failed. Please try again.");
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }
  return (
    <Box mt="4">
      <Button
        variant="ghost"
        color="inherit"
        size="sm"
        loading={loading}
        onClick={() => void signOut()}
      >
        <LogOut size={14} /> Sign out
      </Button>
      {error && (
        <Text role="alert" fontSize="xs" mt="2">
          {error}
        </Text>
      )}
    </Box>
  );
}
