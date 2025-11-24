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
  type: 'MINT' | 'BURN' | 'TRANSFER' | 'TIP';
  amount: number;
  timestamp: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export type ViewState = 'DASHBOARD' | 'SOCIAL' | 'VESTING' | 'GOD_MODE' | 'SETTINGS' | 'IOT';

// --- New Types for Phase 1 ---

export type Language = 'en' | 'ar';
export type ThemeMode = 'dark' | 'light'; // Palladium is dark by default, but structure allows expansion

export interface SystemConfig {
  maintenanceMode: boolean;
  globalAnnouncement: string | null;
  forcedLanguage: Language | null;
  adsEnabled: boolean;
}

export interface IoTDevice {
  id: string;
  name: string;
  type: 'SENSOR' | 'DRONE' | 'ACCESS_POINT' | 'DISPLAY';
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  location: string;
  lastPing: number;
}