import { loginAction } from "@/lib/actions/auth-actions";
import { Alert } from "@/components/Alert";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      <form
        action={loginAction}
        className="w-full max-w-sm space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
            Logga in
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Hela Rubbet – Lager, leverans och reklamation
          </p>
        </div>

        {error && <Alert tone="error">Fel användarnamn eller lösenord.</Alert>}

        <div className="space-y-1">
          <label
            htmlFor="username"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Användarnamn
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoFocus
            autoComplete="username"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Lösenord
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-neutral-900 px-3 py-2 text-base font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
        >
          Logga in
        </button>
      </form>
    </main>
  );
}
