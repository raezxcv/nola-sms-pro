import type { BulkMessageHistoryItem } from "../types/Sms";

const BULK_HISTORY_KEY = "nola_sms_bulk_history";
const CONTACTS_KEY = "nola_sms_contacts";
const DELETED_CONTACTS_KEY = "nola_sms_deleted_contacts";

export const getDeletedContactIds = (): string[] => {
  try {
    const stored = localStorage.getItem(DELETED_CONTACTS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    return [];
  }
};

export const deleteContact = (id: string): void => {
  try {
    const existing = getDeletedContactIds();
    if (!existing.includes(id)) {
      const updated = [...existing, id];
      localStorage.setItem(DELETED_CONTACTS_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error("Failed to delete contact:", error);
  }
};

export const restoreContact = (id: string): void => {
  try {
    const existing = getDeletedContactIds();
    const updated = existing.filter(cid => cid !== id);
    localStorage.setItem(DELETED_CONTACTS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to restore contact:", error);
  }
};

export const saveBulkMessage = (item: BulkMessageHistoryItem): void => {
  try {
    const existing = getBulkMessageHistory();
    const updated = [item, ...existing].slice(0, 50); // Keep max 50 items
    localStorage.setItem(BULK_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save bulk message history:", error);
  }
};

export const getBulkMessageHistory = (): BulkMessageHistoryItem[] => {
  try {
    const stored = localStorage.getItem(BULK_HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load bulk message history:", error);
    return [];
  }
};

export const clearBulkMessageHistory = (): void => {
  try {
    localStorage.removeItem(BULK_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear bulk message history:", error);
  }
};

export const renameBulkMessage = (id: string, newName: string): void => {
  try {
    const existing = getBulkMessageHistory();
    const updated = existing.map(item => 
      item.id === id ? { ...item, customName: newName } : item
    );
    localStorage.setItem(BULK_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to rename bulk message:", error);
  }
};

export const deleteBulkMessage = (id: string): void => {
  try {
    const existing = getBulkMessageHistory();
    const updated = existing.filter(item => item.id !== id);
    localStorage.setItem(BULK_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to delete bulk message:", error);
  }
};

export const getRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return then.toLocaleDateString();
};
