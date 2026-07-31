import { getSession } from "@/lib/session";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Middleware garanterar redan att det finns en giltig session här, men vi
  // läser den ändå för att kunna visa vem som är inloggad.
  const session = await getSession();
  const username = session?.username ?? "okänd";

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <Nav username={username} />
      <div className="flex flex-1 flex-col">
        <div className="flex justify-end border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Logga ut
            </button>
          </form>
        </div>
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
