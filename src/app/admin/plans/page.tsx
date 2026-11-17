import { redirect } from "next/navigation";

// v2.0: pricing is no longer managed here. Plan rows stay in the database untouched.
export default function LegacyPlans() {
  redirect("/admin/apps");
}
