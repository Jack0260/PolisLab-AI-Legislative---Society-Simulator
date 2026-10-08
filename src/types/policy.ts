export type PolicyCategory =
  | 'Fiscal & Taxation'
  | 'Labor & Automation'
  | 'Environmental & Carbon'
  | 'Housing & Urban'
  | 'Public Health & Welfare'
  | 'Digital & AI Governance';

export interface PolicyClause {
  section: string;
  heading: string;
  statuteText: string;
  behavioralMechanism: string;
}

export interface PolicyParameters {
  /** -20 to +30 percentage point change in effective marginal tax on capital/high-income */
  taxRateDelta: number;
  /** $0 to $2000 monthly universal dividend/transfer to low & middle income strata */
  universalTransferMonthly: number;
  /** 5 to 95 regulatory inspection and audit probability index */
  enforcementIntensity: number;
  /** 10 to 95 fine severity multiplier upon detected non-compliance */
  penaltySeverity: number;
  /** 5 to 90 administrative paperwork, reporting burden, and compliance overhead */
  complianceFriction: number;
  /** 0 to 95 R&D tax credit, sustainability subsidy, or productivity grant index */
  innovationIncentive: number;
  /** 10 to 95 % of net fiscal revenue reinvested in infrastructure, healthcare & education */
  publicServiceReinvestment: number;
  /** 70 to 145 statutory minimum wage floor relative to baseline 100 */
  minimumWageFloorIndex: number;
}

export interface PolicyHypotheses {
  economyHypothesis: string;
  fairnessHypothesis: string;
  complianceHypothesis: string;
  unintendedRisk: string;
}

export interface PolicyAuditReport {
  verdictHeadline: string;
  economicDiagnosis: string;
  fairnessDiagnosis: string;
  complianceDiagnosis: string;
  amendmentTitle: string;
  amendmentRationale: string;
  recommendedParameters: PolicyParameters;
}

export interface LawPolicy {
  id: string;
  billCode: string;
  title: string;
  category: PolicyCategory | string;
  draftedAt: string;
  isAI: boolean;
  preamble: string;
  clauses: PolicyClause[];
  parameters: PolicyParameters;
  hypotheses: PolicyHypotheses;
  auditReport?: PolicyAuditReport;
}

export type AgentStratum =
  | 'wage_labor'
  | 'skilled_pro'
  | 'sme_owner'
  | 'corporate_capital'
  | 'retiree_dependent';

export type ComplianceState = 'compliant' | 'strained' | 'evading' | 'audited';

export type CivicZone =
  | 'industrial_corridor'
  | 'commercial_commons'
  | 'residential_district'
  | 'shadow_fringe';

export interface SimAgent {
  id: number;
  label: string;
  stratum: AgentStratum;
  monthlyIncome: number;
  baselineIncome: number;
  wealth: number;
  productivity: number;
  taxBurdenRate: number;
  effectiveTransferReceived: number;
  complianceState: ComplianceState;
  complianceProbability: number;
  wellbeing: number;
  civicTrust: number;
  riskTolerance: number;
  zone: CivicZone;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  lastAuditMonth: number;
}

export interface StratumSummary {
  stratum: AgentStratum;
  label: string;
  populationShare: number;
  avgMonthlyIncome: number;
  incomeDeltaPct: number;
  avgWellbeing: number;
  complianceRate: number;
  evasionRate: number;
  strainedRate: number;
}

export interface MonthlyTelemetry {
  month: number;
  /** Baseline = 100.0 */
  gdpIndex: number;
  /** 0.000 to 1.000 */
  gini: number;
  /** 0 to 100% */
  complianceRate: number;
  /** 0 to 100% */
  strainedRate: number;
  /** 0 to 100% */
  evasionRate: number;
  /** Annualized net fiscal balance in $ Billions */
  fiscalBalanceB: number;
  /** Aggregate societal wellbeing 0-100 */
  wellbeingIndex: number;
  /** Productivity & innovation index (Baseline = 100.0) */
  productivityIndex: number;
  /** Unemployment / informal displacement rate % */
  unemploymentRate: number;
  /** Share of total income held by bottom 40% of agents */
  bottom40SharePct: number;
  /** Share of total income held by top 10% of agents */
  top10SharePct: number;
  /** Cumulative wealth shares across 10 deciles (for Lorenz curve, 11 points from 0 to 100) */
  lorenzCurve: number[];
  /** Breakdown by socio-economic stratum */
  strata: StratumSummary[];
}

export interface MicroEventLog {
  id: string;
  month: number;
  agentId: number;
  stratum: AgentStratum;
  type: 'evasion' | 'audit' | 'mobility_up' | 'strain' | 'innovation';
  message: string;
}

export interface SimulationRunRecord {
  policy: LawPolicy;
  history: MonthlyTelemetry[];
  finalMetrics: MonthlyTelemetry;
  events: MicroEventLog[];
}
