"use client";

import { useState, useTransition } from "react";
import { verifyPinAction } from "@/lib/actions/staff-actions";

type StaffOption = { id: number; name: string };

const DIGIT_BUTTONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function PinPad({
  staffMembers,
  eventType,
  description,
  onSuccess,
}: {
  staffMembers: StaffOption[];
  eventType: string;
  description: string;
  onSuccess?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [pin, setPin] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  function pressDigit(digit: string) {
    setFeedback(null);
    if (pin.length >= 6) return;
    setPin((prev) => prev + digit);
  }

  function backspace() {
    setFeedback(null);
    setPin((prev) => prev.slice(0, -1));
  }

  // PIN-koder är alltid 4 ELLER 6 siffror (skills/authentication-and-pin.md,
  // 21.2) - 5 siffror är aldrig giltigt. Utan den här kontrollen kunde man
  // råka skicka in en ofullständig kod och slösa ett av de 5 tillåtna
  // försöken på ett garanterat felaktigt värde.
  const isValidLength = pin.length === 4 || pin.length === 6;

  function submit() {
    if (!selectedId || !isValidLength || isPending) return;

    startTransition(async () => {
      const result = await verifyPinAction(Number(selectedId), pin, { eventType, description });
      setPin("");

      if (result.success) {
        setFeedback({ text: "PIN godkänd.", isError: false });
        onSuccess?.();
        return;
      }

      if (result.locked) {
        setFeedback({
          text: `För många felaktiga försök. Försök igen om ${result.secondsRemaining} sekunder.`,
          isError: true,
        });
        return;
      }

      setFeedback({ text: result.message, isError: true });
    });
  }

  return (
    <div className="mx-auto w-full max-w-xs space-y-4">
      <div>
        <label
          htmlFor="staff"
          className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Vem är du?
        </label>
        <select
          id="staff"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : "")}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="">Välj namn...</option>
          {staffMembers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-h-3 justify-center gap-2" aria-hidden="true">
        {/* PIN-koder får vara 4 eller 6 siffror (skills/authentication-and-pin.md, 21.2),
            så vi visar bara så många prickar som faktiskt är inskrivna - inte ett fast antal. */}
        {Array.from({ length: pin.length }).map((_, i) => (
          <span key={i} className="h-3 w-3 rounded-full bg-neutral-900 dark:bg-neutral-100" />
        ))}
      </div>
      <p className="text-center text-xs text-neutral-400">PIN-koden är 4 eller 6 siffror</p>

      {feedback && (
        <p
          className={`text-center text-sm ${
            feedback.isError
              ? "text-red-600 dark:text-red-400"
              : "text-green-600 dark:text-green-400"
          }`}
        >
          {feedback.text}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {DIGIT_BUTTONS.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => pressDigit(digit)}
            className="rounded-lg border border-neutral-300 py-4 text-xl font-medium active:bg-neutral-100 dark:border-neutral-700 dark:active:bg-neutral-800"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={backspace}
          aria-label="Radera siffra"
          className="rounded-lg border border-neutral-300 py-4 text-sm font-medium active:bg-neutral-100 dark:border-neutral-700 dark:active:bg-neutral-800"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={() => pressDigit("0")}
          className="rounded-lg border border-neutral-300 py-4 text-xl font-medium active:bg-neutral-100 dark:border-neutral-700 dark:active:bg-neutral-800"
        >
          0
        </button>
        <button
          type="button"
          disabled={!selectedId || !isValidLength || isPending}
          onClick={submit}
          className="rounded-lg bg-neutral-900 py-4 text-sm font-medium text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          OK
        </button>
      </div>
    </div>
  );
}
