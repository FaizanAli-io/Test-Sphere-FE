"use client";

import React from "react";
import type { ReactElement } from "react";
import { useParams } from "next/navigation";

export default function ClassDetail(): ReactElement {
  const params = useParams<{ classId: string }>();
  return <div>Class Detail (migrated) - {params?.classId}</div>;
}


