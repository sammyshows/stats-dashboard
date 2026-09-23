import React, { useState } from 'react';
import { createPortal as reactDomCreatePortal } from 'react-dom';
import { UsersTableRowProp } from "@/interfaces/letterlock/users";

// Typed loosely to stay immune to @types/react / @types/react-dom version skew on CI.
const createPortal: (child: any, container: Element | DocumentFragment) => any = reactDomCreatePortal;

interface UserSettingsModalProps {
  user: UsersTableRowProp;
  onClose: (getUsers: boolean) => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ user, onClose }) => {
  const [isTestUser, setIsTestUser] = useState(user.testUser);

  const handleSave = async () => {
    const updatedUser = { ...user, testUser: isTestUser };

    await fetch('/api/letterlock-user-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: updatedUser }),
    });

    onClose(true);
  };

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose(false);
    }
  };

  return createPortal(
    <div
      className="elora-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      onClick={handleClickOutside}
    >
      <div className="elora-modal-panel elora-card w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">{user.username || user.id}</h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">...{user.id.slice(-8)}</p>
          </div>
          <button
            onClick={() => onClose(false)}
            className="shrink-0 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-slate-800">
          <span className="text-sm text-slate-300 font-medium">Test user</span>
          <button
            role="switch"
            aria-checked={isTestUser}
            onClick={() => setIsTestUser(!isTestUser)}
            className={`relative w-10 h-6 rounded-full transition-colors ${isTestUser ? 'bg-violet-500' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isTestUser ? 'translate-x-4' : ''}`} />
          </button>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={() => onClose(false)}
            className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium text-white bg-violet-500 hover:bg-violet-400 rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UserSettingsModal;