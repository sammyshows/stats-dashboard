interface UsersTableRowProp {
  index: number,
  id: string,
  levelsCompleted: number,
  adsWatchedCount: number,
  zeroLivesCount: number,
  letterlockVersion: string,
  username: string,
  testUser: boolean,
  deviceModel: string,
  deviceOS: string,
  updatedAt: string,
  createdAt: string,
  levelAttempts1Day: number,
  levelAttempts7Days: number,
  levelAttempts30Days: number,
  levelSuccesses1Day: number,
  levelSuccesses7Days: number,
  levelSuccesses30Days: number,
  getUsers: () => void
}

export type { UsersTableRowProp }
