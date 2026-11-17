import { redirect } from "next/navigation";

// v2.0: there is no public or customer registration. Admin accounts are provisioned by the owner.
export default function LegacyRegister() {
  redirect("/");
}
