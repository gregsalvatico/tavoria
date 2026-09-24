"use client";

import type { FormEvent } from "react";

export default function AdminDeleteButton({
  action,
  id,
  label = "Delete",
  confirmation,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label?: string;
  confirmation: string;
}) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmation)) event.preventDefault();
  }

  return (
    <form action={action} onSubmit={confirmDelete}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        {label}
      </button>
    </form>
  );
}
