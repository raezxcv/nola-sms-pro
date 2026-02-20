import { useEffect, useState } from "react";
import { fetchContacts } from "../api/contacts";
import type { Contact } from "../types/Contact";

interface SidebarProps {
  onSelect: (contact: Contact) => void;
  onNewMessage: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelect, onNewMessage }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  useEffect(() => {
    fetchContacts().then(setContacts);
  }, []);

  const handleSelect = (contact: Contact) => {
    setSelectedId(contact.id);
    onSelect(contact);
  };

  return (
    <div className="w-full md:w-80 bg-[#f7f7f7] dark:bg-[#18191d] flex-shrink-0 overflow-hidden flex flex-col h-full border-r border-[#e5e5e5] dark:border-[#2a2b32]">
      {/* Header */}
      <div className="p-4 border-b border-[#e5e5e5] dark:border-[#2a2b32]">
        <h2 className="text-lg font-bold text-[#37352f] dark:text-[#ececf1]">NOLA SMS Pro</h2>
        <button
          onClick={onNewMessage}
          className="mt-3 w-full bg-[#2b83fa] hover:bg-[#1751a5] text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Message
        </button>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="p-4 text-center text-[#6e6e73]">
            <p className="text-sm">No contacts found</p>
          </div>
        ) : (
          contacts.map(contact => (
            <div
              key={contact.id}
              className={`
                px-4 py-3 cursor-pointer transition-all duration-150 border-b border-[#e5e5e5] dark:border-[#2a2b32]
                hover:bg-[#e8e8e8] dark:hover:bg-[#2a2b32]
                ${selectedId === contact.id 
                  ? 'bg-[#2b83fa]/10 border-l-4 border-l-[#2b83fa]' 
                  : 'border-l-4 border-l-transparent'}
              `}
              onClick={() => handleSelect(contact)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2b83fa] flex items-center justify-center text-white font-medium">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#37352f] dark:text-[#ececf1] text-sm truncate">{contact.name}</div>
                  <div className="text-xs text-[#6e6e73] truncate">{contact.phone}</div>
                </div>
              </div>
              {contact.lastMessage && (
                <p className="text-xs text-[#6e6e73] mt-2 truncate pl-13">{contact.lastMessage}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
