"use client";
import { createId } from "@/lib/uuid";
import { useEffect, useState } from "react";
import {
  chakra,
  Box,
  Flex,
  Grid,
  Text,
  Heading,
  Button,
  IconButton,
  Image,
  Input,
  NativeSelect,
  Accordion,
  Drawer,
  Portal,
  CloseButton,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  ShoppingBag,
  Menu,
  Phone,
  Camera,
  Truck,
  PackageCheck,
  House,
  KeyRound,
  Armchair,
  Check,
  Plus,
  Minus,
  X,
  WashingMachine,
  Heart,
  MapPin,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Wrap, Eyebrow, Editorial, Action, TextLink, Empty } from "./design";
import { useCatalog, useCart, apiRequest, RequestError } from "@/lib/client";
import {
  categories,
  available,
  money,
  type Bootstrap,
  type Product,
  type CartLine,
} from "@/lib/domain";
import { QuoteForm } from "./quote-form";
export type PublicPage =
  | "home"
  | "shop"
  | "packages"
  | "spaces"
  | "about"
  | "contact"
  | "cart"
  | "product";
const nav = [
  ["/shop", "Furniture & appliances"],
  ["/packages", "Furniture packs"],
  ["/spaces", "Our spaces"],
  ["/about", "Our approach"],
];
export function Storefront({
  initial,
  page = "home",
  slug,
}: {
  initial: Bootstrap;
  page?: PublicPage;
  slug?: string;
}) {
  const { data, loading, refresh } = useCatalog(initial),
    cart = useCart();
  const [menu, setMenu] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(""),
    [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(id);
  }, [toast]);
  function add(p: Product) {
    cart.add(p.id, available(p) ?? 50);
    setToast(p.title + " added to your selection");
  }
  const product = slug ? data.products.find((p) => p.slug === slug) : undefined;
  return (
    <Box overflowX="clip">
      <chakra.a
        href="#main"
        position="fixed"
        top="-50px"
        left="4"
        zIndex="100"
        bg="forest"
        color="white"
        p="3"
        _focus={{ top: "3" }}
      >
        Skip to content
      </chakra.a>
      <Box bg="forest" color="white" fontSize="9px" letterSpacing=".07em">
        <Wrap>
          <Flex minH="32px" align="center" justify="space-between">
            <Text>THOUGHTFULLY FURNISHED. PERSONALLY TAKEN CARE OF.</Text>
            <chakra.a
              href={"tel:" + data.settings.phone.replace(/\s/g, "")}
              display={{ base: "none", sm: "flex" }}
              alignItems="center"
              gap="2"
            >
              <Phone size={10} />
              {data.settings.phone}
            </chakra.a>
          </Flex>
        </Wrap>
      </Box>
      <Box
        as="header"
        bg="cream"
        borderBottom="1px solid"
        borderColor="line"
        position="sticky"
        top="0"
        zIndex="30"
      >
        <Wrap>
          <Flex
            h={{ base: "76px", md: "94px" }}
            align="center"
            justify="space-between"
            gap="5"
          >
            <Brand />
            <Flex
              as="nav"
              aria-label="Main navigation"
              gap={{ md: "5", xl: "8" }}
              display={{ base: "none", lg: "flex" }}
              align="center"
            >
              {nav.map(([href, label]) => (
                <chakra.a
                  key={href}
                  href={href}
                  fontSize="11px"
                  fontWeight="600"
                  py="2"
                  borderBottom="1px solid"
                  borderColor={"/" + page === href ? "forest" : "transparent"}
                  _hover={{ borderColor: "forest" }}
                >
                  {label}
                </chakra.a>
              ))}
            </Flex>
            <Flex gap={{ base: "1", md: "4" }} align="center">
              <Box display={{ base: "none", xl: "block" }}>
                <TextLink href="/contact">Let’s talk</TextLink>
              </Box>
              <IconButton
                aria-label="Search furniture"
                variant="ghost"
                size="sm"
                onClick={() => setSearch(!search)}
              >
                <Search size={19} />
              </IconButton>
              <chakra.a
                href="/cart"
                position="relative"
                p="2"
                aria-label={"Your selection, " + cart.count + " items"}
              >
                <ShoppingBag size={19} />
                {cart.count > 0 && (
                  <Box
                    position="absolute"
                    top="-1"
                    right="-1"
                    minW="16px"
                    h="16px"
                    bg="brass"
                    color="white"
                    rounded="full"
                    fontSize="9px"
                    textAlign="center"
                    lineHeight="16px"
                  >
                    {cart.count}
                  </Box>
                )}
              </chakra.a>
              <IconButton
                aria-label="Open navigation"
                display={{ base: "flex", lg: "none" }}
                size="sm"
                variant="ghost"
                onClick={() => setMenu(true)}
              >
                <Menu size={22} />
              </IconButton>
            </Flex>
          </Flex>
        </Wrap>
        {search && (
          <Wrap py="5" borderTop="1px solid" borderColor="line">
            <chakra.form action="/shop">
              <Flex gap="3">
                <Input
                  autoFocus
                  name="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What are you looking for?"
                  aria-label="Search products"
                  bg="paper"
                  borderRadius="0"
                />
                <Button
                  type="submit"
                  bg="forest"
                  color="white"
                  borderRadius="0"
                >
                  Search
                </Button>
                <IconButton
                  aria-label="Close search"
                  variant="ghost"
                  onClick={() => setSearch(false)}
                >
                  <X size={18} />
                </IconButton>
              </Flex>
            </chakra.form>
          </Wrap>
        )}
      </Box>
      <Drawer.Root
        open={menu}
        onOpenChange={(e) => setMenu(e.open)}
        placement="end"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content bg="cream">
              <Drawer.Header>
                <Brand />
              </Drawer.Header>
              <Drawer.Body>
                <Flex direction="column" gap="7" py="8">
                  {[
                    ...nav,
                    ["/contact", "Get in touch"],
                    ["/admin", "Administration"],
                  ].map(([href, label]) => (
                    <chakra.a
                      key={href}
                      href={href}
                      fontFamily="editorial"
                      fontSize="28px"
                    >
                      {label}
                    </chakra.a>
                  ))}
                </Flex>
                <Text color="muted" fontSize="sm">
                  A little less to do. A lot more to come home to.
                </Text>
              </Drawer.Body>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" position="absolute" right="4" top="4" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
      {data.error && (
        <Wrap py="4">
          <Flex bg="orange.50" p="4" gap="4" align="center" role="alert">
            <Text fontSize="sm" flex="1">
              {data.error}
            </Text>
            <Button size="sm" loading={loading} onClick={() => void refresh()}>
              Retry
            </Button>
          </Flex>
        </Wrap>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FurnitureStore",
            name: "Landlord Solutions",
            url: data.siteUrl,
            telephone: data.settings.phone,
            areaServed: { "@type": "City", name: "Glasgow" },
            image: data.settings.heroImage,
            sameAs: [data.settings.instagram],
            description:
              "Furniture, appliances and complete property furnishing in Glasgow.",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <Box as="main" id="main">
        {page === "home" && <Home data={data} onAdd={add} />}
        {page === "shop" && <Shop data={data} onAdd={add} />}
        {page === "packages" && <Packages />}
        {page === "spaces" && <Spaces />}
        {page === "about" && <About />}
        {page === "contact" && <Contact data={data} />}
        {page === "cart" && (
          <Cart
            data={data}
            lines={cart.lines}
            ready={cart.ready}
            onQuantity={cart.quantity}
          />
        )}
        {page === "product" &&
          (product ? (
            <ProductDetail p={product} onAdd={add} />
          ) : (
            <Wrap py="20">
              <Empty
                title="This piece is currently unavailable"
                description="Explore the rest of the collection or ask our team for a similar option."
              >
                <TextLink href="/shop">Explore the collection</TextLink>
              </Empty>
            </Wrap>
          ))}
      </Box>
      <Footer data={data} />
      {toast && (
        <Box
          position="fixed"
          bottom={{ base: "6", md: "8" }}
          left="50%"
          transform="translateX(-50%)"
          zIndex="50"
          maxW="calc(100% - 32px)"
          bg="forest"
          color="white"
          px="6"
          py="4"
          shadow="xl"
          role="status"
        >
          <Flex align="center" gap="3">
            <Check size={16} />
            <Text fontSize="12px">{toast}</Text>
            <chakra.a
              href="/cart"
              fontSize="11px"
              textDecoration="underline"
              whiteSpace="nowrap"
            >
              View selection
            </chakra.a>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
export function Brand() {
  return (
    <chakra.a
      href="/"
      display="flex"
      alignItems="center"
      gap="3"
      flexShrink="0"
      aria-label="Home"
    >
      <Box color="brass" position="relative">
        <House size={37} strokeWidth={1.25} />
        <KeyRound
          size={17}
          strokeWidth={1.5}
          style={{
            position: "absolute",
            left: 10,
            top: 15,
            background: "#f7f5ef",
          }}
        />
      </Box>
      <Box>
        <Text
          fontSize={{ base: "12px", md: "14px" }}
          fontWeight="800"
          letterSpacing=".055em"
          lineHeight="1.1"
        >
          LANDLORD
        </Text>
        <Text
          fontSize={{ base: "10px", md: "11px" }}
          letterSpacing=".19em"
          fontWeight="500"
          mt="1"
        >
          SOLUTIONS
        </Text>
        <Text fontSize="7px" letterSpacing=".24em" color="muted" mt="1">
          GLASGOW & BEYOND
        </Text>
      </Box>
    </chakra.a>
  );
}
function Reveal({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55 }}
    >
      {children}
    </motion.div>
  );
}
function Home({
  data,
  onAdd,
}: {
  data: Bootstrap;
  onAdd: (p: Product) => void;
}) {
  return (
    <>
      <Grid
        templateColumns={{ base: "1fr", md: "1fr 1.05fr" }}
        maxW="1600px"
        mx="auto"
        minH={{ md: "655px" }}
      >
        <Flex
          direction="column"
          justify="center"
          align="flex-start"
          px={{ base: "6", md: "10", xl: "64px" }}
          pt={{ base: "10", md: "20" }}
          pb={{ base: "10", md: "20" }}
          position="relative"
        >
          <Eyebrow>
            <Box
              as="span"
              display="inline-block"
              w="19px"
              h="1px"
              bg="brass"
              verticalAlign="middle"
              mr="3"
            />
            GOOD SPACES. GOOD PEOPLE.
          </Eyebrow>
          <Box
            as="h1"
            fontFamily="editorial"
            fontSize={{ base: "46px", sm: "66px", md: "64px", xl: "70px" }}
            lineHeight="1.03"
            letterSpacing="-.045em"
            whiteSpace="pre-line"
            maxW="570px"
          >
            {data.settings.heroTitle ===
            "Beautiful spaces.\nWithout the hard work." ? (
              <>
                Beautiful spaces.
                <br />
                <Box as="span" fontStyle="italic" color="brass">
                  Without the
                </Box>
                <br />
                hard work.
              </>
            ) : (
              data.settings.heroTitle
            )}
          </Box>
          <Text
            mt={{ base: "6", md: "7" }}
            color="muted"
            fontSize={{ base: "13px", md: "14px" }}
            lineHeight="1.95"
            maxW="370px"
          >
            {data.settings.heroSubtitle}
          </Text>
          <Flex
            gap="5"
            mt={{ base: "7", md: "9" }}
            align="center"
            flexWrap="wrap"
          >
            <Action asChild>
              <a href="/shop">Explore the collection</a>
            </Action>
            <chakra.a
              href="/packages"
              fontSize="11px"
              fontWeight="600"
              display="flex"
              gap="2"
              alignItems="center"
            >
              Furnish a property <ArrowRight size={14} />
            </chakra.a>
          </Flex>
          <Flex
            display={{ base: "none", md: "flex" }}
            mt={{ base: "10", md: "14" }}
            gap="3"
            align="center"
          >
            <Box
              w="30px"
              h="30px"
              border="1px solid"
              borderColor="line"
              rounded="full"
              display="grid"
              placeItems="center"
            >
              <KeyRound size={13} strokeWidth={1.3} />
            </Box>
            <Text fontSize="10px" color="muted">
              For landlords, hosts & people making a home.
            </Text>
          </Flex>
        </Flex>
        <Box
          position="relative"
          minH={{ base: "460px", md: "655px" }}
          bg="sage"
          overflow="hidden"
        >
          <Image
            src={data.settings.heroImage}
            alt="Warm neutral corner sofa in a thoughtfully furnished sage green living room"
            w="100%"
            h="100%"
            position="absolute"
            objectFit="cover"
            objectPosition="center 55%"
            fetchPriority="high"
          />
          <Box position="absolute" top="6" right="6" bg="cream" px="4" py="2">
            <Text fontSize="8px" letterSpacing=".16em">
              SPACES THAT FEEL LIKE HOME
            </Text>
          </Box>
          <chakra.a
            href="/spaces"
            position="absolute"
            bottom={{ base: "6", md: "8" }}
            left={{ base: "6", md: "8" }}
            right={{ base: "6", md: "8" }}
            p={{ base: "5", md: "6" }}
            bg="cream"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Text fontSize="9px" color="muted" letterSpacing=".13em" mb="2">
                THE FINISHING TOUCHES, TAKEN CARE OF.
              </Text>
              <Text
                fontFamily="editorial"
                fontSize={{ base: "23px", md: "27px" }}
              >
                From a single piece to a complete home.
              </Text>
            </Box>
            <Box
              w="40px"
              h="40px"
              flexShrink="0"
              rounded="full"
              border="1px solid"
              borderColor="line"
              display="grid"
              placeItems="center"
            >
              <ArrowUpRight size={18} />
            </Box>
          </chakra.a>
        </Box>
      </Grid>
      <TrustStrip />
      <Wrap py={{ base: "16", md: "24" }}>
        <Reveal>
          <Flex
            justify="space-between"
            align="end"
            gap="6"
            mb="10"
            flexWrap="wrap"
          >
            <Box>
              <Eyebrow>A PLACE FOR EVERYTHING</Eyebrow>
              <Editorial>
                Make room for
                <br />
                <Box as="span" fontStyle="italic">
                  better living.
                </Box>
              </Editorial>
            </Box>
            <Box maxW="310px">
              <Text color="muted" fontSize="13px" lineHeight="1.9" mb="3">
                From the first sofa to the last bedside lamp. Find pieces that
                work beautifully together.
              </Text>
              <TextLink href="/shop">Discover all collections</TextLink>
            </Box>
          </Flex>
        </Reveal>
        <Grid
          templateColumns={{ base: "1fr 1fr", md: "1.15fr 1.15fr .9fr" }}
          gap={{ base: "4", md: "6" }}
        >
          <CollectionCard
            href="/shop?category=Living+room"
            image="/images/soft-living.webp"
            title="Living room"
            subtitle="For everyday moments"
            h={{ base: "280px", md: "440px" }}
          />
          <CollectionCard
            href="/shop?category=Bedroom"
            image="/images/calm-bedroom.webp"
            title="Bedroom"
            subtitle="A softer place to land"
            h={{ base: "280px", md: "440px" }}
          />
          <Grid
            gap={{ base: "4", md: "6" }}
            gridColumn={{ base: "1 / -1", md: "auto" }}
            templateColumns={{ base: "1fr 1fr", md: "1fr" }}
          >
            <CollectionCard
              href="/shop?category=Dining"
              image="/images/oak-dining.webp"
              title="Dining"
              subtitle="Come together"
              h={{ base: "225px", md: "208px" }}
            />
            <chakra.a
              href="/shop?category=Appliances"
              bg="forest"
              color="cream"
              p={{ base: "5", md: "7" }}
              minH={{ base: "225px", md: "208px" }}
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              position="relative"
              _hover={{ bg: "forestDark" }}
            >
              <WashingMachine size={38} strokeWidth={0.9} />
              <Box>
                <Text
                  fontSize="8px"
                  letterSpacing=".12em"
                  color="whiteAlpha.700"
                  mb="2"
                >
                  EVERYDAY ESSENTIALS
                </Text>
                <Flex justify="space-between" align="center">
                  <Text
                    fontFamily="editorial"
                    fontSize={{ base: "22px", md: "26px" }}
                  >
                    Appliances
                  </Text>
                  <ArrowUpRight size={17} />
                </Flex>
              </Box>
            </chakra.a>
          </Grid>
        </Grid>
      </Wrap>
      <Box bg="sage">
        <Wrap py={{ base: "14", md: "20" }}>
          <Grid
            templateColumns={{ base: "1fr", md: "1fr 1fr" }}
            gap={{ base: "10", md: "20" }}
            alignItems="center"
          >
            <Box position="relative">
              <Image
                src="/images/calm-bedroom.webp"
                alt="A complete bedroom furnishing scheme in warm neutral tones"
                h={{ base: "380px", md: "520px" }}
                w="100%"
                objectFit="cover"
                loading="lazy"
              />
              <Box
                position="absolute"
                bottom="-5"
                right={{ base: "4", md: "-6" }}
                bg="forest"
                color="cream"
                py="6"
                px="7"
              >
                <House size={26} strokeWidth={1} />
                <Text fontFamily="editorial" fontSize="24px" mt="3">
                  One property.
                  <br />
                  Every detail.
                </Text>
              </Box>
            </Box>
            <Reveal>
              <Box py="7">
                <Eyebrow>MADE FOR LANDLORDS & HOSTS</Eyebrow>
                <Editorial>
                  Your property.
                  <br />
                  Our complete
                  <br />
                  <Box as="span" fontStyle="italic">
                    attention.
                  </Box>
                </Editorial>
                <Text
                  color="muted"
                  fontSize="13px"
                  lineHeight="2"
                  my="7"
                  maxW="370px"
                >
                  A full home to furnish? A rental to refresh? Bring everything
                  together with a tailored furniture pack, without the endless
                  shopping lists.
                </Text>
                <Flex direction="column" gap="4" mb="9">
                  {[
                    "Furniture & appliance supply",
                    "Serviced accommodation set-ups",
                    "Social housing furniture packs",
                  ].map((t) => (
                    <Flex key={t} gap="3" align="center">
                      <Check size={15} strokeWidth={1.5} />
                      <Text fontSize="12px">{t}</Text>
                    </Flex>
                  ))}
                </Flex>
                <Action asChild>
                  <a href="/packages">Find your furnishing pack</a>
                </Action>
              </Box>
            </Reveal>
          </Grid>
        </Wrap>
      </Box>
      <Wrap py={{ base: "16", md: "24" }}>
        <Flex
          justify="space-between"
          align="end"
          gap="5"
          mb="10"
          flexWrap="wrap"
        >
          <Box>
            <Eyebrow>CHOSEN WITH CARE</Eyebrow>
            <Editorial>Meet a few favourites.</Editorial>
          </Box>
          <TextLink href="/shop">View the collection</TextLink>
        </Flex>
        <Grid
          templateColumns={{ base: "1fr 1fr", md: "repeat(3,1fr)" }}
          gap={{ base: "4", md: "7" }}
        >
          {data.products
            .filter((p) => p.featured)
            .slice(0, 3)
            .map((p) => (
              <ProductCard key={p.id} p={p} onAdd={onAdd} />
            ))}
        </Grid>
      </Wrap>
      <Process />
      <Wrap py={{ base: "16", md: "24" }}>
        <Flex
          justify="space-between"
          align="end"
          mb="10"
          gap="6"
          flexWrap="wrap"
        >
          <Box>
            <Eyebrow>A LITTLE INSPIRATION</Eyebrow>
            <Editorial>
              Real spaces.
              <br />
              <Box as="span" fontStyle="italic">
                Thoughtfully finished.
              </Box>
            </Editorial>
          </Box>
          <TextLink href="/spaces">Take a closer look</TextLink>
        </Flex>
        <Grid templateColumns={{ base: "1fr", md: "1.25fr .75fr" }} gap="6">
          <chakra.a href="/spaces" position="relative" overflow="hidden">
            <Image
              src="/images/sage-living.webp"
              alt="Sage living room with neutral seating and glass coffee table"
              h={{ base: "400px", md: "530px" }}
              w="100%"
              objectFit="cover"
              objectPosition="center 65%"
              loading="lazy"
            />
            <Box
              position="absolute"
              bottom="6"
              left="6"
              bg="cream"
              px="5"
              py="3"
            >
              <Text fontSize="10px">Warm neutrals. A fresh perspective.</Text>
            </Box>
          </chakra.a>
          <chakra.a href="/spaces">
            <Image
              src="/images/oak-dining.webp"
              alt="A welcoming dining space with oak furniture"
              h={{ base: "330px", md: "440px" }}
              w="100%"
              objectFit="cover"
              loading="lazy"
            />
            <Text fontSize="10px" letterSpacing=".05em" mt="5">
              DETAILS THAT MAKE A DIFFERENCE{" "}
              <ArrowUpRight
                size={12}
                style={{ display: "inline", marginLeft: 12 }}
              />
            </Text>
          </chakra.a>
        </Grid>
      </Wrap>
      <Faq />
      <ContactBand />
    </>
  );
}
function TrustStrip() {
  const items = [
    {
      Icon: Truck,
      t: "Delivery & installation",
      sub: "Let us take care of the heavy lifting",
    },
    {
      Icon: Layers,
      t: "One complete solution",
      sub: "Furniture, appliances & finishing touches",
    },
    {
      Icon: Heart,
      t: "Personally looked after",
      sub: "A real team, from start to finish",
    },
    {
      Icon: KeyRound,
      t: "Made for your property",
      sub: "A single room or a whole new beginning",
    },
  ];
  return (
    <Box
      borderTop="1px solid"
      borderBottom="1px solid"
      borderColor="line"
      bg="paper"
    >
      <Wrap>
        <Grid
          templateColumns={{ base: "1fr 1fr", lg: "repeat(4,1fr)" }}
          py={{ base: "6", md: "8" }}
          gap={{ base: "6", md: "8" }}
        >
          {items.map(({ Icon, t, sub }) => (
            <Flex key={t} gap="4" align="center">
              <Icon size={25} strokeWidth={1} color="#8c764b" />
              <Box>
                <Text fontSize="10px" fontWeight="700">
                  {t}
                </Text>
                <Text
                  display={{ base: "none", sm: "block" }}
                  fontSize="9px"
                  color="muted"
                  mt="1.5"
                >
                  {sub}
                </Text>
              </Box>
            </Flex>
          ))}
        </Grid>
      </Wrap>
    </Box>
  );
}
function CollectionCard({
  href,
  image,
  title,
  subtitle,
  h,
}: {
  href: string;
  image: string;
  title: string;
  subtitle: string;
  h: Record<string, string>;
}) {
  return (
    <chakra.a
      href={href}
      position="relative"
      h={h}
      overflow="hidden"
      display="block"
      className="group"
    >
      <Image
        src={image}
        alt={title + " furniture collection"}
        w="100%"
        h="100%"
        objectFit="cover"
        loading="lazy"
        transition="transform .6s"
        _groupHover={{ transform: "scale(1.035)" }}
      />
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(180deg,transparent 45%,rgba(17,28,22,.75))"
      />
      <Box
        position="absolute"
        bottom={{ base: "5", md: "7" }}
        left={{ base: "4", md: "6" }}
        right={{ base: "4", md: "6" }}
        color="white"
      >
        <Text
          fontSize="8px"
          letterSpacing=".1em"
          mb="2"
          textTransform="uppercase"
        >
          {subtitle}
        </Text>
        <Flex justify="space-between" align="center">
          <Text fontFamily="editorial" fontSize={{ base: "25px", md: "31px" }}>
            {title}
          </Text>
          <ArrowUpRight size={17} />
        </Flex>
      </Box>
    </chakra.a>
  );
}
function ProductCard({
  p,
  onAdd,
}: {
  p: Product;
  onAdd: (p: Product) => void;
}) {
  const stock = available(p);
  return (
    <Box minW="0">
      <Box position="relative" bg="sage" className="group">
        <chakra.a href={"/shop/" + p.slug} display="block" overflow="hidden">
          <Image
            src={p.images[0]}
            alt={p.title + " — " + p.finish}
            h={{ base: "230px", md: "355px" }}
            w="100%"
            objectFit="cover"
            loading="lazy"
            transition="transform .5s"
            _groupHover={{ transform: "scale(1.025)" }}
          />
        </chakra.a>
        <Badge
          position="absolute"
          top="3"
          left="3"
          bg="cream"
          color="forest"
          rounded="0"
          px="2"
          py="1"
          fontSize="8px"
          fontWeight="500"
        >
          {stock === null
            ? "ENQUIRE TO ORDER"
            : stock === 0
              ? "OUT OF STOCK"
              : "AVAILABLE"}
        </Badge>
        <IconButton
          aria-label={"Add " + p.title + " to your selection"}
          position="absolute"
          bottom="3"
          right="3"
          rounded="full"
          bg="cream"
          color="forest"
          size="sm"
          disabled={stock === 0}
          onClick={() => onAdd(p)}
        >
          <Plus size={16} />
        </IconButton>
      </Box>
      <Text
        mt="4"
        fontSize="8px"
        textTransform="uppercase"
        letterSpacing=".12em"
        color="muted"
      >
        {p.category}
      </Text>
      <chakra.a href={"/shop/" + p.slug}>
        <Text
          fontFamily="editorial"
          fontSize={{ base: "21px", md: "25px" }}
          mt="1"
        >
          {p.title}
        </Text>
      </chakra.a>
      <Text fontSize="10px" color="muted" mt="2">
        {p.finish}
      </Text>
      <Text fontSize="11px" mt="3" fontWeight="600">
        {p.pricePence === null ? "Price on request" : money(p.pricePence)}
      </Text>
    </Box>
  );
}
function Process() {
  return (
    <Box bg="forest" color="cream">
      <Wrap py={{ base: "14", md: "20" }}>
        <Grid
          templateColumns={{ base: "1fr", md: ".9fr 1.6fr" }}
          gap={{ base: "10", md: "20" }}
        >
          <Box>
            <Eyebrow color="whiteAlpha.700">
              LESS TO ORGANISE. MORE TO ENJOY.
            </Eyebrow>
            <Editorial fontSize={{ base: "39px", md: "46px" }}>
              We take care
              <br />
              of everything.
              <br />
              <Box as="span" fontStyle="italic" color="#d6bd8f">
                So you don’t have to.
              </Box>
            </Editorial>
          </Box>
          <Grid
            templateColumns={{ base: "1fr", sm: "repeat(3,1fr)" }}
            gap="8"
            alignItems="center"
          >
            {[
              {
                n: "01",
                t: "Tell us your plans",
                d: "One room or an entire property. Let’s talk about your space, style and budget.",
              },
              {
                n: "02",
                t: "Make it yours",
                d: "We’ll bring together a considered selection and a clear, tailored quotation.",
              },
              {
                n: "03",
                t: "We take it from here",
                d: "Agree the details with our team, from delivery and installation to the finishing touches.",
              },
            ].map((x) => (
              <Box
                key={x.n}
                borderTop="1px solid"
                borderColor="whiteAlpha.300"
                pt="5"
              >
                <Text
                  color="#d6bd8f"
                  fontFamily="editorial"
                  fontSize="32px"
                  mb="6"
                >
                  {x.n}
                </Text>
                <Text fontSize="12px" fontWeight="600" mb="4">
                  {x.t}
                </Text>
                <Text fontSize="11px" lineHeight="2" color="whiteAlpha.800">
                  {x.d}
                </Text>
              </Box>
            ))}
          </Grid>
        </Grid>
      </Wrap>
    </Box>
  );
}
const faqs = [
  [
    "Can you furnish a complete property?",
    "Yes. We offer furniture and appliance installations, full set-ups for serviced accommodation and social housing furniture packs. Tell us the property size and what you need, and we will prepare a tailored quotation.",
  ],
  [
    "Can I order just one item?",
    "Of course. Ask about a single sofa, a bedroom set or an appliance. Current prices, specifications and availability are confirmed by our team.",
  ],
  [
    "How does delivery and installation work?",
    "Share your postcode, floor level and access details. We will confirm the delivery arrangements, installation requirements and charges before you place an order.",
  ],
  [
    "Are the photographs your own spaces?",
    "The photographs in this collection were supplied by the business. They show furnishing inspiration; exact products, finishes and accessories are confirmed in your quotation.",
  ],
];
function Faq() {
  return (
    <Wrap py={{ base: "14", md: "20" }}>
      <Grid templateColumns={{ base: "1fr", md: "1fr 1.3fr" }} gap="12">
        <Box>
          <Eyebrow>A FEW GOOD QUESTIONS</Eyebrow>
          <Editorial fontSize={{ base: "37px", md: "48px" }}>
            Here to make
            <br />
            things simpler.
          </Editorial>
          <TextLink href="/contact">Ask us anything</TextLink>
        </Box>
        <Accordion.Root collapsible>
          {faqs.map(([q, a], i) => (
            <Accordion.Item key={q} value={String(i)} borderColor="line">
              <Accordion.ItemTrigger py="6" fontSize="12px" fontWeight="500">
                <Box flex="1" textAlign="left">
                  {q}
                </Box>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody
                  fontSize="12px"
                  lineHeight="2"
                  color="muted"
                  pb="6"
                >
                  {a}
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Grid>
    </Wrap>
  );
}
function ContactBand() {
  return (
    <Box bg="sage">
      <Wrap py={{ base: "12", md: "16" }}>
        <Flex justify="space-between" align="center" gap="8" flexWrap="wrap">
          <Box>
            <Eyebrow>YOUR NEXT CHAPTER STARTS HERE</Eyebrow>
            <Editorial fontSize={{ base: "36px", md: "46px" }}>
              Let’s bring your space to life.
            </Editorial>
          </Box>
          <Action asChild>
            <a href="/contact">Tell us what you have in mind</a>
          </Action>
        </Flex>
      </Wrap>
    </Box>
  );
}
function Footer({ data }: { data: Bootstrap }) {
  return (
    <Box as="footer" bg="cream">
      <Wrap pt={{ base: "12", md: "16" }} pb="7">
        <Grid
          templateColumns={{ base: "1fr 1fr", md: "1.5fr 1fr 1fr 1fr" }}
          gap={{ base: "9", md: "12" }}
          pb="12"
        >
          <Box gridColumn={{ base: "1 / -1", md: "auto" }}>
            <Brand />
            <Text
              color="muted"
              fontSize="11px"
              lineHeight="2"
              maxW="245px"
              mt="6"
            >
              Your furniture, appliance and property furnishing partner. Based
              in Glasgow. Built around you.
            </Text>
            <chakra.a
              href={data.settings.instagram}
              target="_blank"
              rel="noreferrer"
              display="inline-flex"
              gap="2"
              alignItems="center"
              mt="5"
              fontSize="10px"
            >
              <Camera size={14} />
              Find a little inspiration
            </chakra.a>
          </Box>
          <FooterLinks title="EXPLORE" links={nav} />
          <FooterLinks
            title="HOW WE HELP"
            links={[
              ["/packages", "Furniture packs"],
              ["/packages#serviced", "Serviced accommodation"],
              ["/packages#social", "Social housing"],
              ["/contact", "Delivery & installation"],
            ]}
          />
          <Box>
            <Eyebrow>LET’S TALK</Eyebrow>
            <chakra.a
              href={"tel:" + data.settings.phone.replace(/\s/g, "")}
              display="block"
              fontSize="13px"
              mb="3"
            >
              {data.settings.phone}
            </chakra.a>
            <chakra.a
              href={"tel:" + data.settings.mobile.replace(/\s/g, "")}
              fontSize="13px"
            >
              {data.settings.mobile}
            </chakra.a>
            <Text fontSize="10px" color="muted" mt="6">
              A real person. A little less to do.
            </Text>
          </Box>
        </Grid>
        <Flex
          borderTop="1px solid"
          borderColor="line"
          pt="6"
          justify="space-between"
          gap="5"
          flexWrap="wrap"
          fontSize="9px"
          color="muted"
        >
          <Text>
            © {new Date().getFullYear()} · Furniture & property furnishing ·
            Glasgow
          </Text>
          <Flex gap="5">
            <chakra.a href="/privacy">Privacy</chakra.a>
            <chakra.a href="/terms">Ordering information</chakra.a>
            <chakra.a href="/admin">
              Administration{" "}
              <ArrowUpRight size={10} style={{ display: "inline" }} />
            </chakra.a>
          </Flex>
        </Flex>
      </Wrap>
    </Box>
  );
}
function FooterLinks({ title, links }: { title: string; links: string[][] }) {
  return (
    <Box>
      <Eyebrow>{title}</Eyebrow>
      <Flex direction="column" gap="3">
        {links.map(([h, t]) => (
          <chakra.a
            href={h}
            key={h}
            fontSize="11px"
            color="muted"
            _hover={{ color: "forest" }}
          >
            {t}
          </chakra.a>
        ))}
      </Flex>
    </Box>
  );
}
function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Wrap pt={{ base: "12", md: "16" }} pb={{ base: "10", md: "14" }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Editorial as="h1" fontSize={{ base: "46px", md: "66px" }}>
        {title}
      </Editorial>
      <Text fontSize="13px" color="muted" lineHeight="1.9" maxW="560px" mt="6">
        {description}
      </Text>
    </Wrap>
  );
}
function Shop({
  data,
  onAdd,
}: {
  data: Bootstrap;
  onAdd: (p: Product) => void;
}) {
  const [category, setCategory] = useState("All"),
    [q, setQ] = useState(""),
    [sort, setSort] = useState("featured");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setCategory(params.get("category") ?? "All");
    setQ(params.get("q") ?? "");
  }, []);
  const products = data.products
    .filter(
      (p) =>
        p.active &&
        (category === "All" || p.category === category) &&
        [p.title, p.description, p.category, p.finish]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "price-low"
        ? (a.pricePence ?? Infinity) - (b.pricePence ?? Infinity)
        : sort === "price-high"
          ? (b.pricePence ?? -1) - (a.pricePence ?? -1)
          : sort === "name"
            ? a.title.localeCompare(b.title)
            : Number(b.featured) - Number(a.featured),
    );
  return (
    <>
      <PageIntro
        eyebrow="THE COLLECTION"
        title="Good pieces. Better spaces."
        description="Furniture for real life, thoughtfully brought together. Explore the collection and build your selection. Prices and availability are confirmed by our team."
      />
      <Wrap pb="20">
        <Flex
          justify="space-between"
          gap="5"
          flexWrap="wrap"
          borderY="1px solid"
          borderColor="line"
          py="5"
          mb="8"
        >
          <Flex gap="2" flexWrap="wrap">
            {["All", ...categories].map((c) => (
              <Button
                key={c}
                size="sm"
                rounded="0"
                fontSize="11px"
                bg={category === c ? "forest" : "transparent"}
                color={category === c ? "white" : "forest"}
                onClick={() => setCategory(c)}
              >
                {c}
              </Button>
            ))}
          </Flex>
          <Flex gap="3" align="center">
            <Box position="relative">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Filter products"
                placeholder="Find a piece…"
                w={{ base: "150px", md: "180px" }}
                fontSize="11px"
                borderColor="line"
                rounded="0"
              />
            </Box>
            <NativeSelect.Root size="sm" w="150px">
              <NativeSelect.Field
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort products"
                fontSize="11px"
                rounded="0"
                borderColor="line"
              >
                <option value="featured">Featured</option>
                <option value="name">Name A–Z</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Flex>
        </Flex>
        <Text color="muted" fontSize="10px" mb="6">
          {products.length} {products.length === 1 ? "piece" : "pieces"} to
          explore
        </Text>
        {products.length ? (
          <Grid
            templateColumns={{ base: "1fr 1fr", md: "repeat(3,1fr)" }}
            gap={{ base: "5", md: "8" }}
            rowGap="12"
          >
            {products.map((p) => (
              <ProductCard key={p.id} p={p} onAdd={onAdd} />
            ))}
          </Grid>
        ) : (
          <Empty
            title={
              category === "Appliances"
                ? "Everyday essentials, personally sourced."
                : "A little more to discover."
            }
            description={
              category === "Appliances"
                ? "Tell us which appliance you need. Our team will confirm models, installation and availability."
                : "Try another collection or change your search."
            }
          >
            <TextLink href="/contact">Ask our team</TextLink>
          </Empty>
        )}
      </Wrap>
      <ContactBand />
    </>
  );
}
function ProductDetail({
  p,
  onAdd,
}: {
  p: Product;
  onAdd: (p: Product) => void;
}) {
  const [image, setImage] = useState(p.images[0]);
  const stock = available(p);
  return (
    <>
      <Wrap pt="8" pb="20">
        <Text fontSize="10px" color="muted" mb="8">
          <a href="/">Home</a> / <a href="/shop">Collection</a> / {p.title}
        </Text>
        <Grid
          templateColumns={{ base: "1fr", md: "1.1fr 1fr" }}
          gap={{ base: "8", md: "16" }}
        >
          <Box>
            <Image
              src={image}
              alt={p.title}
              w="100%"
              h={{ base: "450px", md: "650px" }}
              objectFit="cover"
            />
            <Flex gap="3" mt="4">
              {p.images.map((src, i) => (
                <chakra.button
                  key={src}
                  onClick={() => setImage(src)}
                  border="2px solid"
                  borderColor={image === src ? "forest" : "transparent"}
                  aria-label={"View image " + (i + 1)}
                >
                  <Image
                    src={src}
                    alt={p.title + " view " + (i + 1)}
                    w="70px"
                    h="80px"
                    objectFit="cover"
                  />
                </chakra.button>
              ))}
            </Flex>
          </Box>
          <Box pt={{ md: "10" }}>
            <Eyebrow>{p.category}</Eyebrow>
            <Editorial as="h1">{p.title}</Editorial>
            <Text mt="5" color="muted" fontSize="12px">
              {p.finish}
            </Text>
            <Text fontSize="20px" mt="7">
              {p.pricePence === null ? "Price on request" : money(p.pricePence)}
            </Text>
            <Text fontSize="12px" lineHeight="2" color="muted" my="7">
              {p.description}
            </Text>
            <Text fontSize="11px" mb="6">
              {stock === null
                ? "Made to order? In stock? Let’s check for you."
                : stock === 0
                  ? "Currently out of stock"
                  : stock + " currently available"}
            </Text>
            <Action w="100%" disabled={stock === 0} onClick={() => onAdd(p)}>
              <ShoppingBag size={16} />
              {stock === 0 ? "Currently unavailable" : "Add to your selection"}
            </Action>
            <Text fontSize="10px" color="muted" mt="4" lineHeight="1.8">
              {p.pricePence === null
                ? "Create a selection and request one tailored quotation."
                : "Delivery charges are confirmed before payment."}{" "}
              Accessories shown for inspiration.
            </Text>
            <Box mt="9" pt="6" borderTop="1px solid" borderColor="line">
              <Flex gap="3" align="center">
                <Truck size={20} strokeWidth={1} />
                <Text fontSize="11px">
                  Delivery & installation arranged with our team
                </Text>
              </Flex>
              <TextLink href={"/contact?item=" + encodeURIComponent(p.title)}>
                Have a question about this piece?
              </TextLink>
            </Box>
          </Box>
        </Grid>
      </Wrap>
    </>
  );
}
function Packages() {
  return (
    <>
      <PageIntro
        eyebrow="FURNITURE PACKS"
        title="One brief. A beautifully finished home."
        description="From a rental refresh to an entire serviced property, bring your furniture, appliances and installation together in one tailored quotation."
      />
      <Wrap pb="20">
        <Grid templateColumns={{ base: "1fr", md: "repeat(3,1fr)" }} gap="6">
          {[
            {
              id: "rental",
              image: "oak-bedroom",
              t: "Rental essentials",
              for: "FOR LANDLORDS",
              d: "Practical pieces and a coordinated finish, chosen around your property and your budget.",
              list: [
                "Bedroom & living room furniture",
                "Dining & appliance options",
                "Delivery & installation planning",
              ],
            },
            {
              id: "serviced",
              image: "calm-bedroom",
              t: "Ready for your guests",
              for: "SERVICED ACCOMMODATION",
              d: "A considered full set-up that helps your property feel welcoming from the very first stay.",
              list: [
                "Coordinated room schemes",
                "Furniture & finishing touches",
                "Full property set-up",
              ],
            },
            {
              id: "social",
              image: "soft-living",
              t: "A fresh beginning",
              for: "SOCIAL HOUSING",
              d: "Furniture packs that help turn an empty property into a comfortable place to call home.",
              list: [
                "Essential furniture packs",
                "Appliance requirements",
                "Property access coordination",
              ],
            },
          ].map((x) => (
            <Box
              key={x.id}
              id={x.id}
              bg="paper"
              border="1px solid"
              borderColor="line"
            >
              <Image
                src={"/images/" + x.image + ".webp"}
                alt={x.t}
                h="300px"
                w="100%"
                objectFit="cover"
              />
              <Box p="7">
                <Eyebrow>{x.for}</Eyebrow>
                <Editorial fontSize="32px">{x.t}</Editorial>
                <Text
                  color="muted"
                  fontSize="12px"
                  lineHeight="2"
                  mt="5"
                  mb="6"
                >
                  {x.d}
                </Text>
                <Flex direction="column" gap="3">
                  {x.list.map((v) => (
                    <Flex key={v} gap="2" align="center">
                      <Check size={13} />
                      <Text fontSize="11px">{v}</Text>
                    </Flex>
                  ))}
                </Flex>
                <Box mt="8">
                  <Action secondary w="100%" asChild>
                    <a href={"/contact?pack=" + encodeURIComponent(x.t)}>
                      Discuss this pack
                    </a>
                  </Action>
                </Box>
              </Box>
            </Box>
          ))}
        </Grid>
        <Text fontSize="11px" color="muted" mt="6">
          Every pack is quoted individually. Contents, specifications, pricing
          and delivery are agreed before you order.
        </Text>
      </Wrap>
      <Process />
      <Faq />
      <ContactBand />
    </>
  );
}
function Spaces() {
  const [selected, setSelected] = useState<number | null>(null);
  const photos = [
    ["sage-living", "A softer kind of living", "Living room"],
    ["calm-bedroom", "A place to unwind", "Bedroom"],
    ["oak-dining", "Made for everyday moments", "Dining"],
    ["oak-bedroom", "Warmth in the details", "Storage"],
    ["soft-living", "Comfort comes naturally", "Living room"],
  ];
  return (
    <>
      <PageIntro
        eyebrow="OUR SPACES"
        title="Homes with a little more soul."
        description="A closer look at the textures, tones and thoughtful details in our supplied photography. Find the feeling you want, then let us help you bring it home."
      />
      <Wrap pb="20">
        <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="7">
          {photos.map(([im, t, cat], i) => (
            <chakra.button
              textAlign="left"
              key={im}
              onClick={() => setSelected(i)}
              gridColumn={i === 0 ? { base: "auto", md: "1 / -1" } : "auto"}
            >
              <Image
                src={"/images/" + im + ".webp"}
                alt={t}
                w="100%"
                h={
                  i === 0
                    ? { base: "480px", md: "650px" }
                    : { base: "420px", md: "520px" }
                }
                objectFit="cover"
                objectPosition="center 65%"
                loading="lazy"
              />
              <Flex justify="space-between" mt="4" mb="4">
                <Box>
                  <Text fontSize="9px" color="muted" letterSpacing=".1em">
                    {cat.toUpperCase()}
                  </Text>
                  <Text fontFamily="editorial" fontSize="25px" mt="2">
                    {t}
                  </Text>
                </Box>
                <ArrowUpRight size={19} />
              </Flex>
            </chakra.button>
          ))}
        </Grid>
      </Wrap>
      <Drawer.Root
        open={selected !== null}
        onOpenChange={(e) => {
          if (!e.open) setSelected(null);
        }}
        placement="bottom"
        size="full"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content bg="forest">
              <Drawer.Body display="grid" placeItems="center" p="6">
                {selected !== null && (
                  <Image
                    src={"/images/" + photos[selected][0] + ".webp"}
                    alt={photos[selected][1]}
                    maxH="85dvh"
                    objectFit="contain"
                  />
                )}
              </Drawer.Body>
              <Drawer.CloseTrigger asChild>
                <CloseButton
                  size="lg"
                  color="white"
                  position="absolute"
                  right="4"
                  top="4"
                  bg="blackAlpha.700"
                />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
      <ContactBand />
    </>
  );
}
function About() {
  return (
    <>
      <PageIntro
        eyebrow="OUR APPROACH"
        title="A real team. A little less to do."
        description="Finding furniture should feel exciting. Getting it into your property should feel straightforward. We bring those two things together."
      />
      <Wrap pb="20">
        <Grid
          templateColumns={{ base: "1fr", md: "1fr 1fr" }}
          gap="14"
          alignItems="center"
        >
          <Image
            src="/images/oak-bedroom.webp"
            alt="Coordinated oak bedroom furniture"
            h={{ base: "460px", md: "600px" }}
            w="100%"
            objectFit="cover"
          />
          <Box>
            <Eyebrow>PERSONALLY TAKEN CARE OF</Eyebrow>
            <Editorial>
              More than pieces.
              <br />
              <Box as="span" fontStyle="italic">
                Peace of mind.
              </Box>
            </Editorial>
            <Text fontSize="13px" color="muted" lineHeight="2" my="7">
              We supply furniture and appliances for landlords, serviced
              accommodation, social housing and homes. Whether you need a single
              replacement or a full property set-up, we help you bring the right
              pieces together.
            </Text>
            <Text fontSize="13px" color="muted" lineHeight="2" mb="8">
              Tell us what matters to you: your budget, your space and when it
              needs to be ready. We will talk through the options and confirm
              every detail in your quotation.
            </Text>
            <TextLinkBox>
              <TextLink href="/contact">Meet your furnishing partner</TextLink>
            </TextLinkBox>
          </Box>
        </Grid>
      </Wrap>
      <TrustStrip />
      <Process />
      <ContactBand />
    </>
  );
}
function TextLinkBox({ children }: { children: React.ReactNode }) {
  return <Box mt="7">{children}</Box>;
}
function Contact({ data }: { data: Bootstrap }) {
  return (
    <>
      <PageIntro
        eyebrow="LET’S TALK"
        title="Tell us about your space."
        description="A single piece, a complete property or just a question. We are here to help you find a good way forward."
      />
      <Wrap pb="20">
        <Grid
          templateColumns={{ base: "1fr", md: "1.4fr .8fr" }}
          gap={{ base: "10", md: "16" }}
        >
          <QuoteForm data={data} />
          <Box bg="sage" p={{ base: "7", md: "9" }} alignSelf="start">
            <Eyebrow>GOOD CONVERSATIONS START HERE</Eyebrow>
            <Editorial fontSize="33px">Prefer a proper chat?</Editorial>
            <Flex direction="column" gap="5" mt="8">
              <chakra.a
                href={"tel:" + data.settings.phone.replace(/\s/g, "")}
                display="flex"
                gap="3"
                alignItems="center"
              >
                <Phone size={16} />
                <Text fontSize="18px">{data.settings.phone}</Text>
              </chakra.a>
              <chakra.a
                href={"tel:" + data.settings.mobile.replace(/\s/g, "")}
                display="flex"
                gap="3"
                alignItems="center"
              >
                <Phone size={16} />
                <Text fontSize="18px">{data.settings.mobile}</Text>
              </chakra.a>
            </Flex>
            <Box mt="10" pt="7" borderTop="1px solid" borderColor="line">
              <Flex gap="3" align="center">
                <MapPin size={17} />
                <Text fontSize="12px" fontWeight="600">
                  Glasgow & surrounding areas
                </Text>
              </Flex>
              <Text mt="4" fontSize="11px" lineHeight="2" color="muted">
                {data.settings.deliveryNote}
              </Text>
            </Box>
            <chakra.a
              href={data.settings.instagram}
              target="_blank"
              rel="noreferrer"
              display="flex"
              gap="3"
              alignItems="center"
              fontSize="11px"
              mt="8"
            >
              <Camera size={16} />
              See what we’ve been working on <ArrowUpRight size={15} />
            </chakra.a>
          </Box>
        </Grid>
      </Wrap>
    </>
  );
}
function Cart({
  data,
  lines,
  ready,
  onQuantity,
}: {
  data: Bootstrap;
  lines: CartLine[];
  ready: boolean;
  onQuantity: (id: string, q: number) => void;
}) {
  const [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  useEffect(() => {
    const fingerprint = JSON.stringify(lines) + ":" + email;
    try {
      const previous = JSON.parse(
        sessionStorage.getItem("checkout-attempt") ?? "null",
      ) as { fingerprint: string; requestId: string } | null;
      if (previous?.fingerprint === fingerprint) {
        setRequestId(previous.requestId);
        return;
      }
      const id = createId();
      sessionStorage.setItem(
        "checkout-attempt",
        JSON.stringify({ fingerprint, requestId: id }),
      );
      setRequestId(id);
    } catch {
      setRequestId(createId());
    }
  }, [JSON.stringify(lines), email]);
  const products = lines.map((l) => ({
    line: l,
    p: data.products.find((p) => p.id === l.productId),
  }));
  const quotable = products.some(
    ({ p }) => !p || p.pricePence === null || available(p) === null,
  );
  const subtotal = products.reduce(
    (sum, { line, p }) => sum + (p?.pricePence ?? 0) * line.quantity,
    0,
  );
  const purchasable =
    !quotable &&
    data.mode === "live" &&
    data.integrations.stripe &&
    data.settings.paymentsEnabled &&
    data.settings.deliveryFeePence !== null;
  const hasUnavailable = products.some(
    ({ p, line }) =>
      !p ||
      !p.active ||
      (available(p) !== null && (available(p) ?? 0) < line.quantity),
  );
  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await apiRequest<{ url: string }>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ items: lines, email, requestId }),
      });
      const url = new URL(r.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com")
        throw new Error("The payment link could not be verified.");
      location.assign(r.url);
    } catch (e) {
      if (e instanceof RequestError && e.code === "CHECKOUT_ENDED") {
        const id = createId();
        setRequestId(id);
        try {
          sessionStorage.setItem(
            "checkout-attempt",
            JSON.stringify({
              fingerprint: JSON.stringify(lines) + ":" + email,
              requestId: id,
            }),
          );
        } catch {}
      }
      setError(e instanceof Error ? e.message : "Please try again.");
      setBusy(false);
    }
  }
  return (
    <>
      <PageIntro
        eyebrow="YOUR SELECTION"
        title="A few good choices."
        description="Bring your pieces together. We will help with the details, from availability to getting everything into place."
      />
      <Wrap pb="20">
        {!ready ? (
          <Flex py="16" justify="center">
            <Spinner />
          </Flex>
        ) : lines.length === 0 ? (
          <Empty
            title="Good spaces start with a little inspiration."
            description="Your selection is empty. Explore the collection and add a piece that feels right."
          >
            <Action asChild>
              <a href="/shop">Find your first piece</a>
            </Action>
          </Empty>
        ) : (
          <Grid templateColumns={{ base: "1fr", md: "1.4fr .8fr" }} gap="12">
            <Box>
              {products.map(({ line, p }) => (
                <Flex
                  key={line.productId}
                  gap="5"
                  borderBottom="1px solid"
                  borderColor="line"
                  py="6"
                >
                  <Image
                    src={p?.images[0] ?? "/images/sage-living.webp"}
                    alt={p?.title ?? "Unavailable item"}
                    w={{ base: "90px", md: "120px" }}
                    h={{ base: "120px", md: "145px" }}
                    objectFit="cover"
                  />
                  <Box flex="1">
                    <Text fontFamily="editorial" fontSize="25px">
                      {p?.title ?? "This piece is no longer available"}
                    </Text>
                    <Text fontSize="10px" color="muted" mt="2">
                      {p?.finish}
                    </Text>
                    <Text fontSize="12px" mt="3">
                      {p?.pricePence ? money(p.pricePence) : "Price on request"}
                    </Text>
                    <Flex gap="3" align="center" mt="4">
                      <IconButton
                        aria-label={"Reduce quantity of " + p?.title}
                        size="xs"
                        variant="outline"
                        rounded="0"
                        onClick={() =>
                          onQuantity(line.productId, line.quantity - 1)
                        }
                      >
                        <Minus size={12} />
                      </IconButton>
                      <Text fontSize="12px">{line.quantity}</Text>
                      <IconButton
                        aria-label={"Increase quantity of " + p?.title}
                        size="xs"
                        variant="outline"
                        rounded="0"
                        disabled={
                          line.quantity >=
                          Math.min(50, p ? (available(p) ?? 50) : 0)
                        }
                        onClick={() =>
                          onQuantity(line.productId, line.quantity + 1)
                        }
                      >
                        <Plus size={12} />
                      </IconButton>
                      <Button
                        variant="plain"
                        fontSize="10px"
                        ml="auto"
                        onClick={() => onQuantity(line.productId, 0)}
                      >
                        Remove
                      </Button>
                    </Flex>
                  </Box>
                </Flex>
              ))}
              <TextLink href="/shop">Keep exploring</TextLink>
            </Box>
            <Box bg="sage" p="7" alignSelf="start">
              <Eyebrow>THE NEXT STEP</Eyebrow>
              <Editorial fontSize="32px">Let’s make it happen.</Editorial>
              <Text fontSize="12px" lineHeight="2" color="muted" my="6">
                {quotable
                  ? "Your selected pieces will be included in your enquiry. Our team will confirm specifications, current prices and delivery."
                  : "Review your selection and delivery charge before continuing to secure checkout."}
              </Text>
              {hasUnavailable && (
                <Text role="alert" fontSize="12px" color="red.700" mb="5">
                  One or more pieces are unavailable at this quantity. Please
                  update your selection.
                </Text>
              )}
              {!quotable && (
                <Box borderY="1px solid" borderColor="line" py="4" mb="6">
                  <Flex justify="space-between" fontSize="12px">
                    <Text>Items</Text>
                    <Text>{money(subtotal)}</Text>
                  </Flex>
                  <Flex justify="space-between" fontSize="12px" mt="3">
                    <Text>Delivery</Text>
                    <Text>
                      {data.settings.deliveryFeePence === null
                        ? "To be confirmed"
                        : money(data.settings.deliveryFeePence)}
                    </Text>
                  </Flex>
                  {data.settings.deliveryFeePence !== null && (
                    <Flex
                      justify="space-between"
                      fontWeight="700"
                      fontSize="14px"
                      mt="4"
                    >
                      <Text>Total</Text>
                      <Text>
                        {money(subtotal + data.settings.deliveryFeePence)}
                      </Text>
                    </Flex>
                  )}
                </Box>
              )}
              {purchasable ? (
                <chakra.form onSubmit={checkout}>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Your email address"
                    aria-label="Email for your order"
                    bg="paper"
                    rounded="0"
                    mb="4"
                  />
                  <Action
                    type="submit"
                    w="100%"
                    loading={busy}
                    disabled={hasUnavailable}
                  >
                    Secure checkout
                  </Action>
                  <Text fontSize="9px" color="muted" mt="4">
                    Payment handled securely by Stripe. Your order is confirmed
                    after payment verification.
                  </Text>
                </chakra.form>
              ) : (
                <Action asChild w="100%">
                  <a href="/contact?selection=1">Request my quotation</a>
                </Action>
              )}
              {error && (
                <Text role="alert" fontSize="12px" color="red.700" mt="4">
                  {error}
                </Text>
              )}
              <Text fontSize="10px" color="muted" lineHeight="1.8" mt="5">
                Need a hand?{" "}
                <a href={"tel:" + data.settings.phone.replace(/\s/g, "")}>
                  {data.settings.phone}
                </a>
              </Text>
            </Box>
          </Grid>
        )}
      </Wrap>
    </>
  );
}
