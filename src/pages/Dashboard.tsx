import { useState } from "react";
import type{ Contact } from "../types/Contact";
import { Sidebar } from "../components/Sidebar";
import { Composer } from "../components/Composer";

type View = 'compose' | 'conversation';

export const Dashboard: React.FC = () => {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<View>('compose');
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  const handleSelect = (contact: Contact) => {
    setSelectedContacts([contact]);
    setActiveContact(contact);
    setCurrentView('conversation');
  };

  const handleNewMessage = () => {
    setSelectedContacts([]);
    setActiveContact(null);
    setCurrentView('compose');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-[#ffffff] dark:bg-[#202123] overflow-hidden">
      {/* Sidebar - Left */}
      <div className={`
        fixed md:relative z-40 h-full transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-80' : 'w-0 md:w-0'}
        overflow-hidden
      `}>
        <Sidebar onSelect={handleSelect} onNewMessage={handleNewMessage} />
      </div>

      {/* Main Content - Composer */}
      <div className="flex-1 flex flex-col h-full w-full min-w-0">
        {/* Mobile Header with Sidebar Toggle */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-[#e5e5e5] dark:border-[#2a2b32] bg-[#ffffff] dark:bg-[#202123]">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-[#f7f7f7] dark:hover:bg-[#2a2b32] text-[#37352f] dark:text-[#ececf1]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-medium text-[#37352f] dark:text-[#ececf1]">NOLA SMS Pro</span>
          <div className="w-8" />
        </div>
        
        <Composer 
          selectedContacts={selectedContacts} 
          isNewMessage={currentView === 'compose'}
          activeContact={activeContact}
        />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
