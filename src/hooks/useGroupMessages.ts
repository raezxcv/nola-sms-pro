import { useState, useEffect, useCallback, useRef } from "react";
import { fetchBatchMessages } from "../api/sms";
import { getHistoryForGroup } from "../utils/storage";
import type { SmsLog } from "../types/Sms";

export const useGroupMessages = (recipientKey?: string) => {
    const [messages, setMessages] = useState<SmsLog[]>([]);
    const [loading, setLoading] = useState(false);
    const initialLoadDone = useRef(false);

    const refresh = useCallback(async (showLoading = false) => {
        if (!recipientKey) {
            setMessages([]);
            return;
        }

        if (showLoading) setLoading(true);
        try {
            // 1. Get all batches associated with this group from local storage
            const groupHistory = getHistoryForGroup(recipientKey);
            const batchIds = groupHistory
                .map(item => item.batchId)
                .filter((id): id is string => !!id);

            if (batchIds.length === 0) {
                setMessages([]);
                return;
            }

            // 2. Fetch all messages for these batches from the backend
            // For now, we fetch them one by one. In a real app, the API might support multiple IDs.
            const allBatchData = await Promise.all(
                batchIds.map(id => fetchBatchMessages(id))
            );

            // 3. Flatten and sort by date
            const flattened = allBatchData.flat();

            // Deduplicate by message_id
            const unique = Array.from(new Map(flattened.map(m => [m.message_id, m])).values());

            // Sort by date (descending to match single chat pattern)
            unique.sort((a, b) => {
                const dateA = typeof a.date_created === 'string' ? new Date(a.date_created).getTime() : a.date_created._seconds * 1000;
                const dateB = typeof b.date_created === 'string' ? new Date(b.date_created).getTime() : b.date_created._seconds * 1000;
                return dateA - dateB; // Chronological
            });

            setMessages(unique);
        } catch (error) {
            console.error("Failed to fetch group messages:", error);
        } finally {
            if (showLoading) setLoading(false);
            initialLoadDone.current = true;
        }
    }, [recipientKey]);

    useEffect(() => {
        initialLoadDone.current = false;
        refresh(true);

        if (!recipientKey) return;

        // Background polling every 10 seconds
        const interval = setInterval(() => {
            refresh(false);
        }, 10000);

        return () => clearInterval(interval);
    }, [recipientKey, refresh]);

    return {
        messages,
        loading: loading && !initialLoadDone.current,
        refresh
    };
};
