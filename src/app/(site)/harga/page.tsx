import { redirect } from "next/navigation";

// v2.0: pricing is managed inside each application. Old links land on the catalog.
export default function LegacyPricing() {
  redirect("/apps");
}
