import React from "react";
import { FiUsers, FiClock, FiCheck, FiAlertCircle, FiLoader } from "react-icons/fi";
import type { BulkMessageHistoryItem } from "../types/Sms";
import { useBatchMessages } from "../hooks/useBatchMessages";
import { getRelativeTime } from "../utils/storage";

interface BulkChatViewProps {
    bulkItem: BulkMessageHistoryItem;
}

export const BulkChatView: React.FC<BulkChatViewProps> = ({ bulkItem }) => {
    const { messages, loading } = useBatchMessages(bulkItem.batchId);

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
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                {loading && messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <FiLoader className="animate-spin mb-4" size={32} />
                        <p className="text-[14px]">Loading campaign details...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 mb-6">
                            <FiUsers size={32} />
                        </div>
                        <h3 className="text-[18px] font-bold text-[#111111] dark:text-[#ececf1] mb-2">No data yet</h3>
                        <p className="text-[14px] text-gray-500 dark:text-gray-400">
                            We're waiting for the backend to store the message records for this campaign.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {/* The Original Message Banner */}
                        <div className="p-4 rounded-2xl bg-[#2b83fa]/5 border border-[#2b83fa]/10 mb-8">
                            <div className="text-[11px] font-bold text-[#2b83fa] uppercase tracking-wider mb-2">Campaign Message</div>
                            <div className="text-[15px] text-[#111111] dark:text-[#ececf1] whitespace-pre-wrap leading-relaxed">
                                {bulkItem.message}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {messages.map((msg) => (
                                <div key={msg.message_id} className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 transition-all hover:border-[#2b83fa]/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[13px] font-bold text-[#111111] dark:text-[#ececf1]">
                                            {msg.numbers[0]}
                                        </span>
                                        <StatusBadge status={msg.status} />
                                    </div>
                                    <div className="text-[14px] text-gray-500 dark:text-gray-400 mb-2 truncate opacity-70">
                                        {msg.message}
                                    </div>
                                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">
                                        ID: {msg.message_id}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
