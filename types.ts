// Role-Based Access Control (RBAC)
export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  OPERATOR = 'OPERATOR',
  EXECUTIVE = 'EXECUTIVE',
  SUPER_ADMIN = 'SUPER_ADMIN' // The Founder
}

// Tokenomics Categories
export enum VestingCategory {
  LIQUIDITY_POOL = 'Liquidity Pool',
  REWARDS_VAULT = 'Rewards Vault',
  TEAM_FOUNDERS = 'Team & Founders',
  STRATEGIC_RESERVE = 'Strategic Reserve',
  MARKETING = 'Marketing & Partnerships'
}

export interface VestingSchedule {
  category: VestingCategory;
  totalAllocation: number;
  unlocked: number;
  locked: number;
  releaseRule: string; // Description of the smart contract rule
  color: string;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  piWalletAddress: string;
  artxBalance: number;
  hasTrustline: boolean;
  kycVerified: boolean;
  isPremium: boolean; // For Pay-to-Load protocol
  stakedAmount: number;
}

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
  tips: number; // In ARTX
  verified: boolean; // Pi KYC Verified badge
}

export interface Transaction {
  id: string;
  type: 'MINT' | 'BURN' | 'TRANSFER' | 'TIP' | 'SWAP' | 'STAKE' | 'UNSTAKE' | 'EXECUTE_PROPOSAL' | 'FEE_ROUTING' | 'REVENUE_DEPOSIT';
  amount: number;
  timestamp: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  hash?: string;
}

export type ViewState = 'DASHBOARD' | 'SOCIAL' | 'VESTING' | 'GOD_MODE' | 'SETTINGS' | 'IOT' | 'DEFI';

// --- Phase 1 Types ---

export type Language = 'en' | 'ar';
export type ThemeMode = 'dark' | 'light';

export interface SystemConfig {
  maintenanceMode: boolean;
  globalAnnouncement: string | null;
  forcedLanguage: Language | null;
  adsEnabled: boolean;
  feeRoutingTarget: 'TREASURY' | 'BURN_ADDRESS'; // Phase 3.1
}

export interface IoTDevice {
  id: string;
  name: string;
  type: 'SENSOR' | 'DRONE' | 'ACCESS_POINT' | 'DISPLAY';
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  location: string;
  lastPing: number;
}

// --- Phase 2: Economy & Contracts Types ---

// 2.1 AdminAccessControl (Multi-Sig)
export interface MultiSigProposal {
  id: string;
  contract: string;
  functionName: string;
  payload: any;
  proposer: string;
  approvals: string[]; // List of Executive IDs
  requiredSignatures: number;
  status: 'ACTIVE' | 'EXECUTED' | 'REJECTED';
  expiresAt: number;
}

// 2.4 OraclePriceFeed
export interface OracleData {
  pair: string; // e.g., 'ARTX/Pi'
  price: number;
  lastUpdate: number;
  confidence: number;
}

// 2.5 NativeSwapAMM
export interface LiquidityPool {
  id: string;
  tokenA: string; // 'ARTX'
  tokenB: string; // 'Pi'
  reserveA: number;
  reserveB: number;
  apr: number;
}

// 2.10 StakingRewardsContract
export interface StakingPosition {
  userId: string;
  amount: number;
  lockedUntil: number;
  rewardsAccrued: number;
  apy: number;
}

// 2.13 LegalRegistry
export interface LegalDoc {
  id: string;
  title: string;
  hash: string; // IPFS Hash
  version: string;
  acceptedBy: string[]; // User IDs
}

// --- Phase 3: Financial Automation ---

export interface TreasuryStats {
  address: string;
  artxBalance: number;
  piBalance: number;
  collectedFeesTotal: number;
  revenueTotal: number;
}