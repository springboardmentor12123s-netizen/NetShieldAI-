"use client";

import { redirect } from "next/navigation";

export default function LegacyAnalyticsReportsRedirect() {
    redirect("/reports");
}
