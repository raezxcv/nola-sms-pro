import { useState, useEffect, useCallback } from "react";
import { fetchSmsLogs } from "../api/sms";
import type { Message, SmsLog } from "../types/Sms";
import { getCachedMessages, setCachedMessages, updateMessageInCache } from "../utils/storage";

export const useMessages = (phoneNumber: string | undefined) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatLogToMessage = (log: SmsLog): Message => {
        let date: Date;
        if (!log.date_created) {
            date = new Date();
        } else if (typeof log.date_created === 'string') {
            date = new Date(log.date_created);
        } else if (typeof log.date_created === 'object' && '_seconds' in log.date_created) {
            date = new Date((log.date_created as any)._seconds * 1000);
        } else {
            date = new Date();
        }

        return {
            id: log.message_id || `msg-${Date.now()}`,
            text: log.message || '',
            timestamp: date,
            senderName: log.sender_id || 'NOLACRM',
            status: (log.status as Message['status']) || 'sent',
        };
    };

    const fetchHistory = useCallback(async () => {
        // Try to load from cache first
        if (phoneNumber) {
            const cached = getCachedMessages(phoneNumber);
            if (cached && cached.length > 0) {
                setMessages(cached);
            }
        }

        if (!phoneNumber) {
            // Don't clear messages - keep them cached for when user returns
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const logs = await fetchSmsLogs(phoneNumber);
            const formattedMessages = logs.map(formatLogToMessage);

            // Merge with locally-sent messages that aren't in the API yet
            // (messages with temp- IDs that were sent through the app)
            const cached = getCachedMessages(phoneNumber);
            const localOnlyMessages = (cached || []).filter(msg =>
                msg.id.startsWith('temp-') &&
                !formattedMessages.some(apiMsg => apiMsg.text === msg.text &&
                    Math.abs(apiMsg.timestamp.getTime() - msg.timestamp.getTime()) < 60000)
            );

            const mergedMessages = [...formattedMessages, ...localOnlyMessages];
            // Sort by date_created ascending as requested
            mergedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            setMessages(mergedMessages);
            // Save merged result to cache
            setCachedMessages(phoneNumber, mergedMessages);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load history");
        } finally {
            setLoading(false);
        }
    }, [phoneNumber]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const addOptimisticMessage = (text: string, senderName: string): string => {
        const id = `temp-${Date.now()}`;
        const newMessage: Message = {
            id,
            text,
            timestamp: new Date(),
            senderName,
            status: 'sending',
        };
        setMessages(prev => {
            const updated = [...prev, newMessage];
            // Cache the updated messages
            if (phoneNumber) {
                setCachedMessages(phoneNumber, updated);
            }
            return updated;
        });
        return id;
    };

    const updateMessageStatus = (tempId: string, status: 'sent' | 'failed', realId?: string) => {
        setMessages(prev => {
            const updated = prev.map(msg =>
                msg.id === tempId
                    ? { ...msg, status, id: realId || msg.id }
                    : msg
            );
            // Cache the updated messages
            if (phoneNumber) {
                updateMessageInCache(phoneNumber, tempId, status, realId);
            }
            return updated;
        });
    };

    return {
        messages,
        loading,
        error,
        addOptimisticMessage,
        updateMessageStatus,
        refresh: fetchHistory,
    };
};
