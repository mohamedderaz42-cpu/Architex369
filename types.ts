
// Role-Based Access Control (RBAC)
export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  OPERATOR = 'OPERATOR',
  EXECUTIVE = 'EXECUTIVE',
  SUPER_ADMIN = 'SUPER_ADMIN', // The Founder
  VENDOR = 'VENDOR', // Phase 5
  ARBITER = 'ARBITER', // Phase 7
  ENTERPRISE_ADMIN = 'ENTERPRISE_ADMIN', // Phase 9
  DEVELOPER = 'DEVELOPER', // Phase 11
  AUDITOR = 'AUDITOR' // Phase 12
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
  acceleratorExpiry: number; // Phase 4: Timestamp for Accelerator Subscription
  vendorVerified?: boolean; // Phase 5: KYB Status
  erpConnected?: boolean; // Phase 5: ERP Sync Status
  isProvider?: boolean; // Phase 6: Gig Provider Status
  rating?: number; // Phase 6: Provider Rating
  reputationScore?: number; // Phase 7: Global Trust Score
  badges?: SoulboundBadge[]; // Phase 7: SBTs
  isFrozen?: boolean; // Phase 7: Panic Button State
  companyName?: string; // Phase 9
  greenScore?: number; // Phase 10
  installedPlugins?: string[]; // Phase 11
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
  type: 'MINT' | 'BURN' | 'TRANSFER' | 'TIP' | 'SWAP' | 'STAKE' | 'UNSTAKE' | 'EXECUTE_PROPOSAL' | 'FEE_ROUTING' | 'REVENUE_DEPOSIT' | 'SUBSCRIBE' | 'COMMERCE_ESCROW' | 'COMMERCE_RELEASE' | 'INSURANCE_CLAIM' | 'GIG_PAYMENT' | 'GIG_FEE' | 'DISPUTE_RESOLUTION' | 'ARBITRATION_REWARD' | 'TENDER_DEPOSIT' | 'TENDER_PAYOUT' | 'CARBON_OFFSET' | 'PLUGIN_PURCHASE' | 'BOUNTY_PAYOUT';
  amount: number;
  timestamp: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  hash?: string;
}

export type ViewState = 'DASHBOARD' | 'SOCIAL' | 'VESTING' | 'GOD_MODE' | 'SETTINGS' | 'IOT' | 'DEFI' | 'COMMERCE' | 'ARCHITEX_GO' | 'ARBITRATION' | 'ENTERPRISE' | 'SUSTAINABILITY' | 'ECOSYSTEM' | 'AUDIT';

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

export interface PricePoint {
  time: string;
  price: number;
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

// --- Phase 5: Commerce & Vendor Shield ---

export enum ShippingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED', // Triggers Smart Release
  DISPUTED = 'DISPUTED'
}

export interface CommerceOrder {
  id: string;
  buyerId: string;
  vendorId: string;
  item: string;
  amount: number;
  insuranceFee: number; // Micro-insurance
  status: ShippingStatus;
  escrowTxId: string;
  trackingHash?: string;
}

// --- Phase 6: Architex Go ---

export enum GigStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED'
}

export interface ServiceGig {
  id: string;
  providerId?: string;
  consumerId: string;
  title: string;
  description: string;
  price: number;
  status: GigStatus;
  location: string; // GPS coords or Zone
  timestamp: number;
}

// --- Phase 7: Arbitration & Security ---

export interface SoulboundBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  issuedAt: number;
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  VOTING = 'VOTING',
  RESOLVED_REFUND = 'RESOLVED_REFUND',
  RESOLVED_RELEASE = 'RESOLVED_RELEASE'
}

export interface Dispute {
  id: string;
  relatedOrderId: string; // Or GigId
  plaintiffId: string;
  defendantId: string;
  reason: string;
  evidenceHash: string;
  status: DisputeStatus;
  assignedArbiters: string[]; // Arbiter User IDs
  votesForPlaintiff: number;
  votesForDefendant: number;
  createdAt: number;
}

// --- Phase 9: Enterprise & Privacy ---

export interface ZkProof {
  id: string;
  type: 'SOLVENCY' | 'IDENTITY';
  proofHash: string; // The "ZK-Snark" output
  timestamp: number;
  verified: boolean;
}

export enum TenderStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  AWARDED = 'AWARDED'
}

export interface Bid {
  vendorId: string;
  vendorName: string;
  amount: number;
  proposalHash: string;
  timestamp: number;
}

export interface Tender {
  id: string;
  enterpriseId: string;
  title: string;
  description: string;
  budgetCap: number;
  status: TenderStatus;
  bids: Bid[];
  awardedTo?: string;
  deadline: number;
}

// --- Phase 10: Sustainability ---

export enum SustainabilityTag {
  RECYCLED = 'RECYCLED',
  BIODEGRADABLE = 'BIODEGRADABLE',
  LOCAL = 'LOCAL',
  CARBON_NEUTRAL = 'CARBON_NEUTRAL'
}

export interface MaterialPassport {
  id: string;
  name: string;
  origin: string;
  composition: string; // e.g. "100% Recycled Aluminum"
  carbonFootprint: number; // kg CO2e
  recyclability: number; // %
  tags: SustainabilityTag[];
  issueDate: number;
}

export interface CarbonRecord {
    userId: string;
    totalOffset: number; // kg CO2
    greenScore: number; // 0-100
}

// --- Phase 11: Ecosystem (Plugins & SDK) ---

export enum PluginCategory {
  DEFI = 'DEFI',
  UI_THEME = 'UI_THEME',
  ANALYTICS = 'ANALYTICS',
  SECURITY = 'SECURITY',
  UTILITY = 'UTILITY'
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  price: number; // in ARTX
  rating: number; // 0-5
  category: PluginCategory;
  installed: boolean; // Local state helper
  icon: string;
  version: string;
}

// --- Phase 12: Auditing ---

export interface AuditReport {
  id: string;
  firm: string; // CertiK, Quantstamp, etc.
  date: number;
  score: number;
  findings: number;
  status: 'PASSED' | 'ISSUES_FOUND' | 'PENDING';
  pdfUrl: string;
}

export interface BountySubmission {
  id: string;
  reporterId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PAID';
  reward: number;
  timestamp: number;
}
