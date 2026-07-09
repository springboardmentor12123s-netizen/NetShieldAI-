import { LoaderCircle } from "lucide-react";

export default function Loading({ label = "Loading..." }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-slate-400">
      <LoaderCircle className="h-7 w-7 animate-spin text-cyan" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
