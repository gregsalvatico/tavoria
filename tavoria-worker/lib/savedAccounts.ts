// Device-only sign-in account chooser. This deliberately stores usernames and
// roles only: PINs and Supabase sessions are never kept here.
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVED_ACCOUNTS_KEY = "tavoria.saved_accounts";
const MAX_SAVED_ACCOUNTS = 5;

export type AccountRole = "worker" | "venue";

export type SavedAccount = {
  username: string;
  roles: AccountRole[];
  lastUsedAt: string;
};

export async function getSavedAccounts(): Promise<SavedAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
    const accounts = raw ? (JSON.parse(raw) as SavedAccount[]) : [];
    if (!Array.isArray(accounts)) return [];
    return accounts
      .filter(
        (account) =>
          typeof account?.username === "string" &&
          Array.isArray(account.roles) &&
          typeof account.lastUsedAt === "string"
      )
      .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
  } catch {
    return [];
  }
}

export async function rememberAccount(input: {
  username: string;
  roles: AccountRole[];
}): Promise<SavedAccount[]> {
  const username = input.username.trim().toLowerCase();
  if (!username) return getSavedAccounts();

  const existing = await getSavedAccounts();
  const prior = existing.find((account) => account.username === username);
  const account: SavedAccount = {
    username,
    // Preserve prior roles if a profile lookup is temporarily unavailable.
    roles: Array.from(new Set([...(prior?.roles ?? []), ...input.roles])),
    lastUsedAt: new Date().toISOString(),
  };
  const next = [
    account,
    ...existing.filter((saved) => saved.username !== username),
  ].slice(0, MAX_SAVED_ACCOUNTS);

  try {
    await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export async function forgetAccount(username: string): Promise<SavedAccount[]> {
  const next = (await getSavedAccounts()).filter(
    (account) => account.username !== username
  );
  try {
    await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(next));
  } catch {}
  return next;
}
