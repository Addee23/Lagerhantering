"use client";

import { useId, useState } from "react";

// Webbläsarens inbyggda filväljare ("Choose File" / "No file chosen") visas
// alltid på webbläsarens/OS:ets språk, inte sidans - det går inte att ändra
// med CSS eftersom det inte är en vanlig text utan en del av den inbyggda
// kontrollen. Lösningen är att visuellt gömma <input type="file"> och styra
// den via en <label>, som fungerar även utan JS (klick på label öppnar
// filväljaren ändå). JS behövs bara för att visa vilket filnamn som valdes.
export function FileInput({
  name,
  accept,
  required,
  buttonLabel = "Välj fil",
  placeholder = "Ingen fil vald",
}: {
  name: string;
  accept?: string;
  required?: boolean;
  buttonLabel?: string;
  placeholder?: string;
}) {
  const id = useId();
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className="cursor-pointer whitespace-nowrap rounded-md border border-neutral-400 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
      >
        {buttonLabel}
      </label>
      <input
        id={id}
        type="file"
        name={name}
        accept={accept}
        required={required}
        onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
        className="sr-only"
      />
      <span className="truncate text-sm text-neutral-500 dark:text-neutral-400">
        {fileName ?? placeholder}
      </span>
    </div>
  );
}
