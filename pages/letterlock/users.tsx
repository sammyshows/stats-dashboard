import { useEffect, useState } from 'react';
import Spinner from "@/components/Utility/Spinner";
import UsersTableHead from "@/components/Letterlock/Users/UsersTableHead";
import UsersTableRow from "@/components/Letterlock/Users/UsersTableRow";

export default function Users() {
  const [users, setUsers] = useState([] as (Array<any>));
  const [sortField, setSortField] = useState(localStorage.getItem('sortField') || 'username');
  const [sortDirection, setSortDirection] = useState(localStorage.getItem('sortDirection') || 'desc');
  const [showGenuineUsersOnly, setShowGenuineUsersOnly] = useState(localStorage.getItem('showGenuineUsersOnly') === 'true');

  const getUsers = async (): Promise<void> => {
    const response = await fetch('/api/letterlock-users-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const res = await response.json();
    setUsers(res.users);
  };

  useEffect(() => {
    getUsers();
  }, []);

  useEffect(() => {
    localStorage.setItem('sortField', sortField);
    localStorage.setItem('sortDirection', sortDirection);
    localStorage.setItem('showGenuineUsersOnly', showGenuineUsersOnly.toString());
  }, [sortField, sortDirection, showGenuineUsersOnly]);

  const handleSort = (field: string) => {
    const isSameField = sortField === field;
    const newDirection = isSameField ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'desc';
    setSortDirection(newDirection);
    setSortField(field);
  };

  const filteredUsers = showGenuineUsersOnly
    ? users.filter((user) => !user.test_user && user.levels_completed_count > 1)
    : users;

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue;
    let bValue;

    // Handle computed field for adsWatchedCount, since it's a sum of two fields
    if (sortField === 'ads_watched_count') {
      aValue = a.ads_watched_lives + a.ads_watched_moves;
      bValue = b.ads_watched_lives + b.ads_watched_moves;
    } else {
      aValue = a[sortField];
      bValue = b[sortField];
    }

    // Handle numeric fields stored as strings
    if (!isNaN(aValue) && !isNaN(bValue)) {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }
    // Handle case-insensitive string comparison
    else if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="grow flex flex-col px-10 py-5 overflow-hidden">
      <div className="w-full flex justify-end items-center pb-5">
        {/* <h1 className="text-5xl font-semibold text-ll-orange">Users</h1> */}
        <button
          className="w-48 bg-blue-500 text-white text-xs px-2 py-2 rounded"
          onClick={() => setShowGenuineUsersOnly(!showGenuineUsersOnly)}>
          {showGenuineUsersOnly ? "Show All Users" : "Show Genuine Users Only"}
        </button>
      </div>

      <div className="flex flex-col grow border border-ll-orange rounded overflow-scroll">
        <UsersTableHead sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
        {sortedUsers.length ? (
          sortedUsers.map((user, index) => (
            <UsersTableRow
              key={user.user_id}
              index={index + 1}
              id={user.user_id}
              username={user.username}
              testUser={user.test_user}
              deviceModel={user.device_model}
              levelsCompleted={user.levels_completed_count}
              adsWatchedCount={user.ads_watched_lives + user.ads_watched_moves}
              zeroLivesCount={user.zero_lives_tally}
              letterlockVersion={user.letterlock_version}
              deviceOS={user.device_os}
              updatedAt={user.updated_at}
              createdAt={user.created_at}
              levelAttempts1Day={user.level_attempts_1_day}
              levelAttempts7Days={user.level_attempts_7_days}
              levelAttempts30Days={user.level_attempts_30_days}
              levelSuccesses1Day={user.level_successes_1_day}
              levelSuccesses7Days={user.level_successes_7_days}
              levelSuccesses30Days={user.level_successes_30_days}
              getUsers={getUsers}
            />
          ))
        ) : (
          <Spinner />
        )}
      </div>
    </div>
  );
}
