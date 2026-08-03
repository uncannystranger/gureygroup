import React, { useState } from 'react';
import { Plus, ChevronRight, Send, Check } from 'lucide-react';

export default function QuickTransferWidget({ onOpenSendModal }) {
  const [selectedRecipient, setSelectedRecipient] = useState(1);
  const [amount, setAmount] = useState('100.00');
  const [tab, setTab] = useState('All');
  const [isSent, setIsSent] = useState(false);

  const contacts = [
    { id: 1, name: 'F. Alonso', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
    { id: 2, name: 'C. Leclerc', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
    { id: 3, name: 'M. Naira', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80' },
  ];

  const handleSend = () => {
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setAmount('100.00');
    }, 2000);
  };

  return (
    <div className="glass-panel rounded-4xl p-6 relative flex flex-col justify-between space-y-6">
      
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
          Quick transfer
        </h3>
        
        {/* Filter Pills */}
        <div className="flex items-center space-x-1 p-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[11px] font-bold">
          <button 
            onClick={() => setTab('All')}
            className={`px-2.5 py-0.5 rounded-full transition-all ${tab === 'All' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
          >
            All
          </button>
          <button 
            onClick={() => setTab('Contacts')}
            className={`px-2.5 py-0.5 rounded-full transition-all ${tab === 'Contacts' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
          >
            Contacts
          </button>
        </div>
      </div>

      {/* Recipient Avatars Row */}
      <div className="flex items-center space-x-3 overflow-x-auto py-1 scrollbar-none">
        
        {/* Add New Button */}
        <button 
          onClick={onOpenSendModal}
          className="flex flex-col items-center group flex-shrink-0"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:border-indigo-500 group-hover:text-indigo-500 transition-colors bg-white/40 dark:bg-slate-800/40">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1.5">
            Add new
          </span>
        </button>

        {/* Contacts List */}
        {contacts.map((contact) => {
          const isSelected = selectedRecipient === contact.id;
          return (
            <button
              key={contact.id}
              onClick={() => setSelectedRecipient(contact.id)}
              className="flex flex-col items-center group flex-shrink-0 relative"
            >
              <div className={`p-0.5 rounded-full transition-all ${isSelected ? 'ring-2 ring-indigo-500 scale-105 shadow-md' : 'opacity-80 group-hover:opacity-100'}`}>
                <img 
                  src={contact.avatar} 
                  alt={contact.name} 
                  className="w-11 h-11 rounded-full object-cover"
                />
              </div>
              <span className={`text-[10px] font-bold mt-1.5 ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                {contact.name}
              </span>
            </button>
          );
        })}

        {/* Scroll Arrow Button */}
        <button className="w-8 h-8 rounded-full bg-white/60 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center shadow-xs flex-shrink-0">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Amount Input & Send Button */}
      <div className="flex items-center justify-between pt-2">
        <div className="relative flex items-baseline">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">$</span>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-32 bg-transparent text-3xl font-black text-slate-900 dark:text-white focus:outline-none tracking-tight ml-0.5"
            placeholder="0.00"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isSent}
          className={`px-6 py-3 rounded-full text-xs font-bold flex items-center space-x-2 transition-all shadow-lg active:scale-95 ${
            isSent 
              ? 'bg-emerald-500 text-white' 
              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:scale-105'
          }`}
        >
          {isSent ? (
            <>
              <Check className="w-4 h-4" />
              <span>Sent!</span>
            </>
          ) : (
            <>
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

    </div>
  );
}
