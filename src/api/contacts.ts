import type { Contact } from "../types/Contact";

export const fetchContacts = async (): Promise<Contact[]> => {
  const res = await fetch("/api/contacts");
  if (!res.ok) throw new Error("Failed to fetch contacts");
  return res.json();
};