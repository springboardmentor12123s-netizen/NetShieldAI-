"use client";

import { redirect } from "next/navigation";

export default function LegacyReportsRedirect() {
    redirect("/detection-reports");
}
