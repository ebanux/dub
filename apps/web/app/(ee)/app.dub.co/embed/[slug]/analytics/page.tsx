import Analytics from "@/ui/analytics";
import LayoutLoader from "@/ui/layout/layout-loader.tsx";
import { Suspense } from "react";
import AnalyticsClient from "../../../../../app.dub.co/(dashboard)/[slug]/analytics/client.tsx";

export default function WorkspaceAnalytics() {
  return (
    <Suspense fallback={<LayoutLoader />}>
      <AnalyticsClient>
        <Analytics />
      </AnalyticsClient>
    </Suspense>
  );
}
