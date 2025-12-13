import { Suspense } from "react";
import CallbackClient from "./callback-client";
import Loader from "@/components/ui/Loader";

export default function CallbackPage() {
  return (
    <Suspense fallback={<Loader />}>
      <CallbackClient />
    </Suspense>
  );
}
