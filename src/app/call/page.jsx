"use client";

import CallPage from "@/components/CallPage";
import { Suspense } from "react";


export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallPage />
    </Suspense>
  );
}
