import Image from 'next/image';

export default function UsersTableHead({ sortField, sortDirection, onSort }) {
  const getChevronClass = (field) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? 'rotate-180' : 'rotate-0';
    }
    return 'hidden';
  };

  return (
    <div className="flex items-center py-1 px-2 border-b border-gray-300 text-sm text-slate-600 font-semibold sticky top-0 bg-ll-orange z-10" style={{ fontFamily: 'Poppins-Regular' }}>
      <p className="w-12 px-2 text-center">#</p>
      <p className="relative w-40 px-2 text-center cursor-pointer flex items-center justify-center" onClick={() => onSort('username')}>
        Username
        <Image src="/icons/chevron.svg" alt="chevron" className={`absolute right-1 transition-transform duration-300 ${getChevronClass('username')}`} width={12} height={12} />
      </p>
      <p className="relative w-32 grow px-2 text-center cursor-pointer flex items-center justify-center" onClick={() => onSort('device_model')}>
        Device Model
        <Image src="/icons/chevron.svg" alt="chevron" className={`absolute right-1 transition-transform duration-300 ${getChevronClass('device_model')}`} width={12} height={12} />
      </p>
      <div className="w-40 text-center">
        <p className="text-xs">Levels Accomplished</p>
        <div className="flex justify-between pl-3 pr-2 text-xs">
          <p className="relative w-1/3 cursor-pointer flex items-center justify-center" onClick={() => onSort('level_attempts_1_day')}>
            24H
            <Image src="/icons/chevron.svg" alt="chevron" className={`absolute right-0 transition-transform duration-300 ${getChevronClass('level_attempts_1_day')}`} width={12} height={12} />
          </p>
          <p className="relative w-1/3 cursor-pointer flex items-center justify-center" onClick={() => onSort('level_attempts_7_days')}>
            7D
            <Image src="/icons/chevron.svg" alt="chevron" className={`absolute right-0 transition-transform duration-300 ${getChevronClass('level_attempts_7_days')}`} width={12} height={12} />
          </p>
          <p className="relative w-1/3 cursor-pointer flex items-center justify-center" onClick={() => onSort('level_attempts_28_days')}>
            30D
            <Image src="/icons/chevron.svg" alt="chevron" className={`absolute right-0 transition-transform duration-300 ${getChevronClass('level_attempts_28_days')}`} width={12} height={12} />
          </p>
        </div>
      </div>
      <p className="relative w-32 px-2 text-center cursor-pointer flex items-center justify-center" onClick={() => onSort('levels_completed_count')}>
        Current Level
        <Image src="/icons/chevron.svg" alt="chevron" className={`absolute right-1 transition-transform duration-300 ${getChevronClass('levels_completed_count')}`} width={12} height={12} />
      </p>
      <p className="relative w-32 px-2 text-center cursor-pointer flex items-center justify-center" onClick={() => onSort('ads_watched_count')}>
        Ads Watched
        <Image src="/icons/chevron.svg" alt="chevron" className={`absolute right-1 transition-transform duration-300 ${getChevronClass('ads_watched_count')}`} width={12} height={12} />
      </p>
      <p className="relative w-40 px-1 text-center cursor-pointer flex items-center justify-center" onClick={() => onSort('letterlock_version')}>
        LetterLock Version
        <Image src="/icons/chevron.svg" alt="chevron" className={`absolute right-1 transition-transform duration-300 ${getChevronClass('letterlock_version')}`} width={12} height={12} />
      </p>
      <p className="relative w-28 px-2 text-center flex items-center justify-center">
        Device OS
      </p>
      <p className="relative w-32 px-2 text-center cursor-pointer flex items-center justify-center" onClick={() => onSort('updated_at')}>
        Updated At
        <Image src="/icons/chevron.svg" alt="chevron" className={`absolute right-1 transition-transform duration-300 ${getChevronClass('updated_at')}`} width={12} height={12} />
      </p>
      <p className="relative w-32 px-2 text-center cursor-pointer flex items-center justify-center" onClick={() => onSort('created_at')}>
        Created At
        <Image src="/icons/chevron.svg" alt="chevron" className={`absolute right-1 transition-transform duration-300 ${getChevronClass('created_at')}`} width={12} height={12} />
      </p>
    </div>
  );
}
