import React, { useState } from 'react';
import { UsersTableRowProp } from "@/interfaces/letterlock/users";
import dayjs from 'dayjs';
import UserModal from './UserModal';

export default function UsersTableRow(user: UsersTableRowProp) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = (getUsers) => {
    setIsModalOpen(false);

    if (getUsers) {
      user.getUsers();
    }
  };

  return (
    <>
      <div
        onClick={handleRowClick}
        className={`flex justify-between items-center px-2 cursor-pointer text-gray-600 hover:bg-emerald-100 duration-100 ${user.index % 2 !== 0 ? ' bg-slate-200/70' : ''}`}
      >
        <p className="h-6 w-12 flex justify-center items-center px-2 text-sm border-r border-gray-500">{user.index}</p>
        <p className="h-6 w-40 flex justify-left items-center px-2 text-sm border-r border-gray-500">{user.username || '-'}</p>
        <p className="h-6 w-32 grow flex justify-left items-center px-2 text-sm border-r border-gray-500">{user.deviceModel || '-'}</p>
        <div className="h-6 w-40 flex gap-2 justify-between items-center pl-7 text-sm border-r border-gray-500">
          <p className="relative w-1/3">
            {user.levelSuccesses1Day}
            <span className="absolute -top-1 ml-0.5 text-xs text-gray-400">{user.levelAttempts1Day}</span>
          </p>
          <p className="relative w-1/3">
            {user.levelSuccesses7Days}
            <span className="absolute -top-1 ml-0.5 text-xs text-gray-400">{user.levelAttempts7Days}</span>
          </p>
          <p className="relative w-1/3">
            {user.levelSuccesses30Days}
            <span className="absolute -top-1 ml-0.5 text-xs text-gray-400">{user.levelAttempts30Days}</span>
          </p>
        </div>
        <p className="h-6 w-32 flex justify-center items-center px-2 text-sm border-r border-gray-500">{user.levelsCompleted}</p>
        <p className="h-6 w-32 flex justify-center items-center px-2 text-sm border-r border-gray-500">{user.adsWatchedCount}</p>
        <p className="h-6 w-40 flex justify-center items-center px-2 text-sm border-r border-gray-500">{user.letterlockVersion || '-'}</p>
        <p className="h-6 w-28 flex justify-center items-center px-2 text-sm border-r border-gray-500">{user.deviceOS || '-'}</p>
        <p className="h-6 w-32 flex justify-center items-center px-2 text-sm border-r border-gray-500">{dayjs(user.updatedAt).format('DD/MM/YY')}</p>
        <p className="h-6 w-32 flex justify-center items-center px-2 text-sm">{dayjs(user.createdAt).format('DD/MM/YY')}</p>
      </div>

      {isModalOpen && (
        <UserModal
          user={user}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
