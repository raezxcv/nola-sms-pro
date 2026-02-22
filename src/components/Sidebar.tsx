import { useEffect, useState } from "react";
import { fetchContacts } from "../api/contacts";
import type { Contact } from "../types/Contact";
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarRightCollapse } from "react-icons/tb";

export type ViewTab = 'compose' | 'contacts' | 'templates' | 'settings';

interface SidebarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onSelectContact: (contact: Contact) => void;
  activeContactId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onSelectContact,
  activeContactId,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    fetchContacts().then(setContacts).catch(console.error);
  }, []);

  const navItems = [
    {
      id: 'compose',
      label: 'Compose',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      )
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" />
        </svg>
      )
    }
  ];

  return (
    <div className={`
      h-full bg-white/70 dark:bg-[#121415]/80 backdrop-blur-2xl flex-shrink-0 flex flex-col border-r border-[#0000000a] dark:border-[#ffffff0a] shadow-[1px_0_0_rgba(0,0,0,0.05)] relative z-30 transition-all duration-300
      ${isCollapsed ? 'w-20' : 'w-full'}
    `}>
      {/* Header Profile / Logo Area */}
      <div className={`p-5 pb-2 ${isCollapsed ? 'px-0 flex flex-col items-center' : ''}`}>
        <div className={`flex items-center justify-between transition-all ${isCollapsed ? 'mb-6 justify-center' : 'mb-8'}`}>
          <div
            className={`flex items-center relative group cursor-pointer transition-all ${isCollapsed ? '' : 'gap-3.5'}`}
            onClick={isCollapsed ? onToggleCollapse : undefined}
          >
            <div className={`w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#2b83fa] to-[#60a5fa] shadow-[0_4px_12px_rgba(43,131,250,0.3)] flex items-center justify-center transition-all duration-500 relative overflow-hidden group-hover:rotate-6 group-hover:scale-105 active:scale-95`}>
              <div className={`transition-all duration-500 ${isCollapsed ? 'group-hover:opacity-0 group-hover:scale-50' : 'group-hover:rotate-[-6deg]'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Rail Mode Expand Toggle (Right Collapse Icon) */}
              {isCollapsed && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                  <TbLayoutSidebarRightCollapse className="h-6 w-6 text-white" />
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex flex-col">
                <h2 className="text-[16px] font-extrabold text-[#111111] dark:text-white tracking-tight leading-none">NOLA SMS Pro</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] font-bold text-[#2b83fa] uppercase tracking-widest opacity-80">One Way SMS</span>
                </div>
              </div>
            )}
          </div>

          {/* Collapse Toggle (Desktop Only) - Now on the right end */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-2 rounded-xl text-gray-400 hover:text-[#2b83fa] hover:bg-[#2b83fa]/10 transition-all active:scale-90"
              title="Collapse Sidebar"
            >
              <TbLayoutSidebarLeftCollapse className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className={`flex flex-col gap-1 mt-2 ${isCollapsed ? 'items-center px-2' : ''}`}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as ViewTab)}
                className={`
                  flex items-center transition-all duration-300 relative group
                  ${isCollapsed ? 'w-12 h-12 justify-center rounded-2xl' : 'w-full gap-3 px-3 py-2.5 rounded-xl'}
                  ${isActive
                    ? `bg-gradient-to-r from-[#2b83fa]/10 to-transparent dark:from-[#2b83fa]/20 text-[#2b83fa] ${isCollapsed ? 'bg-[#2b83fa]/10' : ''}`
                    : 'text-[#6e6e73] dark:text-[#94959b] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] hover:text-[#111111] dark:hover:text-[#ececf1]'}
                `}
              >
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#2b83fa] rounded-r-full shadow-[0_0_8px_rgba(43,131,250,0.5)]"></div>
                )}
                {isActive && isCollapsed && (
                  <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1 h-6 bg-[#2b83fa] rounded-r-full"></div>
                )}
                <div className={`transition-all duration-500 ${isActive ? 'scale-125 text-[#2b83fa] drop-shadow-[0_0_8px_rgba(43,131,250,0.4)]' : 'group-hover:scale-110 group-hover:text-[#2b83fa]'} active:scale-90`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <span className={`text-[13.5px] transition-all duration-200 ${isActive ? 'font-bold tracking-tight' : 'font-medium'}`}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Activity Feed Section */}
      <div className={`flex-1 overflow-hidden flex flex-col mt-4 ${isCollapsed ? 'items-center' : ''}`}>
        <div className={`border-t border-[#00000005] dark:border-[#ffffff05] group cursor-default ${isCollapsed ? 'w-full pt-4' : 'px-6 py-2 pt-4'}`}>
          {!isCollapsed && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9e9e9e] dark:text-[#55565a]">Direct Messages</h3>
              <span className="text-[10px] font-bold text-[#2b83fa] bg-[#2b83fa]/5 px-2 py-0.5 rounded-full">{contacts.length}</span>
            </div>
          )}
        </div>
        <div className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pb-4 ${isCollapsed ? 'px-2 items-center' : 'px-3'}`}>
          {contacts.map(contact => (
            <div
              key={contact.id}
              className={`
                 group relative transition-all duration-300
                 ${isCollapsed ? 'w-12 h-12 flex items-center justify-center rounded-2xl mb-1' : 'px-3 py-3 rounded-2xl cursor-pointer mb-0.5'}
                 ${activeContactId === contact.id
                  ? 'bg-white dark:bg-[#1c1e21] shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] ring-1 ring-[#00000005] dark:ring-[#ffffff05]'
                  : 'hover:bg-black/[0.015] dark:hover:bg-white/[0.015]'}
               `}
              onClick={() => {
                onTabChange('compose');
                onSelectContact(contact);
              }}
              title={isCollapsed ? contact.name : ""}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3.5'}`}>
                <div className="relative flex-shrink-0">
                  <div className={`${isCollapsed ? 'w-9 h-9' : 'w-10 h-10'} rounded-2xl flex items-center justify-center font-bold text-[14px] transition-all duration-300 shadow-inner
                    ${activeContactId === contact.id
                      ? 'bg-[#2b83fa] text-white shadow-[0_4px_8px_rgba(43,131,250,0.2)]'
                      : 'bg-[#f0f0f0] dark:bg-[#202123] text-[#6e6e73] dark:text-[#ececf1] group-hover:bg-[#e8e8e8] dark:group-hover:bg-[#25262a]'}
                  `}>
                    {(() => {
                      const parts = contact.name.trim().split(/\s+/);
                      const firstInitial = parts[0]?.charAt(0) || '';
                      const lastInitial = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
                      return (firstInitial + lastInitial).toUpperCase();
                    })()}
                  </div>
                  {!isCollapsed && (
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#121415] shadow-sm transition-opacity duration-300
                      ${activeContactId === contact.id ? 'bg-green-500 opacity-100' : 'bg-gray-300 dark:bg-gray-600 opacity-0 group-hover:opacity-100'}
                    `}></span>
                  )}
                  {isCollapsed && activeContactId === contact.id && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#121415] rounded-full"></span>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-[13.5px] truncate transition-colors duration-200 ${activeContactId === contact.id ? 'font-bold text-[#111111] dark:text-white' : 'font-semibold text-[#37352f] dark:text-[#ececf1]'}`}>
                        {contact.name}
                      </span>
                      <span className="text-[9px] font-bold text-[#b4b4b4] dark:text-[#55565a] uppercase tracking-tighter">2m</span>
                    </div>
                    <div className={`text-[11.5px] truncate leading-tight transition-colors duration-200 ${activeContactId === contact.id ? 'text-[#6e6e73] dark:text-[#a0a0ab]' : 'text-[#a2a2a7] dark:text-[#6e6e73]'}`}>
                      {contact.lastMessage || `Click to message ${contact.phone}`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Only Footer */}
      <div className={`p-4 bg-transparent border-t border-[#0000000a] dark:border-[#ffffff0a] ${isCollapsed ? 'px-2 flex justify-center' : ''}`}>
        <button
          onClick={() => onTabChange('settings')}
          className={`
            flex items-center rounded-xl transition-all duration-300 group text-sm
            ${isCollapsed ? 'w-12 h-12 justify-center' : 'w-full gap-3 px-3 py-2.5'}
            ${activeTab === 'settings'
              ? 'bg-gradient-to-r from-[#2b83fa]/10 to-transparent dark:from-[#2b83fa]/20 text-[#2b83fa]'
              : 'text-[#6e6e73] dark:text-[#94959b] hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'}
          `}
        >
          <div className={`transition-all duration-500 ${activeTab === 'settings' ? 'scale-110 rotate-90 text-[#2b83fa]' : 'group-hover:scale-110 group-hover:rotate-45 group-hover:text-[#2b83fa]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          {!isCollapsed && <span className="font-semibold text-[13px]">Settings</span>}
        </button>
      </div>
    </div>
  );
};
