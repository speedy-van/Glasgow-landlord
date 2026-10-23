"use client";
import { createId } from "@/lib/uuid";
import { AdminSignOut } from "./admin-auth";
import { MAX_IMAGE_BYTES } from "@/lib/media";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Flex,
  Grid,
  Text,
  Heading,
  Button,
  IconButton,
  Input,
  Textarea,
  Image,
  Badge,
  NativeSelect,
  Drawer,
  Portal,
  CloseButton,
  Spinner,
  Switch,
  chakra,
} from "@chakra-ui/react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Images,
  Inbox,
  Settings2,
  PanelTop,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  Menu,
  Check,
  Cloud,
  CloudOff,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Smartphone,
  ExternalLink,
  KeyRound,
  TriangleAlert,
  Save,
  House,
  Truck,
} from "lucide-react";
import { Wrap, Eyebrow, Editorial, Action, Empty, TextLink } from "./design";
import { FormField } from "./quote-form";
import { Brand } from "./storefront";
import { apiRequest, PREVIEW_KEY } from "@/lib/client";
import { seedProducts, seedMedia } from "@/lib/seed";
import {
  productSchema,
  settingsSchema,
  categories,
  available,
  money,
  type AdminData,
  type Product,
  type SiteSettings,
  type MediaAsset,
  type Quote,
  type Order,
  type OrderStatus,
} from "@/lib/domain";
type Tab =
  | "overview"
  | "products"
  | "orders"
  | "enquiries"
  | "images"
  | "website"
  | "settings";
const tabs: Array<{ id: Tab; label: string; icon: typeof Package }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products & stock", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "enquiries", label: "Enquiries", icon: Inbox },
  { id: "images", label: "Image library", icon: Images },
  { id: "website", label: "Website", icon: PanelTop },
  { id: "settings", label: "Connections", icon: Settings2 },
];
export function AdminAccess() {
  return (
    <Wrap py="12">
      <Brand />
      <Box py="20" maxW="620px">
        <Eyebrow>ADMINISTRATOR ACCESS</Eyebrow>
        <Editorial>This workspace is private.</Editorial>
        <Text mt="7" lineHeight="2" fontSize="13px" color="muted">
          This account does not have permission to open administration. Sign out
          and use your administrator account.
        </Text>
        <TextLink href="/">Return to the website</TextLink>
        <AdminSignOut />
      </Box>
    </Wrap>
  );
}
export function AdminDashboard({ initial }: { initial: AdminData }) {
  const [data, setData] = useState(initial),
    [tab, setTab] = useState<Tab>("overview"),
    [menu, setMenu] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [editing, setEditing] = useState<Product | null>(null),
    [saving, setSaving] = useState(false),
    [filter, setFilter] = useState(""),
    [category, setCategory] = useState("All"),
    [uploadBusy, setUploadBusy] = useState(false),
    [install, setInstall] = useState(false);
  const preview = data.mode === "preview";
  const dataRef = useRef(data);
  const mounted = useRef(true);
  const requestRef = useRef<AbortController | null>(null);
  const mutationBusy = useRef(false);
  const epoch = useRef(0);
  const load = useCallback(async () => {
    if (!mounted.current || mutationBusy.current) return;
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    const started = epoch.current;
    setLoading(true);
    setError("");
    try {
      let next = await apiRequest<AdminData>("/api/admin", {
        signal: request.signal,
      });
      if (next.mode === "preview") {
        const raw = localStorage.getItem(PREVIEW_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AdminData;
          next = {
            ...next,
            ...parsed,
            products: parsed.products.map((p) => productSchema.parse(p)),
            settings: settingsSchema.parse(parsed.settings),
            integrations: next.integrations,
            mode: "preview",
          };
        }
      }
      if (
        mounted.current &&
        !request.signal.aborted &&
        started === epoch.current
      ) {
        dataRef.current = next;
        setData(next);
      }
    } catch (e) {
      if (
        mounted.current &&
        !request.signal.aborted &&
        started === epoch.current
      )
        setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      if (mounted.current && requestRef.current === request) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void load();
    const id = location.hash.slice(1);
    if (tabs.some((t) => t.id === id)) setTab(id as Tab);
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    const timer = setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      mounted.current = false;
      requestRef.current?.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  function choose(t: Tab) {
    setTab(t);
    location.hash = t;
    setMenu(false);
    setError("");
    setFilter("");
  }
  function commit(update: (current: AdminData) => AdminData) {
    if (!mounted.current) return;
    const next = update(dataRef.current);
    if (preview) localStorage.setItem(PREVIEW_KEY, JSON.stringify(next));
    dataRef.current = next;
    setData(next);
  }
  function beginMutation() {
    if (mutationBusy.current) return false;
    mutationBusy.current = true;
    epoch.current += 1;
    requestRef.current?.abort();
    setLoading(false);
    return true;
  }
  async function saveProduct(p: Product) {
    if (!beginMutation()) return;
    setSaving(true);
    setError("");
    try {
      const valid = productSchema.parse(p);
      if (valid.stock !== null && valid.stock < valid.reserved)
        throw new Error("Stock cannot be lower than the reserved quantity.");
      const saved = preview
        ? { ...valid, version: valid.version + 1 }
        : await apiRequest<Product>("/api/admin/products", {
            method: "PUT",
            body: JSON.stringify(valid),
          });
      if (!mounted.current) return;
      commit((current) => ({
        ...current,
        products: current.products.some((x) => x.id === saved.id)
          ? current.products.map((x) => (x.id === saved.id ? saved : x))
          : [...current.products, saved],
      }));
      setEditing(null);
      setNotice(
        preview
          ? "Product draft saved on this device."
          : "Product and stock updated.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check the product details.");
    } finally {
      mutationBusy.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  async function saveSettings(p: SiteSettings) {
    if (!beginMutation()) return;
    setSaving(true);
    setError("");
    try {
      const valid = settingsSchema.parse(p);
      const saved = preview
        ? { ...valid, version: valid.version + 1 }
        : await apiRequest<SiteSettings>("/api/admin/settings", {
            method: "PUT",
            body: JSON.stringify(valid),
          });
      if (!mounted.current) return;
      commit((current) => ({ ...current, settings: saved }));
      setNotice(
        preview
          ? "Website draft saved on this device."
          : "Website settings updated.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check the website details.");
    } finally {
      mutationBusy.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  async function status(type: "quote" | "order", id: string, value: string) {
    if (!beginMutation()) return;
    setSaving(true);
    setError("");
    try {
      if (!preview)
        await apiRequest("/api/admin/records", {
          method: "PATCH",
          body: JSON.stringify({ type, id, status: value }),
        });
      if (!mounted.current) return;
      commit((current) =>
        type === "quote"
          ? {
              ...current,
              quotes: current.quotes.map((q) =>
                q.id === id ? { ...q, status: value as Quote["status"] } : q,
              ),
            }
          : {
              ...current,
              orders: current.orders.map((o) =>
                o.id === id ? { ...o, status: value as OrderStatus } : o,
              ),
            },
      );
      setNotice("Status updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status could not be saved.");
    } finally {
      mutationBusy.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  async function upload(file: File, alt: string) {
    if (!beginMutation()) return;
    setUploadBusy(true);
    setError("");
    try {
      if (file.size > MAX_IMAGE_BYTES)
        throw new Error("Choose a JPEG, PNG or WebP image smaller than 4 MB.");
      if (preview)
        throw new Error(
          "Connect Neon and administrator access to upload shared images. You can arrange the supplied images now.",
        );
      const form = new FormData();
      form.set("file", file);
      form.set("alt", alt);
      const asset = await apiRequest<MediaAsset>("/api/admin/media", {
        method: "POST",
        body: form,
      });
      if (!mounted.current) return;
      commit((current) => ({ ...current, media: [...current.media, asset] }));
      setNotice("Image added to the library.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      mutationBusy.current = false;
      if (mounted.current) setUploadBusy(false);
    }
  }
  const filtered = data.products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      [p.title, p.id, p.category]
        .join(" ")
        .toLowerCase()
        .includes(filter.toLowerCase()),
  );
  const activeTab = tabs.find((t) => t.id === tab)!;
  const Sidebar = () => (
    <>
      <Box px="7" pt="10" pb="9">
        <chakra.a href="/" display="flex" gap="3" alignItems="center">
          <Box border="1px solid" borderColor="#bba172" p="2" color="#d7bd88">
            <KeyRound size={23} strokeWidth={1.3} />
          </Box>
          <Box>
            <Text fontSize="13px" fontWeight="600" color="cream">
              Your workspace
            </Text>
            <Text
              fontSize="8px"
              letterSpacing=".15em"
              color="whiteAlpha.700"
              mt="1"
            >
              EVERY DETAIL, TAKEN CARE OF.
            </Text>
          </Box>
        </chakra.a>
        {!preview && <AdminSignOut />}
      </Box>
      <Flex
        direction="column"
        gap="2"
        px="4"
        as="nav"
        aria-label="Administration"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            h="48px"
            justifyContent="flex-start"
            gap="4"
            px="5"
            bg={tab === id ? "#385346" : "transparent"}
            color={tab === id ? "white" : "whiteAlpha.700"}
            rounded="2px"
            fontSize="11px"
            fontWeight={tab === id ? "600" : "400"}
            _hover={{ bg: "#385346" }}
            onClick={() => choose(id)}
          >
            <Icon size={17} strokeWidth={1.4} />
            {label}
            {id === "enquiries" &&
              data.quotes.filter((q) => q.status === "new").length > 0 && (
                <Badge ml="auto" bg="brass" color="white" rounded="full">
                  {data.quotes.filter((q) => q.status === "new").length}
                </Badge>
              )}
          </Button>
        ))}
      </Flex>
      <Box mt="auto" p="7">
        <Box border="1px solid" borderColor="whiteAlpha.200" p="4">
          <Smartphone size={22} strokeWidth={1.2} />
          <Text fontSize="11px" mt="4">
            Your business, in your pocket.
          </Text>
          <Button
            variant="plain"
            color="#d7bd88"
            fontSize="10px"
            px="0"
            mt="2"
            onClick={() => setInstall(true)}
          >
            Use on your iPhone <ArrowUpRight size={12} />
          </Button>
        </Box>
        <chakra.a
          href="/"
          target="_blank"
          display="flex"
          alignItems="center"
          gap="3"
          fontSize="10px"
          mt="7"
          color="whiteAlpha.700"
        >
          Open the website <ExternalLink size={13} />
        </chakra.a>
      </Box>
    </>
  );
  return (
    <Flex minH="100dvh" bg="cream">
      <Flex
        direction="column"
        w="248px"
        bg="forest"
        color="white"
        position="fixed"
        top="0"
        bottom="0"
        left="0"
        display={{ base: "none", lg: "flex" }}
      >
        <Sidebar />
      </Flex>
      <Box
        flex="1"
        ml={{ base: "0", lg: "248px" }}
        minW="0"
        pb={{ base: "95px", lg: "0" }}
      >
        <Flex
          bg="paper"
          borderBottom="1px solid"
          borderColor="line"
          px={{ base: "5", md: "10" }}
          h="76px"
          align="center"
          justify="space-between"
        >
          <Flex gap="3" align="center">
            <IconButton
              aria-label="Open administration menu"
              display={{ base: "flex", lg: "none" }}
              variant="ghost"
              size="sm"
              onClick={() => setMenu(true)}
            >
              <Menu size={21} />
            </IconButton>
            <Text fontSize="11px" color="muted">
              Workspace{" "}
              <ChevronRight
                size={11}
                style={{ display: "inline", margin: "0 10px" }}
              />
              <Box as="span" color="forest" fontWeight="600">
                {activeTab.label}
              </Box>
            </Text>
          </Flex>
          <Flex align="center" gap="3">
            <Badge
              bg={preview ? "#f0e5ce" : "sage"}
              color="forest"
              rounded="full"
              px="3"
              py="1"
              fontSize="9px"
            >
              <Box
                w="5px"
                h="5px"
                rounded="full"
                bg={preview ? "brass" : "green.600"}
                mr="1"
              />
              {preview ? "Preview workspace" : "Live workspace"}
            </Badge>
            <IconButton
              aria-label="Refresh workspace"
              variant="ghost"
              size="sm"
              loading={loading}
              onClick={() => void load()}
            >
              <RefreshCw size={16} />
            </IconButton>
            <Box
              w="32px"
              h="32px"
              display={{ base: "none", sm: "grid" }}
              placeItems="center"
              rounded="full"
              bg="sage"
              fontSize="10px"
            >
              AD
            </Box>
          </Flex>
        </Flex>
        <Box
          px={{ base: "5", md: "10" }}
          py={{ base: "7", md: "10" }}
          maxW="1500px"
          mx="auto"
        >
          {preview && (
            <Flex gap="3" bg="#eee8d9" px="4" py="3" mb="8" align="flex-start">
              <CloudOff size={17} style={{ flexShrink: 0, marginTop: 2 }} />
              <Box>
                <Text fontSize="11px" fontWeight="600">
                  Your private design preview
                </Text>
                <Text fontSize="10px" lineHeight="1.8" color="muted" mt="1">
                  Changes and enquiries are drafts on this device. Connect Neon
                  to share data across devices. Payments are disabled.
                </Text>
              </Box>
            </Flex>
          )}
          <Flex
            justify="space-between"
            align="center"
            gap="5"
            mb="8"
            flexWrap="wrap"
          >
            <Box>
              <Text fontSize="9px" color="muted" letterSpacing=".14em" mb="3">
                {new Intl.DateTimeFormat("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "Europe/London",
                })
                  .format(new Date())
                  .toUpperCase()}
              </Text>
              <Editorial as="h1" fontSize={{ base: "32px", md: "42px" }}>
                {tab === "overview"
                  ? "Your space, under control."
                  : activeTab.label + "."}
              </Editorial>
            </Box>
            {tab === "products" ? (
              <Action
                arrow={false}
                h="44px"
                onClick={() => {
                  setError("");
                  setEditing({
                    id: createId(),
                    slug: "new-piece-" + Date.now(),
                    title: "",
                    description: "",
                    category: "Living room",
                    finish: "",
                    pricePence: null,
                    stock: null,
                    reserved: 0,
                    images: [data.media[0]?.url ?? "/images/sage-living.webp"],
                    active: false,
                    featured: false,
                    version: 0,
                  });
                }}
              >
                <Plus size={16} />
                Add product
              </Action>
            ) : tab === "overview" ? (
              <Button
                h="44px"
                fontSize="11px"
                variant="outline"
                borderColor="line"
                rounded="0"
                onClick={() => choose("website")}
              >
                Manage website <ArrowUpRight size={14} />
              </Button>
            ) : null}
          </Flex>
          {error && (
            <Flex
              role="alert"
              bg="red.50"
              color="red.800"
              p="4"
              mb="6"
              align="flex-start"
              gap="3"
            >
              <TriangleAlert size={17} />
              <Text flex="1" fontSize="12px" lineHeight="1.8">
                {error}
              </Text>
              <IconButton
                size="xs"
                variant="ghost"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={14} />
              </IconButton>
            </Flex>
          )}
          {tab === "overview" && (
            <>
              <Grid
                templateColumns={{ base: "1fr 1fr", xl: "repeat(4,1fr)" }}
                gap={{ base: "3", md: "5" }}
                mb="8"
              >
                {[
                  {
                    t: "Products in collection",
                    v: data.products.filter((p) => p.active).length,
                    icon: Package,
                    s: data.products.length + " total products",
                  },
                  {
                    t: "Awaiting stock details",
                    v: data.products.filter((p) => p.stock === null).length,
                    icon: TriangleAlert,
                    s: "Confirm quantities to sell online",
                  },
                  {
                    t: "New enquiries",
                    v: data.quotes.filter((q) => q.status === "new").length,
                    icon: Inbox,
                    s: "Ready for a personal response",
                  },
                  {
                    t: "Paid orders",
                    v: data.orders.filter((o) =>
                      [
                        "paid",
                        "processing",
                        "dispatched",
                        "delivered",
                      ].includes(o.status),
                    ).length,
                    icon: ShoppingBag,
                    s: preview
                      ? "No live payments connected"
                      : "Verified by Stripe",
                  },
                ].map(({ t, v, icon: Icon, s }) => (
                  <Box
                    key={t}
                    bg="paper"
                    p={{ base: "4", md: "6" }}
                    border="1px solid"
                    borderColor="line"
                  >
                    <Flex justify="space-between" align="center">
                      <Text fontSize="10px" color="muted">
                        {t}
                      </Text>
                      <Icon size={16} strokeWidth={1.2} />
                    </Flex>
                    <Text
                      fontSize="35px"
                      fontWeight="500"
                      lineHeight="1"
                      my="5"
                    >
                      {v}
                    </Text>
                    <Text color="muted" fontSize="9px" lineHeight="1.7">
                      {s}
                    </Text>
                  </Box>
                ))}
              </Grid>
              <Grid templateColumns={{ base: "1fr", xl: "1.4fr 1fr" }} gap="6">
                <Box
                  bg="paper"
                  p={{ base: "5", md: "7" }}
                  border="1px solid"
                  borderColor="line"
                >
                  <Flex justify="space-between" align="center" mb="6">
                    <Text fontSize="13px" fontWeight="600">
                      Recent enquiries
                    </Text>
                    <Button
                      variant="plain"
                      fontSize="10px"
                      onClick={() => choose("enquiries")}
                    >
                      View all <ArrowRight size={12} />
                    </Button>
                  </Flex>
                  {data.quotes.length ? (
                    data.quotes.slice(0, 4).map((q) => (
                      <Flex
                        key={q.id}
                        py="4"
                        borderTop="1px solid"
                        borderColor="line"
                        align="center"
                        justify="space-between"
                        gap="3"
                      >
                        <Box>
                          <Text fontSize="12px">{q.name}</Text>
                          <Text fontSize="10px" color="muted" mt="1">
                            {q.propertyType} · {q.postcode}
                          </Text>
                        </Box>
                        <Status value={q.status} />
                      </Flex>
                    ))
                  ) : (
                    <Box py="12" textAlign="center">
                      <Inbox
                        size={30}
                        strokeWidth={1}
                        style={{ margin: "0 auto" }}
                      />
                      <Text fontFamily="editorial" fontSize="25px" mt="5">
                        Room for new conversations.
                      </Text>
                      <Text fontSize="11px" color="muted" mt="3">
                        Enquiries will appear here when they arrive.
                      </Text>
                    </Box>
                  )}
                </Box>
                <Box bg="forest" color="cream" p={{ base: "6", md: "8" }}>
                  <Eyebrow color="whiteAlpha.700">A LITTLE INSPIRATION</Eyebrow>
                  <Editorial fontSize="33px">
                    A beautiful website.
                    <br />
                    Made yours.
                  </Editorial>
                  <Text
                    fontSize="11px"
                    color="whiteAlpha.800"
                    lineHeight="1.9"
                    my="6"
                  >
                    Update your collection, choose the right imagery and bring
                    every detail together.
                  </Text>
                  <Image
                    src={data.settings.heroImage}
                    alt="Current website hero"
                    h="175px"
                    w="100%"
                    objectFit="cover"
                    objectPosition="center 70%"
                  />
                  <Button
                    onClick={() => choose("website")}
                    variant="plain"
                    color="cream"
                    fontSize="11px"
                    px="0"
                    mt="5"
                  >
                    Edit your website <ArrowUpRight size={15} />
                  </Button>
                </Box>
              </Grid>
              <Box
                mt="8"
                bg="paper"
                p={{ base: "5", md: "7" }}
                border="1px solid"
                borderColor="line"
              >
                <Flex align="center" justify="space-between" gap="3" mb="5">
                  <Text fontSize="13px" fontWeight="600">
                    Ready when you are.
                  </Text>
                  <Button
                    variant="plain"
                    fontSize="10px"
                    onClick={() => choose("settings")}
                  >
                    Connection settings <ArrowUpRight size={12} />
                  </Button>
                </Flex>
                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(3,1fr)" }}
                  gap="5"
                >
                  {[
                    {
                      t: "Neon database",
                      ok: data.integrations.database,
                      s: "Shared products, stock, orders & enquiries",
                    },
                    {
                      t: "Stripe payments",
                      ok: data.integrations.stripe,
                      s: "Secure checkout & verified payment events",
                    },
                    {
                      t: "Mapbox address search",
                      ok: data.integrations.mapbox,
                      s: "Property search & location maps",
                    },
                  ].map((x) => (
                    <Flex key={x.t} gap="3" align="flex-start">
                      <Box mt="1" color={x.ok ? "green.700" : "brass"}>
                        {x.ok ? <Check size={16} /> : <Cloud size={16} />}
                      </Box>
                      <Box>
                        <Text fontSize="11px">{x.t}</Text>
                        <Text
                          fontSize="9px"
                          color="muted"
                          mt="2"
                          lineHeight="1.8"
                        >
                          {x.s}
                        </Text>
                        <Text
                          fontSize="8px"
                          letterSpacing=".05em"
                          color={x.ok ? "green.700" : "brass"}
                          mt="2"
                        >
                          {x.ok ? "CONFIGURED" : "AWAITING CONNECTION"}
                        </Text>
                      </Box>
                    </Flex>
                  ))}
                </Grid>
              </Box>
            </>
          )}
          {tab === "products" && (
            <>
              <Flex gap="4" mb="6" flexWrap="wrap">
                <Box position="relative" flex="1" minW="170px">
                  <Input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Find a product…"
                    aria-label="Search inventory"
                    bg="paper"
                    rounded="0"
                    fontSize="12px"
                    h="44px"
                  />
                </Box>
                <NativeSelect.Root w="180px">
                  <NativeSelect.Field
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Filter inventory category"
                    bg="paper"
                    rounded="0"
                    fontSize="11px"
                    h="44px"
                  >
                    {["All", ...categories].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Flex>
              <Box bg="paper" border="1px solid" borderColor="line">
                <Grid
                  display={{ base: "none", md: "grid" }}
                  templateColumns="2.3fr 1fr 1fr .9fr 50px"
                  gap="4"
                  p="5"
                  borderBottom="1px solid"
                  borderColor="line"
                  color="muted"
                  fontSize="9px"
                  letterSpacing=".08em"
                >
                  <Text>PRODUCT</Text>
                  <Text>PRICE</Text>
                  <Text>AVAILABLE / RESERVED</Text>
                  <Text>VISIBILITY</Text>
                  <Text />
                </Grid>
                {filtered.length ? (
                  filtered.map((p) => (
                    <Grid
                      key={p.id}
                      templateColumns={{
                        base: "1fr auto",
                        md: "2.3fr 1fr 1fr .9fr 50px",
                      }}
                      alignItems="center"
                      gap="4"
                      p="5"
                      borderBottom="1px solid"
                      borderColor="line"
                    >
                      <Flex gap="4" align="center" minW="0">
                        <Image
                          src={p.images[0]}
                          alt={p.title}
                          w="55px"
                          h="66px"
                          objectFit="cover"
                        />
                        <Box minW="0">
                          <Text fontSize="12px" fontWeight="600">
                            {p.title || "Untitled piece"}
                          </Text>
                          <Text fontSize="9px" color="muted" mt="2">
                            {p.category}
                          </Text>
                          <Text
                            display={{ base: "block", md: "none" }}
                            mt="2"
                            fontSize="10px"
                          >
                            {p.pricePence === null
                              ? "Price on request"
                              : money(p.pricePence)}{" "}
                            ·{" "}
                            {p.stock === null
                              ? "Stock unconfirmed"
                              : available(p) + " available"}
                          </Text>
                        </Box>
                      </Flex>
                      <Text
                        display={{ base: "none", md: "block" }}
                        fontSize="11px"
                      >
                        {p.pricePence === null
                          ? "On request"
                          : money(p.pricePence)}
                      </Text>
                      <Box display={{ base: "none", md: "block" }}>
                        <Text
                          fontSize="11px"
                          color={
                            p.stock === null
                              ? "brass"
                              : available(p) === 0
                                ? "red.700"
                                : "forest"
                          }
                        >
                          {p.stock === null
                            ? "Unconfirmed"
                            : available(p) + " / " + p.reserved}
                        </Text>
                      </Box>
                      <Box display={{ base: "none", md: "block" }}>
                        <Status value={p.active ? "published" : "draft"} />
                      </Box>
                      <IconButton
                        aria-label={"Edit " + p.title}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setError("");
                          setEditing(p);
                        }}
                      >
                        <ChevronRight size={17} />
                      </IconButton>
                    </Grid>
                  ))
                ) : (
                  <Box p="10">
                    <Empty
                      title="No pieces found"
                      description="Try another search or add your first product."
                    />
                  </Box>
                )}
              </Box>
              <Text fontSize="10px" color="muted" mt="5">
                {filtered.length} products · Unknown stock is offered by
                quotation. Archived products remain in order history.
              </Text>
            </>
          )}
          {tab === "orders" && (
            <Records
              orders={data.orders}
              onStatus={(id, value) => void status("order", id, value)}
              busy={saving}
            />
          )}
          {tab === "enquiries" && (
            <Enquiries
              quotes={data.quotes}
              onStatus={(id, value) => void status("quote", id, value)}
              busy={saving}
            />
          )}
          {tab === "images" && (
            <MediaLibrary
              media={data.media}
              upload={upload}
              busy={uploadBusy}
              preview={preview}
            />
          )}
          {tab === "website" && (
            <WebsiteEditor
              key={data.settings.version}
              settings={data.settings}
              media={data.media}
              onSave={saveSettings}
              busy={saving}
              preview={preview}
            />
          )}
          {tab === "settings" && (
            <Connections
              data={data}
              onInstall={() => setInstall(true)}
              onReset={() => {
                if (!preview) return;
                localStorage.removeItem(PREVIEW_KEY);
                void load();
                setNotice("Preview drafts reset.");
              }}
            />
          )}
        </Box>
      </Box>
      <Flex
        display={{ base: "flex", lg: "none" }}
        bg="paper"
        borderTop="1px solid"
        borderColor="line"
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        zIndex="40"
        justify="space-around"
        pt="2"
        pb="max(12px, env(safe-area-inset-bottom))"
      >
        {tabs
          .filter((t) =>
            ["overview", "products", "orders", "enquiries", "images"].includes(
              t.id,
            ),
          )
          .map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant="plain"
              rounded="0"
              color={tab === id ? "forest" : "muted"}
              px="1"
              h="52px"
              flex="1"
              display="flex"
              flexDirection="column"
              gap="2"
              fontWeight={tab === id ? "700" : "400"}
              fontSize="8px"
              onClick={() => choose(id)}
            >
              <Icon size={19} strokeWidth={tab === id ? 1.8 : 1.2} />
              {label === "Products & stock"
                ? "Stock"
                : label === "Image library"
                  ? "Images"
                  : label}
            </Button>
          ))}
      </Flex>
      <Drawer.Root
        open={menu}
        onOpenChange={(e) => setMenu(e.open)}
        placement="start"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content bg="forest" color="white" maxW="300px">
              <Sidebar />
              <Drawer.CloseTrigger asChild>
                <CloseButton
                  color="white"
                  position="absolute"
                  right="3"
                  top="3"
                />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
      {editing && (
        <ProductEditor
          key={editing.id}
          product={editing}
          media={data.media}
          onClose={() => {
            setEditing(null);
            setError("");
          }}
          onSave={saveProduct}
          busy={saving}
          error={error}
        />
      )}
      <Drawer.Root
        open={install}
        onOpenChange={(e) => setInstall(e.open)}
        placement="bottom"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content bg="cream" maxH="85dvh">
              <Drawer.Body p="8">
                <Box maxW="550px" mx="auto" py="5">
                  <Smartphone size={32} strokeWidth={1.2} />
                  <Editorial mt="6" fontSize="36px">
                    Your business, in your pocket.
                  </Editorial>
                  <Text mt="6" fontSize="13px" lineHeight="2" color="muted">
                    Open this administration page in Safari on your iPhone. Tap
                    Share, then Add to Home Screen. It opens as a dedicated
                    workspace with stock, orders, enquiries and images at your
                    fingertips.
                  </Text>
                  <Box bg="sage" p="5" mt="6">
                    <Text fontSize="11px" fontWeight="600">
                      Native iOS project included
                    </Text>
                    <Text fontSize="11px" color="muted" mt="3" lineHeight="1.9">
                      The source includes a SwiftUI iOS app using this same
                      protected workspace. Building, signing and TestFlight
                      distribution require Xcode on macOS and your Apple
                      Developer account.
                    </Text>
                  </Box>
                  <Action mt="7" onClick={() => setInstall(false)}>
                    Got it
                  </Action>
                </Box>
              </Drawer.Body>
              <Drawer.CloseTrigger asChild>
                <CloseButton position="absolute" right="4" top="4" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
      {notice && (
        <Box
          role="status"
          position="fixed"
          zIndex="100"
          bottom={{ base: "95px", lg: "7" }}
          left="50%"
          transform="translateX(-50%)"
          bg="forest"
          color="white"
          px="6"
          py="4"
          shadow="xl"
          maxW="calc(100% - 32px)"
        >
          <Flex align="center" gap="3">
            <Check size={16} />
            <Text fontSize="11px">{notice}</Text>
          </Flex>
        </Box>
      )}
    </Flex>
  );
}
function Status({ value }: { value: string }) {
  return (
    <Badge
      px="2.5"
      py="1"
      rounded="full"
      bg={
        ["published", "paid", "delivered", "closed"].includes(value)
          ? "sage"
          : value === "expired"
            ? "red.50"
            : "#eee8d9"
      }
      color="forest"
      fontSize="8px"
      fontWeight="500"
      textTransform="capitalize"
    >
      {value}
    </Badge>
  );
}
function ProductEditor({
  product,
  media,
  onClose,
  onSave,
  busy,
  error,
}: {
  product: Product;
  media: MediaAsset[];
  onClose: () => void;
  onSave: (p: Product) => void;
  busy: boolean;
  error: string;
}) {
  const [p, setP] = useState(product),
    [price, setPrice] = useState(
      product.pricePence === null ? "" : (product.pricePence / 100).toFixed(2),
    ),
    [stock, setStock] = useState(
      product.stock === null ? "" : String(product.stock),
    ),
    [localError, setLocalError] = useState("");
  function patch<K extends keyof Product>(key: K, value: Product[K]) {
    setP((x) => ({ ...x, [key]: value }));
  }
  function save(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");
    if (price !== "" && !/^\d+(?:\.\d{1,2})?$/.test(price)) {
      setLocalError("Enter a price in pounds with up to two decimal places.");
      return;
    }
    if (stock !== "" && !/^\d+$/.test(stock)) {
      setLocalError("Enter a whole number for stock.");
      return;
    }
    const next = {
      ...p,
      pricePence: price === "" ? null : Math.round(Number(price) * 100),
      stock: stock === "" ? null : Number(stock),
    };
    const valid = productSchema.safeParse(next);
    if (!valid.success) {
      setLocalError(valid.error.issues[0].message);
      return;
    }
    onSave(valid.data);
  }
  return (
    <Drawer.Root
      open
      onOpenChange={(e) => {
        if (!e.open && !busy) onClose();
      }}
      placement="end"
      size="lg"
      closeOnInteractOutside={!busy}
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content bg="cream" maxW={{ base: "100%", md: "670px" }}>
            <Drawer.Header px="7" pt="8">
              <Box>
                <Eyebrow>THE DETAILS MAKE THE DIFFERENCE</Eyebrow>
                <Editorial fontSize="33px">
                  {product.title ? "Edit your piece." : "Add something good."}
                </Editorial>
              </Box>
            </Drawer.Header>
            <Drawer.Body px="7" pb="8">
              <chakra.form id="product-form" onSubmit={save}>
                <Flex direction="column" gap="5">
                  <FormField label="Product name" required>
                    <Input
                      value={p.title}
                      onChange={(e) => {
                        patch("title", e.target.value);
                        if (product.version === 0)
                          patch(
                            "slug",
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, ""),
                          );
                      }}
                      required
                      maxLength={120}
                    />
                  </FormField>
                  <Grid templateColumns="1fr 1fr" gap="4">
                    <FormField label="Collection">
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={p.category}
                          onChange={(e) =>
                            patch(
                              "category",
                              e.target.value as Product["category"],
                            )
                          }
                        >
                          {categories.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </FormField>
                    <FormField label="Finish / material">
                      <Input
                        value={p.finish}
                        onChange={(e) => patch("finish", e.target.value)}
                        maxLength={100}
                      />
                    </FormField>
                  </Grid>
                  <FormField label="Description" required>
                    <Textarea
                      value={p.description}
                      onChange={(e) => patch("description", e.target.value)}
                      minH="120px"
                      required
                      minLength={5}
                      maxLength={3000}
                    />
                  </FormField>
                  <Grid templateColumns="1fr 1fr" gap="4">
                    <FormField label="Price (£)">
                      <Input
                        inputMode="decimal"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Price on request"
                      />
                    </FormField>
                    <FormField label="Stock on hand">
                      <Input
                        inputMode="numeric"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="Unconfirmed"
                      />
                    </FormField>
                  </Grid>
                  <Text fontSize="10px" color="muted" lineHeight="1.8">
                    Leave price or stock blank to offer this piece by quotation.
                    Reserved: {p.reserved}. Stock includes reserved units.
                  </Text>
                  <FormField label="Page address">
                    <Input
                      value={p.slug}
                      onChange={(e) => patch("slug", e.target.value)}
                      required
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    />
                  </FormField>
                  <Box>
                    <Text fontSize="10px" fontWeight="600" mb="3">
                      Product photographs · first image is the cover
                    </Text>
                    <Flex gap="3" mb="4" overflowX="auto">
                      {p.images.map((src, i) => (
                        <Box key={src} position="relative" flexShrink="0">
                          <Image
                            src={src}
                            alt={"Selected image " + (i + 1)}
                            w="90px"
                            h="110px"
                            objectFit="cover"
                          />
                          <Flex mt="1" justify="space-between">
                            <IconButton
                              size="xs"
                              variant="ghost"
                              aria-label={"Move image " + (i + 1) + " earlier"}
                              disabled={i === 0}
                              onClick={() => {
                                const imgs = [...p.images];
                                [imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]];
                                patch("images", imgs);
                              }}
                            >
                              <ChevronLeft size={13} />
                            </IconButton>
                            <IconButton
                              size="xs"
                              variant="ghost"
                              aria-label={"Remove image " + (i + 1)}
                              onClick={() =>
                                patch(
                                  "images",
                                  p.images.filter((v) => v !== src),
                                )
                              }
                            >
                              <X size={13} />
                            </IconButton>
                          </Flex>
                        </Box>
                      ))}
                    </Flex>
                    <Grid templateColumns="repeat(4,1fr)" gap="2">
                      {media.map((m) => (
                        <chakra.button
                          key={m.id}
                          type="button"
                          border="2px solid"
                          borderColor={
                            p.images.includes(m.url) ? "forest" : "transparent"
                          }
                          position="relative"
                          onClick={() =>
                            patch(
                              "images",
                              p.images.includes(m.url)
                                ? p.images.filter((u) => u !== m.url)
                                : p.images.length < 12
                                  ? [...p.images, m.url]
                                  : p.images,
                            )
                          }
                          aria-label={"Select " + m.name}
                          aria-pressed={p.images.includes(m.url)}
                        >
                          <Image
                            src={m.url}
                            alt={m.alt}
                            w="100%"
                            h="85px"
                            objectFit="cover"
                          />
                          {p.images.includes(m.url) && (
                            <Box
                              position="absolute"
                              right="1"
                              top="1"
                              bg="forest"
                              color="white"
                              p=".5"
                            >
                              <Check size={11} />
                            </Box>
                          )}
                        </chakra.button>
                      ))}
                    </Grid>
                    <Text fontSize="9px" color="muted" mt="3">
                      Upload more photos in the Image library. Choose up to 12
                      images.
                    </Text>
                  </Box>
                  <Flex gap="7" py="4">
                    <Toggle
                      label="Published"
                      checked={p.active}
                      onChange={(v) => patch("active", v)}
                    />
                    <Toggle
                      label="Featured"
                      checked={p.featured}
                      onChange={(v) => patch("featured", v)}
                    />
                  </Flex>
                  {(localError || error) && (
                    <Text role="alert" fontSize="12px" color="red.700">
                      {localError || error}
                    </Text>
                  )}
                </Flex>
              </chakra.form>
            </Drawer.Body>
            <Drawer.Footer
              px="7"
              py="5"
              borderTop="1px solid"
              borderColor="line"
            >
              <Button
                variant="ghost"
                rounded="0"
                onClick={onClose}
                disabled={busy}
                fontSize="12px"
              >
                Cancel
              </Button>
              <Action
                form="product-form"
                type="submit"
                loading={busy}
                arrow={false}
              >
                <Save size={15} />
                Save product
              </Action>
            </Drawer.Footer>
            <Drawer.CloseTrigger asChild>
              <CloseButton
                position="absolute"
                top="4"
                right="4"
                disabled={busy}
              />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={(e) => onChange(e.checked)}
      colorPalette="green"
      size="sm"
      disabled={disabled}
    >
      <Switch.HiddenInput />
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Switch.Label fontSize="11px">{label}</Switch.Label>
    </Switch.Root>
  );
}
function Records({
  orders,
  onStatus,
  busy,
}: {
  orders: Order[];
  onStatus: (id: string, value: string) => void;
  busy: boolean;
}) {
  if (!orders.length)
    return (
      <Empty
        title="Ready for your first order."
        description="Verified orders will appear here once Stripe payments are connected. No sample transactions are included."
      />
    );
  const transitions: Partial<Record<OrderStatus, OrderStatus>> = {
    paid: "processing",
    processing: "dispatched",
    dispatched: "delivered",
  };
  return (
    <Flex direction="column" gap="5">
      {orders.map((o) => (
        <Box key={o.id} bg="paper" p="6" border="1px solid" borderColor="line">
          <Flex justify="space-between" gap="4" flexWrap="wrap">
            <Box>
              <Text fontSize="13px" fontWeight="600">
                Order {o.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text fontSize="11px" color="muted" mt="2">
                {o.email} · {new Date(o.createdAt).toLocaleDateString("en-GB")}
              </Text>
            </Box>
            <Flex align="center" gap="4">
              <Text fontSize="14px">{money(o.totalPence)}</Text>
              <Status value={o.status} />
            </Flex>
          </Flex>
          <Flex direction="column" gap="3" py="5">
            {o.items.map((i) => (
              <Flex key={i.productId} justify="space-between" fontSize="11px">
                <Text>
                  {i.quantity} × {i.title}
                </Text>
                <Text>{money(i.pricePence * i.quantity)}</Text>
              </Flex>
            ))}
          </Flex>
          {transitions[o.status] && (
            <Button
              size="sm"
              fontSize="11px"
              rounded="0"
              bg="forest"
              color="white"
              disabled={busy}
              onClick={() => onStatus(o.id, transitions[o.status]!)}
            >
              Mark as {transitions[o.status]} <ArrowRight size={13} />
            </Button>
          )}
        </Box>
      ))}
    </Flex>
  );
}
function Enquiries({
  quotes,
  onStatus,
  busy,
}: {
  quotes: Quote[];
  onStatus: (id: string, value: string) => void;
  busy: boolean;
}) {
  const [filter, setFilter] = useState("all");
  const results = quotes.filter((q) => filter === "all" || q.status === filter);
  return (
    <>
      <Flex gap="2" mb="6" flexWrap="wrap">
        {["all", "new", "contacted", "quoted", "closed"].map((s) => (
          <Button
            size="sm"
            rounded="0"
            key={s}
            bg={filter === s ? "forest" : "transparent"}
            color={filter === s ? "white" : "forest"}
            fontSize="11px"
            textTransform="capitalize"
            onClick={() => setFilter(s)}
          >
            {s}
          </Button>
        ))}
      </Flex>
      {results.length ? (
        <Flex direction="column" gap="5">
          {results.map((q) => (
            <Box
              key={q.id}
              bg="paper"
              border="1px solid"
              borderColor="line"
              p="6"
            >
              <Flex justify="space-between" gap="4" flexWrap="wrap">
                <Box>
                  <Text fontFamily="editorial" fontSize="26px">
                    {q.name}
                  </Text>
                  <Text fontSize="11px" color="muted" mt="2">
                    {q.propertyType} ·{" "}
                    {q.bedrooms === 0 ? "Studio" : q.bedrooms + " bedrooms"} ·{" "}
                    {q.postcode}
                  </Text>
                </Box>
                <Status value={q.status} />
              </Flex>
              <Text
                fontSize="12px"
                lineHeight="1.9"
                my="5"
                whiteSpace="pre-wrap"
              >
                {q.message}
              </Text>
              <Flex gap="5" flexWrap="wrap" fontSize="11px">
                <chakra.a href={"mailto:" + q.email}>{q.email}</chakra.a>
                <chakra.a href={"tel:" + q.phone.replace(/\s/g, "")}>
                  {q.phone}
                </chakra.a>
              </Flex>
              <Flex mt="5" align="center" justify="space-between" gap="4">
                <Text fontSize="9px" color="muted">
                  {new Date(q.createdAt).toLocaleDateString("en-GB")} ·{" "}
                  {q.id.slice(0, 8).toUpperCase()}
                </Text>
                <NativeSelect.Root w="150px" size="sm" disabled={busy}>
                  <NativeSelect.Field
                    aria-label={"Status for " + q.name}
                    value={q.status}
                    onChange={(e) => onStatus(q.id, e.target.value)}
                    fontSize="11px"
                    rounded="0"
                  >
                    {["new", "contacted", "quoted", "closed"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Flex>
            </Box>
          ))}
        </Flex>
      ) : (
        <Empty
          title="Room for new conversations."
          description={
            filter === "all"
              ? "Enquiries from your website will appear here."
              : "There are no enquiries with this status."
          }
        />
      )}
    </>
  );
}
function MediaLibrary({
  media,
  upload,
  busy,
  preview,
}: {
  media: MediaAsset[];
  upload: (file: File, alt: string) => void;
  busy: boolean;
  preview: boolean;
}) {
  const [file, setFile] = useState<File | null>(null),
    [alt, setAlt] = useState("");
  return (
    <>
      <Box
        bg="paper"
        border="1px solid"
        borderColor="line"
        p={{ base: "5", md: "7" }}
        mb="8"
      >
        <Flex gap="4" align="center" mb="5">
          <Upload size={22} strokeWidth={1.2} />
          <Box>
            <Text fontSize="13px" fontWeight="600">
              Make it yours.
            </Text>
            <Text fontSize="10px" color="muted" mt="2">
              Upload JPEG, PNG or WebP images, up to 4 MB each. Add a
              description for accessibility.
            </Text>
          </Box>
        </Flex>
        <Grid
          templateColumns={{ base: "1fr", md: "1fr 1fr auto" }}
          gap="4"
          alignItems="end"
        >
          <FormField label="Choose a photograph">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              p="2"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </FormField>
          <FormField label="Image description">
            <Input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the room or product"
              maxLength={200}
            />
          </FormField>
          <Action
            h="46px"
            arrow={false}
            loading={busy}
            disabled={!file || alt.trim().length < 3}
            onClick={() => {
              if (file) upload(file, alt);
            }}
          >
            <Upload size={15} />
            Upload image
          </Action>
        </Grid>
        {preview && (
          <Text fontSize="10px" mt="4" color="muted">
            Shared uploads require Neon and administrator access. The supplied
            photographs are ready to assign to products and your homepage.
          </Text>
        )}
      </Box>
      <Grid
        templateColumns={{
          base: "1fr 1fr",
          md: "repeat(3,1fr)",
          xl: "repeat(4,1fr)",
        }}
        gap="5"
      >
        {media.map((m) => (
          <Box key={m.id} bg="paper" border="1px solid" borderColor="line">
            <Image
              src={m.url}
              alt={m.alt}
              h={{ base: "190px", md: "230px" }}
              w="100%"
              objectFit="cover"
            />
            <Box p="4">
              <Text fontSize="11px" fontWeight="600">
                {m.name}
              </Text>
              <Text fontSize="9px" color="muted" lineHeight="1.8" mt="2">
                {m.alt}
              </Text>
            </Box>
          </Box>
        ))}
      </Grid>
    </>
  );
}
function WebsiteEditor({
  settings,
  media,
  onSave,
  busy,
  preview,
}: {
  settings: SiteSettings;
  media: MediaAsset[];
  onSave: (p: SiteSettings) => void;
  busy: boolean;
  preview: boolean;
}) {
  const [s, setS] = useState(settings),
    [delivery, setDelivery] = useState(
      settings.deliveryFeePence === null
        ? ""
        : (settings.deliveryFeePence / 100).toFixed(2),
    ),
    [error, setError] = useState("");
  function patch<K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) {
    setS((x) => ({ ...x, [k]: v }));
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (delivery !== "" && !/^\d+(?:\.\d{1,2})?$/.test(delivery)) {
      setError("Enter a valid delivery fee in pounds.");
      return;
    }
    onSave({
      ...s,
      deliveryFeePence:
        delivery === "" ? null : Math.round(Number(delivery) * 100),
    });
  }
  return (
    <chakra.form onSubmit={submit}>
      <Grid templateColumns={{ base: "1fr", xl: "1.25fr .85fr" }} gap="7">
        <Box
          bg="paper"
          border="1px solid"
          borderColor="line"
          p={{ base: "5", md: "7" }}
        >
          <Eyebrow>YOUR HOMEPAGE</Eyebrow>
          <Flex direction="column" gap="5">
            <FormField label="Main headline" required>
              <Textarea
                value={s.heroTitle}
                onChange={(e) => patch("heroTitle", e.target.value)}
                maxLength={120}
                required
                minH="100px"
              />
            </FormField>
            <FormField label="Introduction" required>
              <Textarea
                value={s.heroSubtitle}
                onChange={(e) => patch("heroSubtitle", e.target.value)}
                maxLength={400}
                required
                minH="120px"
              />
            </FormField>
            <Text fontSize="10px" fontWeight="600">
              Cover photograph
            </Text>
            <Grid templateColumns="repeat(3,1fr)" gap="3">
              {media.map((m) => (
                <chakra.button
                  key={m.id}
                  type="button"
                  border="2px solid"
                  borderColor={s.heroImage === m.url ? "forest" : "transparent"}
                  onClick={() => patch("heroImage", m.url)}
                  aria-label={"Use " + m.name + " as cover"}
                  aria-pressed={s.heroImage === m.url}
                >
                  <Image
                    src={m.url}
                    alt={m.alt}
                    w="100%"
                    h="120px"
                    objectFit="cover"
                  />
                </chakra.button>
              ))}
            </Grid>
          </Flex>
        </Box>
        <Flex direction="column" gap="7">
          <Box bg="paper" border="1px solid" borderColor="line" p="6">
            <Eyebrow>LET’S STAY CONNECTED</Eyebrow>
            <Flex direction="column" gap="5">
              <FormField label="Landline" required>
                <Input
                  type="tel"
                  value={s.phone}
                  onChange={(e) => patch("phone", e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Mobile" required>
                <Input
                  type="tel"
                  value={s.mobile}
                  onChange={(e) => patch("mobile", e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Instagram URL" required>
                <Input
                  type="url"
                  value={s.instagram}
                  onChange={(e) => patch("instagram", e.target.value)}
                  required
                />
              </FormField>
            </Flex>
          </Box>
          <Box bg="paper" border="1px solid" borderColor="line" p="6">
            <Eyebrow>DELIVERY & PAYMENTS</Eyebrow>
            <Flex direction="column" gap="5">
              <FormField label="Delivery information" required>
                <Textarea
                  value={s.deliveryNote}
                  onChange={(e) => patch("deliveryNote", e.target.value)}
                  required
                  maxLength={400}
                  minH="100px"
                />
              </FormField>
              <FormField label="Flat delivery fee (£)">
                <Input
                  inputMode="decimal"
                  placeholder="To be confirmed"
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                />
              </FormField>
              <Toggle
                label="Enable Stripe checkout"
                checked={s.paymentsEnabled}
                onChange={(v) => patch("paymentsEnabled", v)}
                disabled={preview}
              />
              <Text fontSize="10px" color="muted" lineHeight="1.8">
                Checkout requires priced products, confirmed stock, a delivery
                fee and configured Stripe secrets. Live payments remain disabled
                in preview mode.
              </Text>
            </Flex>
          </Box>
        </Flex>
      </Grid>
      {error && (
        <Text color="red.700" role="alert" fontSize="12px" mt="5">
          {error}
        </Text>
      )}
      <Action type="submit" loading={busy} mt="7" arrow={false}>
        <Save size={15} />
        Save website
      </Action>
    </chakra.form>
  );
}
function Connections({
  data,
  onInstall,
  onReset,
}: {
  data: AdminData;
  onInstall: () => void;
  onReset: () => void;
}) {
  const [reset, setReset] = useState(false);
  const items = [
    {
      title: "Neon PostgreSQL",
      description:
        "The shared source of truth for products, inventory, enquiries and orders.",
      ok: data.integrations.database,
      keys: ["DATABASE_URL"],
      href: "https://console.neon.tech/",
    },
    {
      title: "Stripe",
      description:
        "Hosted checkout and signed webhooks. Stock is reserved on the server and adjusted once for each verified payment.",
      ok: data.integrations.stripe,
      keys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
      href: "https://dashboard.stripe.com/",
    },
    {
      title: "Mapbox",
      description:
        "UK address search and property location maps. API tokens are kept on the server.",
      ok: data.integrations.mapbox,
      keys: ["MAPBOX_ACCESS_TOKEN"],
      href: "https://account.mapbox.com/",
    },
    {
      title: "Administrator access",
      description:
        "ChatGPT sign-in plus an explicit email allowlist protects every live administration action.",
      ok: data.integrations.admin,
      keys: ["ADMIN_EMAILS"],
      href: "",
    },
  ];
  return (
    <>
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="6">
        {items.map((x) => (
          <Box
            key={x.title}
            bg="paper"
            border="1px solid"
            borderColor="line"
            p="7"
          >
            <Flex justify="space-between" align="center" gap="4">
              <Text fontSize="16px" fontWeight="600">
                {x.title}
              </Text>
              <Badge
                bg={x.ok ? "sage" : "#eee8d9"}
                rounded="full"
                fontSize="8px"
                px="3"
                py="1"
              >
                {x.ok ? "Configured" : "Awaiting connection"}
              </Badge>
            </Flex>
            <Text fontSize="11px" color="muted" lineHeight="2" my="5">
              {x.description}
            </Text>
            {x.keys.map((k) => (
              <Box
                as="code"
                key={k}
                display="block"
                bg="cream"
                p="3"
                mb="2"
                fontSize="10px"
              >
                {k}
              </Box>
            ))}
            {x.href && (
              <chakra.a
                href={x.href}
                target="_blank"
                rel="noreferrer"
                display="inline-flex"
                alignItems="center"
                gap="2"
                mt="4"
                fontSize="10px"
              >
                Open provider dashboard <ExternalLink size={12} />
              </chakra.a>
            )}
          </Box>
        ))}
      </Grid>
      <Box p="7" bg="sage" mt="7">
        <Text fontSize="13px" fontWeight="600">
          Your keys belong in secure hosting settings.
        </Text>
        <Text fontSize="11px" color="muted" lineHeight="2" mt="4">
          Configure the named variables as secrets, apply the included Neon
          schema, then redeploy to activate the connection. The image bucket is{" "}
          {data.integrations.media ? "configured" : "awaiting connection"}.
          Secrets are never requested or stored in this browser.
        </Text>
        <Text fontSize="10px" mt="4">
          Stripe webhook: <Box as="code">/api/stripe/webhook</Box> · Events:
          checkout.session.completed, checkout.session.expired
        </Text>
      </Box>
      <Flex gap="4" mt="7" flexWrap="wrap">
        <Button
          fontSize="11px"
          rounded="0"
          variant="outline"
          borderColor="line"
          onClick={onInstall}
        >
          <Smartphone size={16} />
          Use on iPhone
        </Button>
        {data.mode === "preview" && (
          <Button
            fontSize="11px"
            rounded="0"
            variant="outline"
            borderColor={reset ? "red.300" : "line"}
            color={reset ? "red.700" : "forest"}
            onClick={() => {
              if (reset) {
                onReset();
                setReset(false);
              } else setReset(true);
            }}
          >
            {reset ? "Confirm: remove device drafts" : "Reset preview drafts"}
          </Button>
        )}
      </Flex>
      {reset && (
        <Text fontSize="10px" color="muted" mt="3">
          This removes local product, website and enquiry drafts. Live data is
          unaffected.
        </Text>
      )}
    </>
  );
}
