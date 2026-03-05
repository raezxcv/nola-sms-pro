import React, { useState, useEffect, useRef } from "react";
import { FiUsers, FiClock, FiCheck, FiAlertCircle, FiLoader, FiSend, FiPlus, FiSmile } from "react-icons/fi";
import type { BulkMessageHistoryItem, SmsLog } from "../types/Sms";
import { useGroupMessages } from "../hooks/useGroupMessages";
import { getRelativeTime, saveBulkMessage } from "../utils/storage";
import { sendBulkSms } from "../api/sms";
import { fetchContacts } from "../api/contacts";
import type { Contact } from "../types/Contact";

interface BulkChatViewProps {
    bulkItem: BulkMessageHistoryItem;
}

export const BulkChatView: React.FC<BulkChatViewProps> = ({ bulkItem }) => {
    const { messages, loading, refresh } = useGroupMessages(bulkItem.recipientKey);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [allContacts, setAllContacts] = useState<Contact[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchContacts().then(setAllContacts).catch(console.error);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        const messageText = newMessage;
        setNewMessage("");

        try {
            // Find contact objects for the recipients in this group
            const recipientContacts = bulkItem.recipientNumbers.map(number => {
                const found = allContacts.find(c => c.phone === number);
                return found || { id: `manual-${number}`, name: number, phone: number } as Contact;
            });

            const { results, batchId } = await sendBulkSms(bulkItem.recipientNumbers, messageText);
            const successCount = results.filter(r => r.success).length;

            // Save this new campaign to history under the same group
            const newBulkItem: BulkMessageHistoryItem = {
                id: `bulk-${Date.now()}`,
                message: messageText,
                recipientCount: bulkItem.recipientNumbers.length,
                recipientNames: recipientContacts.map(r => r.name),
                recipientNumbers: bulkItem.recipientNumbers,
                recipientKey: bulkItem.recipientKey,
                timestamp: new Date().toISOString(),
                status: successCount === bulkItem.recipientNumbers.length ? 'sent' : successCount > 0 ? 'partial' : 'failed',
                batchId: batchId,
                customName: bulkItem.customName
            };

            saveBulkMessage(newBulkItem);
            window.dispatchEvent(new Event('bulk-message-sent'));
            window.dispatchEvent(new Event('sms-sent')); // Trigger credit refresh

            // Refresh history
            setTimeout(() => refresh(), 1000);
        } catch (error) {
            console.error("Failed to send group message:", error);
        } finally {
            setSending(false);
        }
    };

    // Group messages by current status for a summary
    const stats = {
        pending: messages.filter(m => m.status.toLowerCase() === 'pending').length,
        sent: messages.filter(m => m.status.toLowerCase() === 'sent').length,
        failed: messages.filter(m => ['failed', 'error'].includes(m.status.toLowerCase())).length,
        total: bulkItem.recipientCount
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#0b0b0b] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#0b0b0b]/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#2b83fa]/10 flex items-center justify-center text-[#2b83fa]">
                            <FiUsers size={20} />
                        </div>
                        <div>
                            <h2 className="text-[17px] font-bold text-[#111111] dark:text-[#ececf1] leading-tight mb-0.5">
                                {bulkItem.customName || "Bulk Campaign"}
                            </h2>
                            <div className="flex items-center gap-3 text-[12px] font-medium text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <FiClock size={12} /> {getRelativeTime(bulkItem.timestamp)}
                                </span>
                                <span>•</span>
                                <span>{bulkItem.recipientCount} Recipients</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {stats.failed > 0 && (
                            <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-[11px] font-bold flex items-center gap-1">
                                <FiAlertCircle size={10} /> {stats.failed} Failed
                            </span>
                        )}
                        <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-[11px] font-bold flex items-center gap-1">
                            <FiCheck size={10} /> {stats.sent} Sent
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth custom-scrollbar bg-gray-50/30 dark:bg-black/20">
                {loading && messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <FiLoader className="animate-spin mb-4" size={32} />
                        <p className="text-[14px]">Loading group history...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 mb-6">
                            <FiUsers size={32} />
                        </div>
                        <h3 className="text-[18px] font-bold text-[#111111] dark:text-[#ececf1] mb-2">No history</h3>
                        <p className="text-[14px] text-gray-500 dark:text-gray-400">
                            Start the conversation by sending a message below.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-4xl mx-auto flex flex-col">
                        {/* Group messages by batchId for clearer campaign view? 
                            Actually, let's keep it as individual messages or grouped by campaign.
                            The user said "like a groupchat". In group chats, messages are sequential.
                        */}
                        {(() => {
                            // Group messages by batch_id to show campaign headers
                            const campaigns: { [key: string]: SmsLog[] } = {};
                            messages.forEach(m => {
                                const bid = m.batch_id || 'no-batch';
                                if (!campaigns[bid]) campaigns[bid] = [];
                                campaigns[bid].push(m);
                            });

                            return Object.keys(campaigns).map(bid => {
                                const campaignMsgs = campaigns[bid];
                                const firstMsg = campaignMsgs[0];
                                const date = typeof firstMsg.date_created === 'string'
                                    ? new Date(firstMsg.date_created)
                                    : new Date(firstMsg.date_created._seconds * 1000);

                                return (
                                    <div key={bid} className="flex flex-col gap-3">
                                        <div className="flex items-center gap-4 px-2">
                                            <div className="flex-1 h-px bg-gray-200 dark:bg-white/5"></div>
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                                {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <div className="flex-1 h-px bg-gray-200 dark:bg-white/5"></div>
                                        </div>

                                        <div className="bg-white dark:bg-[#1a1b1e] border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm">
                                            <div className="text-[15px] text-[#111111] dark:text-[#ececf1] mb-4 whitespace-pre-wrap leading-relaxed">
                                                {firstMsg.message}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {campaignMsgs.map(m => (
                                                    <div key={m.message_id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                                        <span className="text-[12px] font-medium text-gray-600 dark:text-gray-400 truncate">
                                                            {m.numbers[0]}
                                                        </span>
                                                        <StatusBadge status={m.status} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#0b0b0b]">
                <div className="max-w-4xl mx-auto">
                    <div className="relative flex items-end gap-2 group">
                        <div className="flex-1 min-h-[48px] p-1.5 rounded-2xl bg-[#f8f9fa] dark:bg-white/5 border border-gray-200/50 dark:border-white/5 focus-within:border-[#2b83fa]/50 focus-within:ring-4 focus-within:ring-[#2b83fa]/5 transition-all">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={`Reply to ${bulkItem.recipientCount} contacts...`}
                                className="w-full bg-transparent border-none focus:outline-none px-3 py-2 text-[15px] text-[#111111] dark:text-[#ececf1] placeholder-gray-400 dark:placeholder-gray-500 min-h-[40px] max-h-40 resize-none scrollbar-hide"
                                rows={1}
                            />
                            <div className="flex items-center justify-between px-2 pb-1">
                                <div className="flex items-center gap-1">
                                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#2b83fa] hover:bg-[#2b83fa]/10 transition-colors">
                                        <FiPlus size={18} />
                                    </button>
                                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#2b83fa] hover:bg-[#2b83fa]/10 transition-colors">
                                        <FiSmile size={18} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[11px] font-bold ${newMessage.length > 150 ? 'text-amber-500' : 'text-gray-400'}`}>
                                        {newMessage.length} chars
                                    </span>
                                    <button
                                        onClick={handleSend}
                                        disabled={!newMessage.trim() || sending}
                                        className={`p-2 rounded-xl transition-all ${newMessage.trim() && !sending
                                            ? 'bg-[#2b83fa] text-white shadow-lg shadow-blue-500/20 active:scale-95'
                                            : 'bg-gray-200 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {sending ? (
                                            <FiLoader className="animate-spin" size={18} />
                                        ) : (
                                            <FiSend size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const s = status.toLowerCase();
    if (s === 'sent' || s === 'delivered') {
        return (
            <span className="flex items-center gap-1 text-[11px] font-bold text-green-500 uppercase tracking-wider">
                <FiCheck size={12} /> {s}
            </span>
        );
    }
    if (s === 'pending' || s === 'queued') {
        return (
            <span className="flex items-center gap-1 text-[11px] font-bold text-blue-500 uppercase tracking-wider">
                <FiLoader className="animate-spin" size={12} /> {s}
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-[11px] font-bold text-red-500 uppercase tracking-wider">
            <FiAlertCircle size={12} /> {s}
        </span>
    );
};
