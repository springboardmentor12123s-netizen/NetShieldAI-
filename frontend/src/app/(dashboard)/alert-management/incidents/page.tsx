"use client";

import { redirect } from "next/navigation";

export default function LegacyIncidentsRedirect() {
    redirect("/incident-management");
}
