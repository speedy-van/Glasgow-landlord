import { InformationPage } from "@/components/information-page";
export const metadata = {
  title: "Privacy information",
  alternates: { canonical: "/privacy" },
};
export default function Page() {
  return <InformationPage privacy />;
}
