"use client";
import { createId } from "@/lib/uuid";
import { useEffect, useRef, useState } from "react";
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
import { Check, MapPin, ArrowRight } from "lucide-react";
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
            const p = data.products.find((p) => p.id === l.productId);
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
      abort.current?.abort();
    };
  }, []);
  async function findAddress() {
    if (address.trim().length < 3) return;
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
      if (sequence === latest.current) {
        setResults(r.results);
        if (!r.results.length)
          setAddressError(
            "No address found. You can enter your postcode manually.",
          );
      }
    } catch (e) {
      if (
        sequence === latest.current &&
        !(e instanceof DOMException && e.name === "AbortError")
      )
        setAddressError(
          e instanceof Error ? e.message : "Enter your postcode manually.",
        );
    } finally {
      if (sequence === latest.current) setSearching(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
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
      requestId,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (data.mode === "preview") {
        const raw = localStorage.getItem(PREVIEW_KEY);
        const draft = raw
          ? JSON.parse(raw)
          : { ...data, media: seedMedia, quotes: [], orders: [] };
        const q: Quote = {
          ...parsed.data,
          id: requestId,
          status: "new",
          createdAt: new Date().toISOString(),
        };
        draft.quotes = [
          q,
          ...(draft.quotes ?? []).filter((x: Quote) => x.id !== requestId),
        ];
        localStorage.setItem(PREVIEW_KEY, JSON.stringify(draft));
      } else {
        await apiRequest("/api/quotes", {
          method: "POST",
          body: JSON.stringify(parsed.data),
        });
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (done)
    return (
      <Box bg="sage" p={{ base: "8", md: "12" }} role="status">
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
        <Text fontSize="13px" lineHeight="2" mt="6" color="muted">
          {data.mode === "preview"
            ? "This enquiry is saved on this device for the website preview. To send your real request, please call our team."
            : "Your enquiry has been recorded for our team. Keep your reference below, or call us to discuss your plans."}
        </Text>
        <Text fontSize="10px" mt="4" color="muted">
          Reference: {requestId.slice(0, 8).toUpperCase()}
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
          fontSize="11px"
          onClick={() => {
            setDone(false);
            setRequestId(createId());
          }}
        >
          Start another enquiry
        </Button>
      </Box>
    );
  return (
    <chakra.form onSubmit={submit} noValidate={false}>
      <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="5">
        <FormField label="Your name" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            maxLength={100}
          />
        </FormField>
        <FormField label="Email address" required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            maxLength={200}
          />
        </FormField>
        <FormField label="Phone number" required>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
            maxLength={24}
          />
        </FormField>
        <FormField label="Property postcode" required>
          <Input
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
          <Flex gap="3">
            <Input
              aria-label="Search property address"
              placeholder="Start with a postcode or address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                latest.current++;
                abort.current?.abort();
                setSearching(false);
                setResults([]);
              }}
              bg="paper"
              rounded="0"
            />
            <Button
              type="button"
              loading={searching}
              onClick={() => void findAddress()}
              bg="forest"
              color="white"
              rounded="0"
              fontSize="11px"
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
                  fontSize="11px"
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
            <Text fontSize="11px" mt="3" color="red.700" role="status">
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
          <Text fontSize="9px" color="muted" mt="3">
            Address suggestions by Mapbox. We will confirm delivery availability
            with you.
          </Text>
        </Box>
      )}
      <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="5" mt="5">
        <FormField label="I’m furnishing a…">
          <NativeSelect.Root>
            <NativeSelect.Field
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
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
            >
              {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(
                (n) => (
                  <option key={n} value={n}>
                    {n === "0"
                      ? "Studio"
                      : n + " " + (n === "1" ? "bedroom" : "bedrooms")}
                  </option>
                ),
              )}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </FormField>
      </Grid>
      <Box mt="5">
        <FormField label="What do you have in mind?" required>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your property, the pieces you need and any dates or access details we should know."
            required
            minLength={10}
            maxLength={3000}
            minH="160px"
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
          checked={consent}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setConsent(e.target.checked)
          }
          required
          mt="1"
          accentColor="forest"
          w="16px"
          h="16px"
          flexShrink="0"
        />
        <Text fontSize="10px" color="muted" lineHeight="1.9">
          I agree that my details may be used to respond to this enquiry.{" "}
          <chakra.a href="/privacy" textDecoration="underline">
            Read the privacy information.
          </chakra.a>
        </Text>
      </Flex>
      {data.mode === "preview" && (
        <Text fontSize="10px" color="muted" lineHeight="1.8" mt="5">
          Website preview: this form saves a draft on this device. For a real
          enquiry, call {data.settings.phone}.
        </Text>
      )}
      {error && (
        <Text role="alert" color="red.700" fontSize="12px" mt="5">
          {error}
        </Text>
      )}
      <Action
        type="submit"
        loading={busy}
        loadingText="Saving your enquiry…"
        mt="7"
      >
        {data.mode === "preview"
          ? "Save preview enquiry"
          : "Request my quotation"}
      </Action>
    </chakra.form>
  );
}
export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Field.Root
      required={required}
      css={{
        "& input,& textarea,& select": {
          borderRadius: 0,
          borderColor: "line",
          bg: "paper",
          fontSize: "12px",
          minHeight: "46px",
        },
        "& input:focus,& textarea:focus,& select:focus": {
          borderColor: "forest",
          outlineColor: "forest",
        },
      }}
    >
      <Field.Label fontSize="10px" fontWeight="600" mb="2">
        {label}
        {required && <Field.RequiredIndicator />}
      </Field.Label>
      {children}
    </Field.Root>
  );
}
