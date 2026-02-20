import { useState, useRef, useEffect } from "react";
import { sendSms, sendBulkSms } from "../api/sms";
import type { Contact } from "../types/Contact";
import { Snackbar, Alert } from "@mui/material";

interface ComposerProps {
  selectedContacts: Contact[];
  isNewMessage?: boolean;
  activeContact?: Contact | null;
}

interface SentMessage {
  id: string;
  text: string;
  timestamp: Date;
}

export const Composer: React.FC<ComposerProps> = ({ selectedContacts, isNewMessage = true, activeContact }) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Toast states
  const [toastOpen, setToastOpen] = useState(false);
  const [toastSeverity, setToastSeverity] = useState<"success" | "error">("success");
  const [toastMessage, setToastMessage] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset when active contact changes
  useEffect(() => {
    if (activeContact) {
      setPhoneNumber(activeContact.phone);
    }
  }, [activeContact]);

  const handleSend = async () => {
    const recipients = selectedContacts.length > 0 ? selectedContacts : [];
    if (!message || (!phoneNumber && recipients.length === 0)) return;
    
    setLoading(true);
    try {
      const newMessage: SentMessage = {
        id: Date.now().toString(),
        text: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      
      let smsResult;
      if (recipients.length === 1) {
        // Send to single selected contact
        smsResult = await sendSms(recipients[0].phone, message);
      } else if (recipients.length > 1) {
        // Send to multiple selected contacts
        const phones = recipients.map(c => c.phone);
        const results = await sendBulkSms(phones, message);
        const successCount = results.filter(r => r.success).length;
        smsResult = { 
          success: successCount > 0, 
          message: `Sent ${successCount} of ${recipients.length} messages` 
        };
      } else if (phoneNumber) {
        // Send to phone number directly
        smsResult = await sendSms(phoneNumber, message);
      } else {
        return;
      }
      
      if (!smsResult?.success) {
        setToastSeverity("error");
        setToastMessage(smsResult?.message || "Failed to send message");
      } else {
        setToastSeverity("success");
        setToastMessage(smsResult?.message || "Message sent successfully!");
      }
      setToastOpen(true);
      
      setMessage("");
    } catch (error) {
      // Show error toast
      setToastSeverity("error");
      setToastMessage(error instanceof Error ? error.message : "Failed to send message");
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#ffffff] dark:bg-[#202123]">
      {/* New Message View */}
      {isNewMessage && (
        <div className="p-4 border-b border-[#e5e5e5] dark:border-[#2a2b32]">
          <h2 className="text-lg font-bold text-[#37352f] dark:text-[#ececf1] mb-4">New Message</h2>
          
          {/* Phone Number Input */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-[#6e6e73] mb-1">Recipient Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+63 955-000-0000"
              className="w-full border border-[#e5e5e5] dark:border-[#2a2b32] rounded-lg px-3 py-2 bg-[#f7f7f7] dark:bg-[#2a2b32] text-[#37352f] dark:text-[#ececf1] placeholder-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#2b83fa]"
            />
          </div>

          {/* Message Input */}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !isNewMessage ? (
          <div className="h-full flex flex-col items-center justify-center text-[#6e6e73]">
            <div className="w-16 h-16 mb-4 rounded-full bg-[#2b83fa] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-[#37352f] dark:text-[#ececf1] mb-1">SMS Campaign Manager</p>
            <p className="text-sm">Select a contact to send SMS messages</p>
          </div>
        ) : messages.length === 0 && isNewMessage ? (
          <div className="h-full flex flex-col items-center justify-center text-[#6e6e73]">
            <div className="w-16 h-16 mb-4 rounded-full bg-[#2b83fa] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-[#37352f] dark:text-[#ececf1] mb-1">Compose Message</p>
            <p className="text-sm">Enter a phone number and compose your message</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[70%] bg-[#2b83fa] rounded-2xl rounded-tr-sm px-4 py-2 shadow-sm">
                <p className="text-white whitespace-pre-wrap break-words">{msg.text}</p>
                <span className="text-xs text-white/60 text-right block mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[#e5e5e5] dark:border-[#2a2b32] p-4 bg-[#ffffff] dark:bg-[#202123]">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              className="w-full border border-[#e5e5e5] dark:border-[#2a2b32] rounded-xl p-3 bg-[#f7f7f7] dark:bg-[#2a2b32] text-[#37352f] dark:text-[#ececf1] placeholder-[#9e9e9e] dark:placeholder-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#2b83fa] resize-none shadow-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={2}
            />
          </div>
          <button
            className="bg-[#2b83fa] hover:bg-[#1751a5] text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center"
            onClick={handleSend}
            disabled={loading || !message || (!phoneNumber && selectedContacts.length === 0)}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </div>
        {selectedContacts.length > 0 && (
          <p className="text-xs text-[#6e6e73] mt-2">
            Sending to: {selectedContacts.map(c => c.name).join(', ')}
          </p>
        )}
      </div>
      
      {/* Toast Notification */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={5000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert 
          onClose={() => setToastOpen(false)} 
          severity={toastSeverity} 
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};
