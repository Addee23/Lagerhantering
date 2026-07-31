"use client";

import { useRouter } from "next/navigation";
import { PinPad } from "@/components/PinPad";

type StaffOption = { id: number; name: string };

export function DashboardPinTest({ staffMembers }: { staffMembers: StaffOption[] }) {
  const router = useRouter();

  return (
    <PinPad
      staffMembers={staffMembers}
      eventType="manual_test"
      description="Manuell PIN-test från dashboard"
      onSuccess={() => router.refresh()}
    />
  );
}
