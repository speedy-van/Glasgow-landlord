"use client";
import { createId } from "@/lib/uuid";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  chakra,
  Box,
  Flex,
  Grid,
  Text,
  Input,
  Textarea,
  NativeSelect,
  Field,
  Button,
  Image,
} from "@chakra-ui/react";
import { Check, MapPin, ShieldCheck, CircleAlert } from "lucide-react";
import { Action, Eyebrow, Editorial } from "./design";
import {
  quoteSchema,
  type Bootstrap,
  type QuoteInput,
  type Quote,
} from "@/lib/domain";
import { apiRequest, CART_KEY, PREVIEW_KEY } from "@/lib/client";
import { seedMedia } from "@/lib/seed";
export function QuoteForm({ data }: { data: Bootstrap }) {
  const reduceMotion = useReducedMotion();
  const formRef = useRef<HTMLFormElement | null>(null);
  const successRef = useRef<HTMLDivElement | null>(null);
  const submission = useRef<AbortController | null>(null);
  const submitting = useRef(false);
  const mounted = useRef(true);
  const initialProducts = useRef(data.products);
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [phone, setPhone] = useState(""),
    [postcode, setPostcode] = useState(""),
    [type, setType] = useState<QuoteInput["propertyType"]>("Rental property"),
    [bedrooms, setBedrooms] = useState("2"),
    [message, setMessage] = useState(""),
    [consent, setConsent] = useState(false),
    [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [requestId, setRequestId] = useState("");
  const [reference, setReference] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [address, setAddress] = useState(""),
    [results, setResults] = useState<
      Array<{ id: string; label: string; coordinates: [number, number] }>
    >([]),
    [searching, setSearching] = useState(false),
    [addressError, setAddressError] = useState(""),
    [coords, setCoords] = useState<[number, number] | null>(null);
  const latest = useRef(0);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    setRequestId(createId());
    const params = new URLSearchParams(location.search);
    const pack = params.get("pack");
    const item = params.get("item");
    if (pack)
      setMessage(
        "I would like to discuss the " + pack + " pack for my property.",
      );
    if (item) setMessage("I would like to know more about " + item + ".");
    if (params.has("selection")) {
      try {
        const cart = JSON.parse(
          localStorage.getItem(CART_KEY) ?? "[]",
        ) as Array<{ productId: string; quantity: number }>;
        const items = cart
          .map((l) => {
            const p = initialProducts.current.find((p) => p.id === l.productId);
            return p ? l.quantity + " × " + p.title : "";
          })
          .filter(Boolean);
        if (items.length)
          setMessage(
            "Please quote for my selection:\n" +
              items.join("\n") +
              "\n\nProperty and access details: ",
          );
      } catch {}
    }
    return () => {
      mounted.current = false;
      latest.current++;
      abort.current?.abort();
      submission.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (done) successRef.current?.focus();
  }, [done]);
  async function findAddress() {
    if (address.trim().length < 3) {
      setAddressError(
        "Enter at least three characters, or use the postcode field above.",
      );
      return;
    }
    const sequence = ++latest.current;
    abort.current?.abort();
    const c = new AbortController();
    abort.current = c;
    setSearching(true);
    setAddressError("");
    try {
      const r = await apiRequest<{ results: typeof results }>(
        "/api/geocode?q=" + encodeURIComponent(address),
        { signal: c.signal },
      );
      if (mounted.current && !c.signal.aborted && sequence === latest.current) {
        setResults(r.results);
        if (!r.results.length)
          setAddressError(
            "No address found. You can enter your postcode manually.",
          );
      }
    } catch (e) {
      if (
        mounted.current &&
        !c.signal.aborted &&
        sequence === latest.current &&
        !(e instanceof DOMException && e.name === "AbortError")
      )
        setAddressError(
          e instanceof Error ? e.message : "Enter your postcode manually.",
        );
    } finally {
      if (mounted.current && sequence === latest.current) setSearching(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    setError("");
    setFieldErrors({});
    const attemptId = requestId || createId();
    if (!requestId) setRequestId(attemptId);
    const parsed = quoteSchema.safeParse({
      name,
      email,
      phone,
      postcode,
      propertyType: type,
      bedrooms: Number(bedrooms),
      message,
      consent,
      website,
      requestId: attemptId,
    });
    if (!parsed.success) {
      const messages: Record<string, string> = {
        name: "Enter your full name (at least two characters).",
        email: "Enter a valid email address.",
        phone: "Enter a phone number with 7–24 characters.",
        postcode: "Enter your property postcode (5–12 characters).",
        message: "Tell us a little more (at least ten characters).",
        consent: "Please agree so we can respond to your enquiry.",
      };
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        next[field] = messages[field] ?? issue.message;
      }
      setFieldErrors(next);
      setError("Please check the highlighted details below.");
      const first = Object.keys(next)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    submitting.current = true;
    const controller = new AbortController();
    submission.current = controller;
    setBusy(true);
    try {
      if (data.mode === "preview") {
        const raw = localStorage.getItem(PREVIEW_KEY);
        const draft = raw
          ? JSON.parse(raw)
          : { ...data, media: seedMedia, quotes: [], orders: [] };
        const q: Quote = {
          ...parsed.data,
          id: attemptId,
          status: "new",
          createdAt: new Date().toISOString(),
        };
        draft.quotes = [
          q,
          ...(draft.quotes ?? []).filter((x: Quote) => x.id !== attemptId),
        ];
        localStorage.setItem(PREVIEW_KEY, JSON.stringify(draft));
        setReference(attemptId);
      } else {
        const result = await apiRequest<{ id: string }>("/api/quotes", {
          method: "POST",
          body: JSON.stringify(parsed.data),
          signal: controller.signal,
        });
        if (!mounted.current || controller.signal.aborted) return;
        setReference(result.id);
      }
      if (mounted.current) setDone(true);
    } catch (e) {
      if (mounted.current && !controller.signal.aborted)
        setError(
          e instanceof Error
            ? e.message
            : "Please try again. Your details are still here.",
        );
    } finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  if (done)
    return (
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.25 }}
      >
        <Box
          ref={successRef}
          tabIndex={-1}
          bg="sage"
          p={{ base: "7", md: "12" }}
          role="status"
          border="1px solid"
          borderColor="line"
        >
          <Box
            w="45px"
            h="45px"
            rounded="full"
            border="1px solid"
            borderColor="forest"
            display="grid"
            placeItems="center"
            mb="7"
          >
            <Check size={22} />
          </Box>
          <Eyebrow>
            {data.mode === "preview"
              ? "PREVIEW ENQUIRY SAVED"
              : "THANK YOU FOR GETTING IN TOUCH"}
          </Eyebrow>
          <Editorial fontSize="37px">A good space starts here.</Editorial>
          <Text fontSize="14px" lineHeight="1.9" mt="6" color="muted">
            {data.mode === "preview"
              ? "This enquiry is saved on this device for the website preview. To send your real request, please call our team."
              : "Your enquiry has been recorded for our team. Keep your reference below, or call us to discuss your plans."}
          </Text>
          <Text fontSize="12px" mt="6" color="forest" fontWeight="600">
            Reference: {reference.slice(0, 8).toUpperCase()}
          </Text>
          <Action asChild mt="7">
            <a href={"tel:" + data.settings.phone.replace(/\s/g, "")}>
              Call {data.settings.phone}
            </a>
          </Action>
          <Button
            display="block"
            variant="plain"
            mt="5"
            fontSize="12px"
            onClick={() => {
              setDone(false);
              setRequestId(createId());
              setReference("");
              setMessage("");
              setConsent(false);
              setError("");
              setFieldErrors({});
            }}
          >
            Start another enquiry
          </Button>
        </Box>
      </motion.div>
    );
  return (
    <chakra.form ref={formRef} onSubmit={submit} noValidate aria-busy={busy}>
      <Flex
        justify="space-between"
        align="center"
        gap="4"
        borderBottom="1px solid"
        borderColor="line"
        pb="5"
        mb="7"
      >
        <Text fontSize="13px" fontWeight="600">
          A few details. A considered response.
        </Text>
        <Text fontSize="11px" color="muted" flexShrink="0">
          * Required
        </Text>
      </Flex>
      {error && (
        <Flex
          role="alert"
          color="red.800"
          bg="red.50"
          border="1px solid"
          borderColor="red.200"
          p="4"
          mb="6"
          gap="3"
          align="flex-start"
        >
          <CircleAlert
            size={18}
            style={{ flexShrink: 0, marginTop: 2 }}
            aria-hidden="true"
          />
          <Text fontSize="13px" lineHeight="1.7">
            {error}
          </Text>
        </Flex>
      )}
      <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="5">
        <FormField label="Your name" required error={fieldErrors.name}>
          <Input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            maxLength={100}
          />
        </FormField>
        <FormField label="Email address" required error={fieldErrors.email}>
          <Input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            maxLength={200}
          />
        </FormField>
        <FormField label="Phone number" required error={fieldErrors.phone}>
          <Input
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
            maxLength={24}
          />
        </FormField>
        <FormField
          label="Property postcode"
          required
          error={fieldErrors.postcode}
        >
          <Input
            name="postcode"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.toUpperCase())}
            autoComplete="postal-code"
            required
            maxLength={12}
          />
        </FormField>
      </Grid>
      {data.integrations.mapbox && (
        <Box my="6" p="5" bg="sage">
          <Flex gap="2" mb="3" align="center">
            <MapPin size={15} />
            <Text fontSize="11px" fontWeight="600">
              Find your property
            </Text>
          </Flex>
          <Flex gap="3" direction={{ base: "column", sm: "row" }}>
            <Input
              aria-label="Search property address"
              aria-describedby={
                addressError ? "address-search-message" : undefined
              }
              placeholder="Start with a postcode or address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                latest.current++;
                abort.current?.abort();
                setSearching(false);
                setResults([]);
                setAddressError("");
                setCoords(null);
              }}
              bg="paper"
              rounded="0"
              minH="48px"
            />
            <Button
              type="button"
              loading={searching}
              onClick={() => void findAddress()}
              bg="forest"
              color="white"
              rounded="0"
              fontSize="11px"
              minH="48px"
            >
              Find
            </Button>
          </Flex>
          {results.length > 0 && (
            <Flex direction="column" gap="2" mt="3">
              {results.map((r) => (
                <Button
                  key={r.id}
                  h="auto"
                  py="3"
                  whiteSpace="normal"
                  justifyContent="flex-start"
                  bg="paper"
                  variant="outline"
                  rounded="0"
                  fontSize="13px"
                  onClick={() => {
                    setAddress(r.label);
                    const pc = r.label.match(
                      /[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}/i,
                    );
                    if (pc) setPostcode(pc[0].toUpperCase());
                    setCoords(r.coordinates);
                    setResults([]);
                  }}
                >
                  {r.label}
                </Button>
              ))}
            </Flex>
          )}
          {addressError && (
            <Text
              id="address-search-message"
              fontSize="12px"
              mt="3"
              color="red.700"
              role="status"
            >
              {addressError}
            </Text>
          )}
          {coords && (
            <Image
              mt="4"
              src={"/api/map?lng=" + coords[0] + "&lat=" + coords[1]}
              alt="Map of the selected property location"
              w="100%"
              h="200px"
              objectFit="cover"
            />
          )}
          <Text fontSize="11px" lineHeight="1.7" color="muted" mt="3">
            Address suggestions by Mapbox. We will confirm delivery availability
            with you.
          </Text>
        </Box>
      )}
      <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="5" mt="5">
        <FormField label="I’m furnishing a…">
          <NativeSelect.Root>
            <NativeSelect.Field
              name="propertyType"
              value={type}
              onChange={(e) =>
                setType(e.target.value as QuoteInput["propertyType"])
              }
            >
              {[
                "Rental property",
                "Serviced accommodation",
                "Social housing",
                "Personal home",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </FormField>
        <FormField label="Number of bedrooms">
          <NativeSelect.Root>
            <NativeSelect.Field
              name="bedrooms"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
            >
              {Array.from({ length: 21 }, (_, i) => String(i)).map((n) => (
                <option key={n} value={n}>
                  {n === "0"
                    ? "Studio"
                    : n + " " + (n === "1" ? "bedroom" : "bedrooms")}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </FormField>
      </Grid>
      <Box mt="5">
        <FormField
          label="What do you have in mind?"
          required
          error={fieldErrors.message}
        >
          <Textarea
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your property, the pieces you need and any dates or access details we should know."
            required
            minLength={10}
            maxLength={3000}
            minH="180px"
          />
        </FormField>
      </Box>
      <Box position="absolute" left="-9999px" aria-hidden="true">
        <label>
          Website
          <input
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </Box>
      <Flex as="label" gap="3" align="flex-start" mt="6" cursor="pointer">
        <chakra.input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setConsent(e.target.checked)
          }
          required
          aria-invalid={Boolean(fieldErrors.consent)}
          aria-describedby={fieldErrors.consent ? "consent-error" : undefined}
          mt="1"
          accentColor="forest"
          w="20px"
          h="20px"
          flexShrink="0"
        />
        <Text fontSize="12px" color="muted" lineHeight="1.8">
          I agree that my details may be used to respond to this enquiry.{" "}
          <chakra.a href="/privacy" textDecoration="underline">
            Read the privacy information.
          </chakra.a>
        </Text>
      </Flex>
      {fieldErrors.consent && (
        <Text id="consent-error" fontSize="12px" color="red.700" mt="2">
          {fieldErrors.consent}
        </Text>
      )}
      {data.mode === "preview" && (
        <Text
          fontSize="12px"
          color="muted"
          lineHeight="1.8"
          mt="5"
          bg="sage"
          p="4"
        >
          Website preview: this form saves a draft on this device. For a real
          enquiry, call {data.settings.phone}.
        </Text>
      )}
      <Action
        type="submit"
        loading={busy}
        loadingText="Saving your enquiry…"
        mt="7"
        w={{ base: "full", sm: "auto" }}
      >
        {data.mode === "preview"
          ? "Save preview enquiry"
          : "Request my quotation"}
      </Action>
      <Flex gap="2" align="center" color="muted" mt="4">
        <ShieldCheck size={15} aria-hidden="true" />
        <Text fontSize="11px">
          Your details are used to respond to your enquiry.
        </Text>
      </Flex>
    </chakra.form>
  );
}
export function FormField({
  id,
  label,
  required,
  error,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Field.Root
      id={id}
      required={required}
      invalid={Boolean(error)}
      css={{
        "& input,& textarea,& select": {
          borderRadius: 0,
          borderColor: "line",
          bg: "paper",
          fontSize: "14px",
          transition: "border-color .15s, background .15s",
        },
        "& input,& select": { minHeight: "50px" },
        "& input:focus,& textarea:focus,& select:focus": {
          borderColor: "forest",
          outlineColor: "forest",
        },
      }}
    >
      <Field.Label fontSize="12px" fontWeight="600" mb="2" color="forest">
        {label}
        {required && <Field.RequiredIndicator />}
      </Field.Label>
      {children}
      {error && (
        <Field.ErrorText fontSize="12px" color="red.700" mt="1">
          {error}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
}
