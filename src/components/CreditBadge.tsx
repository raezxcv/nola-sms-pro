import { useState, useEffect } from "react";
import { FiCreditCard, FiRefreshCw } from "react-icons/fi";

export const CreditBadge = () => {
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchBalance = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/credits');
            const data = await res.json();
            setBalance(data.balance);
        } catch (error) {
            console.error("Failed to fetch balance", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
        // Refresh balance every 5 minutes
        const interval = setInterval(fetchBalance, 5 * 60 * 1000);

        // Listen for message sent event to refresh balance
        window.addEventListener('sms-sent', fetchBalance);
        window.addEventListener('bulk-message-sent', fetchBalance);

        return () => {
            clearInterval(interval);
            window.removeEventListener('sms-sent', fetchBalance);
            window.removeEventListener('bulk-message-sent', fetchBalance);
        };
    }, []);

    return (
        <div
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 rounded-xl cursor-pointer hover:bg-emerald-500/20 transition-all group"
            onClick={fetchBalance}
            title="Click to refresh balance"
        >
            <FiCreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase leading-none mb-0.5">Credits</span>
                <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400 leading-none">
                    {loading ? (
                        <FiRefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                        balance?.toLocaleString() ?? "---"
                    )}
                </span>
            </div>
        </div>
    );
};
