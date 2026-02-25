import { useState, useEffect, useMemo } from "react";
import { fetchContacts } from "../api/contacts";
import type { Contact } from "../types/Contact";
import { FiSearch, FiX, FiMail, FiCheck, FiUser, FiPlus, FiTrash2, FiMoreVertical, FiEdit2 } from "react-icons/fi";

interface ContactsTabProps {
  onSendToComposer: (contacts: Contact[]) => void;
}

export const ContactsTab: React.FC<ContactsTabProps> = ({ onSendToComposer }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  useEffect(() => {
    fetchContacts()
      .then(setContacts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const lowerQ = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQ) ||
        c.phone.includes(lowerQ)
    );
  }, [searchQuery, contacts]);

  // Group contacts by first letter
  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    filteredContacts.forEach((contact) => {
      const firstLetter = contact.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(contact);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredContacts]);

  const handleToggleContact = (contact: Contact) => {
    setSelectedContacts((prev) => {
      const isSelected = prev.some((c) => c.id === contact.id);
      if (isSelected) {
        return prev.filter((c) => c.id !== contact.id);
      }
      return [...prev, contact];
    });
  };

  const handleSelectAll = () => {
    setSelectedContacts([...filteredContacts]);
  };

  const handleClearSelection = () => {
    setSelectedContacts([]);
  };

  const handleSendToComposer = () => {
    if (selectedContacts.length > 0) {
      onSendToComposer(selectedContacts);
    }
  };

  const handleAddContact = () => {
    const digits = newContactPhone.replace(/\D/g, "");
    if (!newContactName.trim() || digits.length < 7) return;
    
    const newContact: Contact = {
      id: `manual-${Date.now()}`,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
    };
    
    // Add to local contacts list (don't select automatically)
    setContacts((prev) => [...prev, newContact]);
    // Clear search to show the new contact
    setSearchQuery("");
    
    // Reset and close modal
    setNewContactName("");
    setNewContactPhone("");
    setIsAddModalOpen(false);
  };

  const handleEditContact = () => {
    if (!editingContact) return;
    const digits = editingContact.phone.replace(/\D/g, "");
    if (!editingContact.name.trim() || digits.length < 7) return;
    
    // Update contact in list
    setContacts((prev) => prev.map((c) => 
      c.id === editingContact.id ? editingContact : c
    ));
    
    // Update selected contacts if this one was selected
    setSelectedContacts((prev) => prev.map((c) => 
      c.id === editingContact.id ? editingContact : c
    ));
    
    // Close modal
    setEditingContact(null);
  };

  const handleDeleteContact = (contactId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Remove from contacts list
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    // Remove from selected if selected
    setSelectedContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  const isAllSelected = filteredContacts.length > 0 && selectedContacts.length === filteredContacts.length;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f7f7f7] dark:bg-[#18191d]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2b83fa]/30 border-t-[#2b83fa] rounded-full animate-spin"></div>
          <span className="text-[14px] text-gray-500 dark:text-gray-400 font-medium">Loading contacts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f7f7f7] dark:bg-[#111111]">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/80 dark:bg-[#1a1b1e]/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/5 shadow-sm">
        <div className="max-w-5xl mx-auto px-3 md:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2b83fa] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <FiUser className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-[#111111] dark:text-[#ececf1] tracking-tight">Contacts</h2>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">
                  {contacts.length} contacts available
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..."
              disabled={isAddModalOpen}
              className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200/60 dark:border-white/10 rounded-xl text-[14px] font-medium text-[#111111] dark:text-[#ececf1] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2b83fa]/20 focus:border-[#2b83fa] transition-all disabled:opacity-50"
            />
            {searchQuery && !isAddModalOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                }}
                className="absolute right-3 sm:right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={isAllSelected ? handleClearSelection : handleSelectAll}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 ${
                  isAllSelected
                    ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                    : "bg-[#2b83fa]/10 dark:bg-[#2b83fa]/20 text-[#2b83fa] hover:bg-[#2b83fa]/20 dark:hover:bg-[#2b83fa]/30"
                }`}
              >
                <FiCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isAllSelected ? "Deselect All" : "Select All"}</span>
                <span className="sm:hidden">{isAllSelected ? "Deselect All" : "Select All"}</span>
              </button>
              {selectedContacts.length > 0 && (
                <button
                  onClick={handleClearSelection}
                  className="px-3 sm:px-4 py-2 text-[12px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all duration-200"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[12px] font-bold text-[#2b83fa] bg-[#2b83fa]/10 px-3 py-1 rounded-full whitespace-nowrap">
                {selectedContacts.length} selected
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                  setIsAddModalOpen(true);
                }}
                className="group flex items-center justify-center gap-1 sm:gap-2 bg-gradient-to-r from-[#2b83fa] to-[#1d6bd4] text-white px-3 sm:px-4 py-2.5 rounded-2xl text-[13px] font-bold hover:shadow-[0_8px_25px_rgba(43,131,250,0.4)] active:scale-95 transition-all duration-200"
              >
                <FiPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Contact</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 custom-scrollbar">
        <div className="max-w-5xl mx-auto">
          {groupedContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                <FiSearch className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 font-medium">
                {searchQuery ? "No contacts match your search" : "No contacts available"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedContacts.map(([letter, letterContacts]) => (
                <div key={letter}>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 ml-1">
                    {letter}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {letterContacts.map((contact) => {
                      const isSelected = selectedContacts.some((c) => c.id === contact.id);
                      return (
                        <div
                          key={contact.id}
                          onClick={() => handleToggleContact(contact)}
                          className={`
                            group flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200
                            ${isSelected
                              ? "bg-[#2b83fa]/10 dark:bg-[#2b83fa]/15 border border-[#2b83fa]/20"
                              : "bg-white dark:bg-[#1a1b1e] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 shadow-sm"
                            }
                          `}
                        >
                          {/* Checkbox */}
                          <div
                            className={`
                              w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0
                              ${isSelected
                                ? "bg-[#2b83fa] border-[#2b83fa]"
                                : "border-gray-300 dark:border-gray-600 group-hover:border-[#2b83fa]"
                              }
                            `}
                          >
                            {isSelected && <FiCheck className="h-4 w-4 text-white" />}
                          </div>

                          {/* Avatar */}
                          <div
                            className={`
                              w-9 sm:w-11 h-9 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-[13px] sm:text-[14px] flex-shrink-0 transition-all duration-200
                              ${isSelected
                                ? "bg-[#2b83fa] text-white shadow-lg shadow-blue-500/20"
                                : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                              }
                            `}
                          >
                            {(() => {
                              const parts = contact.name.split(" ").filter((p) => p.length > 0);
                              const first = parts[0]?.charAt(0) || "";
                              const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) || "" : "";
                              return (first + last).toUpperCase() || "?";
                            })()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`
                                text-[14px] font-semibold truncate transition-colors
                                ${isSelected ? "text-[#2b83fa]" : "text-[#111111] dark:text-[#ececf1]"}
                              `}
                            >
                              {contact.name}
                            </p>
                            <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">
                              {contact.phone}
                            </p>
                          </div>

                          {/* Last message preview */}
                          {contact.lastMessage && (
                            <div className="hidden md:block flex-1 min-w-0">
                              <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">
                                {contact.lastMessage}
                              </p>
                            </div>
                          )}

                          {/* More button with dropdown */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === contact.id ? null : contact.id);
                              }}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200"
                              title="More options"
                            >
                              <FiMoreVertical className="h-4 w-4" />
                            </button>
                            {openMenuId === contact.id && (
                              <div 
                                className="absolute right-0 top-full mt-1 bg-white dark:bg-[#2d2d2d] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px] z-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingContact(contact);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
                                >
                                  <FiEdit2 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(contact.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedContacts.length > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 px-3 sm:px-0">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-[#1a1b1e] rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/30 border border-gray-100 dark:border-white/10">
            <span className="text-[13px] sm:text-[14px] font-bold text-gray-700 dark:text-white">
              {selectedContacts.length} contact{selectedContacts.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleClearSelection}
                className="flex-1 sm:flex-none px-4 py-2 text-[13px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendToComposer}
                className="flex-1 sm:flex-none group flex items-center justify-center gap-2 bg-gradient-to-r from-[#2b83fa] to-[#1d6bd4] text-white px-4 sm:px-5 py-2.5 rounded-2xl font-bold text-[13px] hover:shadow-[0_8px_25px_rgba(43,131,250,0.4)] active:scale-95 transition-all duration-200"
              >
                <FiMail className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1a1b1e] rounded-2xl shadow-2xl p-4 sm:p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <FiTrash2 className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <h3 className="text-[16px] sm:text-[18px] font-bold text-[#111111] dark:text-[#ececf1] text-center mb-2">
              Delete Contact?
            </h3>
            <p className="text-[13px] sm:text-[14px] text-gray-500 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete this contact? This action cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row items-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="w-full sm:flex-1 px-4 py-2.5 text-[14px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteContact(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="w-full sm:flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-[14px] transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#1a1b1e] rounded-2xl shadow-2xl p-4 sm:p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#2b83fa]/10 dark:bg-[#2b83fa]/20 flex items-center justify-center">
                  <FiUser className="h-4 w-4 text-[#2b83fa]" />
                </div>
                <h3 className="text-[16px] sm:text-[18px] font-bold text-[#111111] dark:text-[#ececf1]">Add New Contact</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] sm:text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Enter contact name"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200/60 dark:border-white/10 rounded-xl text-[14px] font-medium text-[#111111] dark:text-[#ececf1] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2b83fa]/20 focus:border-[#2b83fa] transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[11px] sm:text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[14px] font-medium text-gray-500 dark:text-gray-400">+63</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={newContactPhone}
                    onChange={(e) => {
                      // Only allow numbers
                      const digits = e.target.value.replace(/\D/g, "");
                      // Format: XXXX XXX XXXX (11 digits after +63)
                      let formatted = "";
                      if (digits.length > 0) {
                        formatted = digits.substring(0, 11);
                        // Apply formatting
                        if (formatted.length > 7) {
                          formatted = `${formatted.slice(0, 4)} ${formatted.slice(4, 7)} ${formatted.slice(7)}`;
                        } else if (formatted.length > 3) {
                          formatted = `${formatted.slice(0, 3)} ${formatted.slice(3)}`;
                        }
                      }
                      setNewContactPhone(formatted);
                    }}
                    placeholder="912 345 6789"
                    className="w-full pl-12 sm:pl-16 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200/60 dark:border-white/10 rounded-xl text-[14px] font-medium text-[#111111] dark:text-[#ececf1] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2b83fa]/20 focus:border-[#2b83fa] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-full sm:flex-1 px-4 py-3 text-[14px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContact}
                disabled={!newContactName.trim() || newContactPhone.replace(/\D/g, "").length < 7}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#2b83fa] hover:bg-[#1d6bd4] disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white disabled:text-gray-500 dark:disabled:text-gray-400 rounded-xl font-semibold text-[14px] transition-all duration-200"
              >
                <FiPlus className="h-4 w-4" />
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditingContact(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#1a1b1e] rounded-2xl shadow-2xl p-4 sm:p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#2b83fa]/10 dark:bg-[#2b83fa]/20 flex items-center justify-center">
                  <FiEdit2 className="h-4 w-4 text-[#2b83fa]" />
                </div>
                <h3 className="text-[16px] sm:text-[18px] font-bold text-[#111111] dark:text-[#ececf1]">Edit Contact</h3>
              </div>
              <button
                onClick={() => setEditingContact(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] sm:text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editingContact.name}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  placeholder="Enter contact name"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200/60 dark:border-white/10 rounded-xl text-[14px] font-medium text-[#111111] dark:text-[#ececf1] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2b83fa]/20 focus:border-[#2b83fa] transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[11px] sm:text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  {editingContact.phone === '' || !editingContact.phone.startsWith('0') ? (
                    <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[14px] font-medium text-gray-500 dark:text-gray-400">+63</span>
                  ) : null}
                  <input
                    type="tel"
                    inputMode="tel"
                    value={editingContact.phone}
                    onChange={(e) => {
                      // Only allow numbers
                      const digits = e.target.value.replace(/\D/g, "");
                      // Format: XXXX XXX XXXX (11 digits after +63)
                      let formatted = "";
                      if (digits.length > 0) {
                        formatted = digits.substring(0, 11);
                        // Apply formatting
                        if (formatted.length > 7) {
                          formatted = `${formatted.slice(0, 4)} ${formatted.slice(4, 7)} ${formatted.slice(7)}`;
                        } else if (formatted.length > 3) {
                          formatted = `${formatted.slice(0, 3)} ${formatted.slice(3)}`;
                        }
                      }
                      setEditingContact({ ...editingContact, phone: formatted });
                    }}
                    placeholder="912 345 6789"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200/60 dark:border-white/10 rounded-xl text-[14px] font-medium text-[#111111] dark:text-[#ececf1] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2b83fa]/20 focus:border-[#2b83fa] transition-all ${editingContact.phone === '' || !editingContact.phone.startsWith('0') ? 'pl-12 sm:pl-16' : 'pl-3 sm:pl-4'}`}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setEditingContact(null)}
                className="w-full sm:flex-1 px-4 py-3 text-[14px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditContact}
                disabled={!editingContact.name.trim() || editingContact.phone.replace(/\D/g, "").length < 7}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#2b83fa] hover:bg-[#1d6bd4] disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white disabled:text-gray-500 dark:disabled:text-gray-400 rounded-xl font-semibold text-[14px] transition-all duration-200"
              >
                <FiCheck className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
