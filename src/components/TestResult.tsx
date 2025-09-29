"use client";

import React from "react";
import type { ReactElement } from "react";
import { useParams } from "next/navigation";

export default function TestResult(): ReactElement {
  const params = useParams<{ testId: string }>();
  return <div>Test Result (migrated) - {params?.testId}</div>;
}


