import { SiteChrome } from "@/components/site-chrome";
import SiteNotFound from "./(site)/not-found";

// Unmatched URLs render outside the (site) group, so the public chrome is added here.
export default function NotFound() {
  return (
    <SiteChrome>
      <SiteNotFound />
    </SiteChrome>
  );
}
