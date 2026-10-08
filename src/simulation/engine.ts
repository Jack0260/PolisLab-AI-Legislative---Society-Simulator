import {
  AgentStratum,
  CivicZone,
  LawPolicy,
  MicroEventLog,
  MonthlyTelemetry,
  PolicyParameters,
  SimAgent,
  SimulationRunRecord,
  StratumSummary,
} from '../types/policy';

export const STRATUM_META: Record<
  AgentStratum,
  {
    label: string;
    shortLabel: string;
    count: number; // Out of 240 total agents
    baseIncomeMean: number;
    baseTaxRate: number;
    defaultZone: CivicZone;
  }
> = {
  wage_labor: {
    label: 'Wage & Service Labor',
    shortLabel: 'Wage Labor',
    count: 84, // 35%
    baseIncomeMean: 3400,
    baseTaxRate: 0.14,
    defaultZone: 'residential_district',
  },
  skilled_pro: {
    label: 'Skilled Professionals',
    shortLabel: 'Professionals',
    count: 58, // ~24%
    baseIncomeMean: 7800,
    baseTaxRate: 0.24,
    defaultZone: 'commercial_commons',
  },
  sme_owner: {
    label: 'Small & Medium Enterprises',
    shortLabel: 'SMEs',
    count: 42, // 17.5%
    baseIncomeMean: 11200,
    baseTaxRate: 0.26,
    defaultZone: 'commercial_commons',
  },
  corporate_capital: {
    label: 'Corporate & Capital Holders',
    shortLabel: 'Corporate',
    count: 20, // ~8.3%
    baseIncomeMean: 38500,
    baseTaxRate: 0.28,
    defaultZone: 'industrial_corridor',
  },
  retiree_dependent: {
    label: 'Retirees & Vulnerable Households',
    shortLabel: 'Retirees & Dep.',
    count: 36, // 15%
    baseIncomeMean: 2350,
    baseTaxRate: 0.06,
    defaultZone: 'residential_district',
  },
};

export const ZONE_BOUNDS: Record<
  CivicZone,
  { title: string; subtitle: string; xMin: number; xMax: number; yMin: number; yMax: number }
> = {
  industrial_corridor: {
    title: '01. Industrial & Capital Corridor',
    subtitle: 'High-capital enterprises & R&D output centers',
    xMin: 0.04,
    xMax: 0.47,
    yMin: 0.06,
    yMax: 0.46,
  },
  commercial_commons: {
    title: '02. Commercial & SME Commons',
    subtitle: 'Local merchants, services & skilled professionals',
    xMin: 0.53,
    xMax: 0.96,
    yMin: 0.06,
    yMax: 0.46,
  },
  residential_district: {
    title: '03. Civic Residential & Labor District',
    subtitle: 'Wage households, public services & retirees',
    xMin: 0.04,
    xMax: 0.58,
    yMin: 0.54,
    yMax: 0.94,
  },
  shadow_fringe: {
    title: '04. Informal & Shadow Economy Fringe',
    subtitle: 'Unreported off-ledger trade & tax evasion haven',
    xMin: 0.63,
    xMax: 0.96,
    yMin: 0.54,
    yMax: 0.94,
  },
};

export const PRESET_LAWS: LawPolicy[] = [
  {
    id: 'law-baseline-2026',
    billCode: 'REF-2026-000',
    title: 'Status Quo Baseline (2026 Statutory Framework)',
    category: 'Fiscal & Taxation',
    draftedAt: 'Baseline Reference',
    isAI: false,
    preamble:
      'Maintains existing statutory marginal tax brackets, standard regulatory reporting overhead, moderate algorithmic tax audit sampling, and baseline social safety-net transfers without structural reform.',
    clauses: [
      {
        section: 'Section 101',
        heading: 'Standard Marginal Income & Corporate Schedule',
        statuteText:
          'Retains the 2026 statutory tax schedule across wage, professional, SME, and corporate tiers with zero surtax delta and standard capital depreciation allowances.',
        behavioralMechanism:
          'Agents maintain baseline labor supply and existing informal sector equilibrium (~8.5% evasion).',
      },
      {
        section: 'Section 204',
        heading: 'Routine Regulatory & Audit Sampling',
        statuteText:
          'Authorizes standard random audit sampling across commercial filings with moderate administrative paperwork requirements for small and medium enterprises.',
        behavioralMechanism:
          'Moderate compliance friction keeps most SMEs formal while leaving marginal tax avoidance unchecked.',
      },
      {
        section: 'Section 310',
        heading: 'Baseline Public Infrastructure Allocation',
        statuteText:
          'Allocates 45% of net fiscal receipts toward municipal infrastructure, public healthcare, and standard workforce maintenance programs.',
        behavioralMechanism:
          'Sustains steady 100.0 GDP index trajectory with a baseline Gini inequality index near 0.382.',
      },
    ],
    parameters: {
      taxRateDelta: 0,
      universalTransferMonthly: 200,
      enforcementIntensity: 40,
      penaltySeverity: 45,
      complianceFriction: 35,
      innovationIncentive: 30,
      publicServiceReinvestment: 45,
      minimumWageFloorIndex: 100,
    },
    hypotheses: {
      economyHypothesis: 'Steady baseline GDP index near 100 with balanced fiscal deficit/surplus.',
      fairnessHypothesis: 'Structural wealth gap persists with Gini coefficient hovering around 0.380–0.388.',
      complianceHypothesis: 'Voluntary compliance remains near 84% with stable 8–9% informal shadow drift.',
      unintendedRisk: 'Gradual wage stagnation among lower-decile service labor over multi-year horizons.',
    },
  },
  {
    id: 'law-automation-dividend',
    billCode: 'HB-2026-401',
    title: 'The Autonomous Compute Levy & Universal Citizen Dividend Act',
    category: 'Labor & Automation',
    draftedAt: 'Preset Statutory Model',
    isAI: false,
    preamble:
      'Establishes an excise surtax on high-capital industrial automation and sovereign compute clusters to fund an unconditional $850/month Universal Citizen Dividend alongside high-skill workforce transition grants.',
    clauses: [
      {
        section: 'Section 101',
        heading: 'Sovereign Compute & Industrial Automation Excise',
        statuteText:
          'Levies a +12% effective marginal surtax on corporate capital returns exceeding baseline automated output thresholds, paired with a 65-point R&D productivity tax credit for verified human-complementary tooling.',
        behavioralMechanism:
          'Increases tax burden on Corporate Capital agents while rewarding high-productivity technology reinvestment.',
      },
      {
        section: 'Section 202',
        heading: 'Unconditional Monthly Citizen Dividend',
        statuteText:
          'Distributes a non-taxable $850 monthly liquidity transfer to all Wage Labor, Retiree, and lower-tier Professional households via automated treasury rails.',
        behavioralMechanism:
          'Directly boosts bottom-40% disposable income, domestic consumer velocity, and civic trust in institutions.',
      },
      {
        section: 'Section 305',
        heading: 'Streamlined Digital Filing Protocol',
        statuteText:
          'Replaces legacy quarterly SME compliance forms with pre-populated ledger reporting, lowering administrative friction while raising automated audit verification.',
        behavioralMechanism:
          'Prevents SME flight into the shadow economy despite higher statutory wage floors.',
      },
    ],
    parameters: {
      taxRateDelta: 12,
      universalTransferMonthly: 850,
      enforcementIntensity: 62,
      penaltySeverity: 58,
      complianceFriction: 24,
      innovationIncentive: 65,
      publicServiceReinvestment: 68,
      minimumWageFloorIndex: 112,
    },
    hypotheses: {
      economyHypothesis: 'Consumer demand surge and R&D credits offset capital tax drag, lifting real GDP +4% to +7%.',
      fairnessHypothesis: 'Substantial compression of Gini inequality (~0.310) via universal floor.',
      complianceHypothesis: 'High civic trust and low friction maintain >89% voluntary compliance.',
      unintendedRisk: 'Some capital-intensive enterprises face margin compression if R&D credits are underutilized.',
    },
  },
  {
    id: 'law-flat-deregulation',
    billCode: 'SB-2026-118',
    title: 'The Zero-Friction Flat Tax & Regulatory Safe-Harbor Act',
    category: 'Fiscal & Taxation',
    draftedAt: 'Preset Statutory Model',
    isAI: false,
    preamble:
      'Slashes marginal corporate and professional tax rates by 11 percentage points, eliminates complex regulatory compliance filings, and scales back universal transfers in favor of private capital formation.',
    clauses: [
      {
        section: 'Section 101',
        heading: 'Across-the-Board Marginal Rate Reduction',
        statuteText:
          'Reduces statutory marginal rates across corporate, SME, and skilled professional brackets by 11 percentage points and repeals supplemental capital levies.',
        behavioralMechanism:
          'Maximizes private capital retention and lures evading enterprises back from the informal fringe.',
      },
      {
        section: 'Section 108',
        heading: 'Regulatory Safe-Harbor & Audit Moratorium',
        statuteText:
          'Cuts administrative filing overhead to a 10-point minimum and restricts regulatory enforcement inspections to felony fraud referrals.',
        behavioralMechanism:
          'Eliminates regulatory strain on SMEs, driving rapid commercial expansion but lowering audit deterrence.',
      },
      {
        section: 'Section 215',
        heading: 'Fiscal Consolidation of Transfer Programs',
        statuteText:
          'Caps direct household transfers at $50/month and reduces public service reinvestment to 22% of net receipts, relaxing statutory wage floors to 85.',
        behavioralMechanism:
          'Depresses low-income household wellbeing and widens the Lorenz curve gap.',
      },
    ],
    parameters: {
      taxRateDelta: -11,
      universalTransferMonthly: 50,
      enforcementIntensity: 22,
      penaltySeverity: 25,
      complianceFriction: 10,
      innovationIncentive: 55,
      publicServiceReinvestment: 22,
      minimumWageFloorIndex: 86,
    },
    hypotheses: {
      economyHypothesis: 'Strong short-term commercial output and capital retention, though public infrastructure lags.',
      fairnessHypothesis: 'Sharp rise in Gini inequality (>0.440) as top-decile wealth compounds.',
      complianceHypothesis: 'Low tax burden reduces regulatory strain, though weak enforcement allows opportunistic evasion.',
      unintendedRisk: 'Erosion of public service quality and consumer purchasing power among the bottom 40%.',
    },
  },
  {
    id: 'law-green-transition',
    billCode: 'HB-2026-709',
    title: 'The Industrial Decarbonization & Green Reinvestment Act',
    category: 'Environmental & Carbon',
    draftedAt: 'Preset Statutory Model',
    isAI: false,
    preamble:
      'Imposes strict environmental reporting mandates and carbon surtaxes on industrial emitters while channeling 82% of collected revenue into green R&D incentives, public transit, and household energy rebates.',
    clauses: [
      {
        section: 'Section 101',
        heading: 'Tiered Carbon Intensity Levy & Supply-Chain Audit',
        statuteText:
          'Assesses an +8% carbon-adjusted tax delta on industrial and commercial operations, verified through mandatory quarterly supply-chain emissions disclosures.',
        behavioralMechanism:
          'Increases compliance friction (52) for SMEs and corporations, creating moderate regulatory strain.',
      },
      {
        section: 'Section 204',
        heading: 'Clean-Tech Productivity & R&D Super-Deduction',
        statuteText:
          'Grants an 85-point innovation subsidy for enterprises adopting zero-emission tooling and electrified logistics.',
        behavioralMechanism:
          'Triggers strong long-term productivity gains from month 12 onward as firms modernize.',
      },
      {
        section: 'Section 309',
        heading: 'Universal Household Energy Rebate & Public Transit Fund',
        statuteText:
          'Reinvests 82% of net fiscal intake into civic infrastructure and issues a $480/month household energy dividend.',
        behavioralMechanism:
          'Buffers low-income households against green transition costs and elevates aggregate wellbeing.',
      },
    ],
    parameters: {
      taxRateDelta: 8,
      universalTransferMonthly: 480,
      enforcementIntensity: 68,
      penaltySeverity: 65,
      complianceFriction: 52,
      innovationIncentive: 85,
      publicServiceReinvestment: 82,
      minimumWageFloorIndex: 106,
    },
    hypotheses: {
      economyHypothesis: 'Initial compliance drag in months 1–9 followed by strong innovation-led GDP acceleration.',
      fairnessHypothesis: 'Energy rebates and high public reinvestment lower Gini to ~0.340.',
      complianceHypothesis: 'Elevated administrative reporting creates strain among smaller SMEs.',
      unintendedRisk: 'Compliance paperwork burden may push marginal SMEs into regulatory strain.',
    },
  },
  {
    id: 'law-punitive-surtax',
    billCode: 'SB-2026-304',
    title: 'The Algorithmic Wealth Surtax & High-Deterrence Audit Act',
    category: 'Digital & AI Governance',
    draftedAt: 'Preset Statutory Model',
    isAI: false,
    preamble:
      'Enacts an aggressive +24% capital surtax paired with intrusive mandatory ledger disclosures (78 friction) and severe punitive fines, testing the Laffer-curve threshold of capital flight and shadow economy evasion.',
    clauses: [
      {
        section: 'Section 101',
        heading: 'Emergency Capital & High-Bracket Surtax',
        statuteText:
          'Raises effective marginal rates by +24 percentage points on corporate, SME, and upper-professional earnings to fund a $1,150/month redistributive transfer.',
        behavioralMechanism:
          'Pushes effective tax burden above the psychological evasion threshold for many high-earning agents.',
      },
      {
        section: 'Section 203',
        heading: 'Continuous Transaction Telemetry Mandate',
        statuteText:
          'Requires itemized real-time compliance filings for all commercial transactions over $600, imposing a 78-point administrative compliance burden.',
        behavioralMechanism:
          'High compliance friction severely penalizes SME productivity and triggers widespread regulatory strain.',
      },
      {
        section: 'Section 312',
        heading: 'Mandatory Minimum Forfeiture Penalties',
        statuteText:
          'Sets enforcement intensity at 82 and penalty severity at 88, mandating asset forfeiture for detected off-ledger evasion.',
        behavioralMechanism:
          'Creates intense polarization between audited agents and those fleeing into the shadow fringe.',
      },
    ],
    parameters: {
      taxRateDelta: 24,
      universalTransferMonthly: 1150,
      enforcementIntensity: 82,
      penaltySeverity: 88,
      complianceFriction: 78,
      innovationIncentive: 15,
      publicServiceReinvestment: 55,
      minimumWageFloorIndex: 122,
    },
    hypotheses: {
      economyHypothesis: 'High compliance friction and low R&D incentives depress enterprise output and GDP.',
      fairnessHypothesis: 'Nominal redistribution reduces Gini on paper, but shrinking economic pie limits real gains.',
      complianceHypothesis: 'Severe regulatory strain and elevated shadow economy evasion despite punitive audits.',
      unintendedRisk: 'Laffer-curve fiscal shortfall as SMEs and capital holders exit formal production.',
    },
  },
];

// Deterministic PRNG (Mulberry32)
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashPolicySeed(params: PolicyParameters): number {
  const vals = [
    params.taxRateDelta,
    params.universalTransferMonthly,
    params.enforcementIntensity,
    params.penaltySeverity,
    params.complianceFriction,
    params.innovationIncentive,
    params.publicServiceReinvestment,
    params.minimumWageFloorIndex,
  ];
  let hash = 2166136261;
  for (const v of vals) {
    hash ^= Math.round(v * 100);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createInitialAgents(seed = 104729): SimAgent[] {
  const rng = createRng(seed);
  const agents: SimAgent[] = [];
  const strataOrder: AgentStratum[] = [
    'wage_labor',
    'skilled_pro',
    'sme_owner',
    'corporate_capital',
    'retiree_dependent',
  ];

  let idCounter = 1;
  for (const stratum of strataOrder) {
    const meta = STRATUM_META[stratum];
    const bounds = ZONE_BOUNDS[meta.defaultZone];

    for (let i = 0; i < meta.count; i++) {
      // Log-normal-like spread within each stratum
      const u1 = Math.max(0.001, rng());
      const u2 = rng();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const dispersion = stratum === 'corporate_capital' ? 0.42 : stratum === 'sme_owner' ? 0.35 : 0.25;
      const baseIncome = Math.round(meta.baseIncomeMean * Math.exp(z * dispersion));

      const isInitialEvader = rng() < 0.075;
      const initialZone: CivicZone = isInitialEvader ? 'shadow_fringe' : meta.defaultZone;
      const zBounds = ZONE_BOUNDS[initialZone];

      const x = zBounds.xMin + 0.03 + rng() * (zBounds.xMax - zBounds.xMin - 0.06);
      const y = zBounds.yMin + 0.06 + rng() * (zBounds.yMax - zBounds.yMin - 0.09);

      agents.push({
        id: idCounter++,
        label: `${meta.shortLabel} #${String(idCounter - 1).padStart(3, '0')}`,
        stratum,
        monthlyIncome: baseIncome,
        baselineIncome: baseIncome,
        wealth: Math.round(baseIncome * (3 + rng() * 8)),
        productivity: 0.9 + rng() * 0.25,
        taxBurdenRate: meta.baseTaxRate,
        effectiveTransferReceived: 200,
        complianceState: isInitialEvader ? 'evading' : 'compliant',
        complianceProbability: isInitialEvader ? 0.35 : 0.88,
        wellbeing: 68 + (rng() - 0.5) * 14,
        civicTrust: 0.62 + (rng() - 0.5) * 0.25,
        riskTolerance: 0.15 + rng() * 0.7,
        zone: initialZone,
        x,
        y,
        targetX: x,
        targetY: y,
        vx: (rng() - 0.5) * 0.002,
        vy: (rng() - 0.5) * 0.002,
        lastAuditMonth: -10,
      });
    }
  }

  return agents;
}

/**
 * Computes exact Lorenz Curve deciles (11 points from 0% to 100%) and Gini coefficient
 */
export function computeInequalityMetrics(incomes: number[]): {
  gini: number;
  lorenzCurve: number[];
  bottom40SharePct: number;
  top10SharePct: number;
} {
  const sorted = [...incomes].map((v) => Math.max(10, v)).sort((a, b) => a - b);
  const n = sorted.length;
  const total = sorted.reduce((acc, v) => acc + v, 0);

  if (total <= 0 || n === 0) {
    return {
      gini: 0,
      lorenzCurve: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      bottom40SharePct: 40,
      top10SharePct: 10,
    };
  }

  // Gini formula using sorted array: G = (2 * sum_{i=1}^n i * y_i) / (n * sum y_i) - (n + 1) / n
  let weightedSum = 0;
  for (let i = 0; i < n; i++) {
    weightedSum += (i + 1) * sorted[i];
  }
  const rawGini = (2 * weightedSum) / (n * total) - (n + 1) / n;
  const gini = Math.max(0.12, Math.min(0.75, rawGini));

  // Lorenz deciles
  const lorenzCurve: number[] = [0];
  for (let d = 1; d <= 10; d++) {
    const cutoffIndex = Math.floor((d / 10) * n);
    let partialSum = 0;
    for (let i = 0; i < cutoffIndex; i++) {
      partialSum += sorted[i];
    }
    lorenzCurve.push(Number(((partialSum / total) * 100).toFixed(2)));
  }

  const bottom40SharePct = lorenzCurve[4];
  const top10SharePct = Number((100 - lorenzCurve[9]).toFixed(2));

  return {
    gini: Number(gini.toFixed(3)),
    lorenzCurve,
    bottom40SharePct,
    top10SharePct,
  };
}

export function stepSimulationMonth(
  prevAgents: SimAgent[],
  month: number,
  params: PolicyParameters,
  rng: () => number
): {
  agents: SimAgent[];
  telemetry: MonthlyTelemetry;
  newEvents: MicroEventLog[];
} {
  const newEvents: MicroEventLog[] = [];

  // Calculate previous compliance peer norm
  const prevCompliantCount = prevAgents.filter(
    (a) => a.complianceState === 'compliant' || a.complianceState === 'strained' || a.complianceState === 'audited'
  ).length;
  const peerComplianceNorm = prevCompliantCount / prevAgents.length;

  // Macro multipliers from policy parameters
  const innovationBoost = 1 + ((params.innovationIncentive - 30) / 100) * 0.14 * Math.min(1, month / 18);
  const publicServiceFactor = 1 + ((params.publicServiceReinvestment - 45) / 100) * 0.12 * Math.min(1, month / 14);
  const frictionDrag = Math.max(0, (params.complianceFriction - 30) / 100) * 0.16;
  const wageFloorRatio = params.minimumWageFloorIndex / 100;

  // Wage floor excess creates minor disemployment friction if very high without innovation/demand
  const demandMultiplier = 1 + (params.universalTransferMonthly - 200) / 8000;
  const wagePressureDrag = Math.max(0, wageFloorRatio - 1.15) * 0.18;

  let totalTaxRevenue = 0;
  let totalPenaltyRevenue = 0;
  let totalTransfersPaid = 0;

  const updatedAgents: SimAgent[] = prevAgents.map((agent) => {
    const meta = STRATUM_META[agent.stratum];

    // 1. Update Agent Productivity & Gross Monthly Income
    let stratumSensitivity = 1.0;
    if (agent.stratum === 'wage_labor') {
      stratumSensitivity = wageFloorRatio * 0.65 + publicServiceFactor * 0.35 - wagePressureDrag * 0.3;
    } else if (agent.stratum === 'skilled_pro') {
      stratumSensitivity = innovationBoost * 0.6 + demandMultiplier * 0.4 - frictionDrag * 0.25;
    } else if (agent.stratum === 'sme_owner') {
      stratumSensitivity = demandMultiplier * 0.55 + innovationBoost * 0.35 - frictionDrag * 0.7 - wagePressureDrag * 0.4;
    } else if (agent.stratum === 'corporate_capital') {
      const capitalTaxDrag = Math.max(0, params.taxRateDelta) * 0.0045;
      const taxCutStimulus = Math.max(0, -params.taxRateDelta) * 0.003;
      stratumSensitivity = innovationBoost * 0.7 + demandMultiplier * 0.3 - capitalTaxDrag + taxCutStimulus - frictionDrag * 0.35;
    } else if (agent.stratum === 'retiree_dependent') {
      stratumSensitivity = publicServiceFactor * 0.5 + 0.5;
    }

    const targetProductivity = Math.max(0.55, Math.min(1.65, stratumSensitivity));
    const newProductivity = agent.productivity * 0.82 + targetProductivity * 0.18;

    // Effective statutory tax rate for this agent
    let taxDeltaShare = 0;
    if (agent.stratum === 'corporate_capital') taxDeltaShare = 1.0;
    else if (agent.stratum === 'sme_owner') taxDeltaShare = 0.75;
    else if (agent.stratum === 'skilled_pro') taxDeltaShare = 0.65;
    else if (agent.stratum === 'wage_labor') taxDeltaShare = 0.25;
    else taxDeltaShare = 0.05;

    const effectiveTaxRate = Math.max(
      0.02,
      Math.min(0.68, meta.baseTaxRate + (params.taxRateDelta / 100) * taxDeltaShare)
    );

    // Universal transfer eligibility (tapers for corporate capital)
    const transferShare =
      agent.stratum === 'corporate_capital'
        ? 0
        : agent.stratum === 'sme_owner'
          ? 0.35
          : agent.stratum === 'skilled_pro'
            ? 0.65
            : 1.0;
    const transferReceived = Math.round(params.universalTransferMonthly * transferShare);

    // 2. Behavioral Utility Model for Compliance vs Evasion
    // Perceived fairness & civic trust rises with publicServiceReinvestment and transfers, falls with extreme friction
    const targetCivicTrust = Math.max(
      0.1,
      Math.min(
        0.98,
        0.45 +
          (params.publicServiceReinvestment / 100) * 0.32 +
          (params.universalTransferMonthly / 2000) * 0.15 -
          (params.complianceFriction / 100) * 0.24
      )
    );
    const civicTrust = agent.civicTrust * 0.85 + targetCivicTrust * 0.15;

    // Deterrence utility: enforcement * penalty
    const deterrenceScore =
      (params.enforcementIntensity / 100) * 0.55 + (params.penaltySeverity / 100) * 0.45;

    // Burden pushing toward evasion: effectiveTaxRate + complianceFriction
    const complianceBurden =
      effectiveTaxRate * 0.85 + (params.complianceFriction / 100) * (agent.stratum === 'sme_owner' ? 0.65 : 0.42);

    const rawComplianceProb =
      0.52 +
      deterrenceScore * 0.48 +
      civicTrust * 0.28 +
      peerComplianceNorm * 0.14 -
      complianceBurden * (0.55 + agent.riskTolerance * 0.35);

    const complianceProbability = Math.max(0.08, Math.min(0.98, rawComplianceProb));

    // Determine state transitions
    let nextState = agent.complianceState;
    let lastAuditMonth = agent.lastAuditMonth;
    const grossIncome = Math.round(agent.baselineIncome * newProductivity);

    if (agent.complianceState === 'evading') {
      // Chance of being audited this month
      const auditProb = (params.enforcementIntensity / 100) * 0.22;
      if (rng() < auditProb) {
        nextState = 'audited';
        lastAuditMonth = month;
        const fine = Math.round(grossIncome * effectiveTaxRate * (1.2 + (params.penaltySeverity / 100) * 1.8));
        totalPenaltyRevenue += fine;
        if (newEvents.length < 3 && rng() < 0.45) {
          newEvents.push({
            id: `evt-${month}-${agent.id}`,
            month,
            agentId: agent.id,
            stratum: agent.stratum,
            type: 'audit',
            message: `${agent.label} audited in Shadow Fringe; assessed $${fine.toLocaleString()} penalty and returned to formal ledger.`,
          });
        }
      } else if (rng() < complianceProbability * 0.25) {
        // Voluntary return to formal sector
        nextState = 'compliant';
      }
    } else {
      // Currently in formal sector (compliant, strained, or recently audited)
      const evasionThreshold = 1 - complianceProbability;
      if (month - lastAuditMonth > 4 && rng() < evasionThreshold * 0.28) {
        nextState = 'evading';
        if (newEvents.length < 3 && rng() < 0.35) {
          newEvents.push({
            id: `evt-${month}-${agent.id}`,
            month,
            agentId: agent.id,
            stratum: agent.stratum,
            type: 'evasion',
            message: `${agent.label} exited formal compliance due to ${(effectiveTaxRate * 100).toFixed(0)}% tax rate & ${params.complianceFriction} friction index.`,
          });
        }
      } else {
        // Check if strained by high friction or tax
        const isStrained =
          complianceBurden > 0.46 || (params.complianceFriction > 55 && agent.stratum === 'sme_owner');
        if (month - lastAuditMonth <= 2) {
          nextState = 'audited';
        } else if (isStrained && rng() < 0.65) {
          nextState = 'strained';
          if (agent.complianceState === 'compliant' && newEvents.length < 3 && rng() < 0.15) {
            newEvents.push({
              id: `evt-${month}-${agent.id}`,
              month,
              agentId: agent.id,
              stratum: agent.stratum,
              type: 'strain',
              message: `${agent.label} entered regulatory strain under compliance overhead (${params.complianceFriction}/100).`,
            });
          }
        } else {
          nextState = 'compliant';
        }
      }
    }

    // Net disposable income & fiscal accounting
    let netDisposableIncome = grossIncome;
    if (nextState === 'evading') {
      // Evaders keep 85% of gross (15% informal inefficiency cost) and receive only 30% of transfers
      netDisposableIncome = Math.round(grossIncome * 0.88 + transferReceived * 0.3);
      totalTransfersPaid += Math.round(transferReceived * 0.3);
    } else {
      const taxPaid = Math.round(grossIncome * effectiveTaxRate);
      totalTaxRevenue += taxPaid;
      totalTransfersPaid += transferReceived;
      netDisposableIncome = Math.max(400, grossIncome - taxPaid + transferReceived);
    }

    // Update spatial zone target based on compliance state
    const targetZone: CivicZone = nextState === 'evading' ? 'shadow_fringe' : meta.defaultZone;
    let targetX = agent.targetX;
    let targetY = agent.targetY;
    if (targetZone !== agent.zone || rng() < 0.25) {
      const zBounds = ZONE_BOUNDS[targetZone];
      targetX = zBounds.xMin + 0.035 + rng() * (zBounds.xMax - zBounds.xMin - 0.07);
      targetY = zBounds.yMin + 0.065 + rng() * (zBounds.yMax - zBounds.yMin - 0.1);
    }

    // Wellbeing score (0 to 100)
    const incomeRatio = netDisposableIncome / Math.max(1000, agent.baselineIncome * (1 - meta.baseTaxRate) + 200);
    const serviceBonus = (params.publicServiceReinvestment - 45) * 0.22;
    const strainPenalty = nextState === 'strained' ? 9 : nextState === 'evading' ? 6 : nextState === 'audited' ? 14 : 0;
    const rawWellbeing = 64 + (incomeRatio - 1) * 32 + serviceBonus - strainPenalty;
    const wellbeing = Math.max(18, Math.min(98, agent.wellbeing * 0.7 + rawWellbeing * 0.3));

    return {
      ...agent,
      monthlyIncome: netDisposableIncome,
      wealth: Math.max(500, agent.wealth + Math.round((netDisposableIncome - agent.baselineIncome * 0.72) * 0.25)),
      productivity: newProductivity,
      taxBurdenRate: effectiveTaxRate,
      effectiveTransferReceived: transferReceived,
      complianceState: nextState,
      complianceProbability,
      wellbeing,
      civicTrust,
      zone: targetZone,
      targetX,
      targetY,
      lastAuditMonth,
    };
  });

  // Compute aggregate macro & distributional metrics
  const incomes = updatedAgents.map((a) => a.monthlyIncome);
  const { gini, lorenzCurve, bottom40SharePct, top10SharePct } = computeInequalityMetrics(incomes);

  const avgProductivity =
    updatedAgents.reduce((sum, a) => sum + a.productivity, 0) / updatedAgents.length;
  const evadingCount = updatedAgents.filter((a) => a.complianceState === 'evading').length;
  const strainedCount = updatedAgents.filter((a) => a.complianceState === 'strained').length;
  const compliantTotal = updatedAgents.length - evadingCount;

  const complianceRate = Number(((compliantTotal / updatedAgents.length) * 100).toFixed(1));
  const evasionRate = Number(((evadingCount / updatedAgents.length) * 100).toFixed(1));
  const strainedRate = Number(((strainedCount / updatedAgents.length) * 100).toFixed(1));

  // Formal GDP Index (baseline = 100.0)
  const formalActivityFactor = 1 - (evadingCount / updatedAgents.length) * 0.35;
  const gdpIndex = Number((100 * avgProductivity * formalActivityFactor * 1.03).toFixed(1));
  const productivityIndex = Number((100 * avgProductivity).toFixed(1));

  // Fiscal Balance ($B annualized scaled from 240-agent micro-economy)
  const enforcementAdminCost = (params.enforcementIntensity / 100) * 185000;
  const innovationSubsidyCost = (params.innovationIncentive / 100) * 240000;
  const publicServiceSpend =
    Math.max(0, totalTaxRevenue + totalPenaltyRevenue - totalTransfersPaid) *
    (params.publicServiceReinvestment / 100) *
    0.55;

  const monthlyNetFiscal =
    totalTaxRevenue +
    totalPenaltyRevenue -
    totalTransfersPaid -
    enforcementAdminCost -
    innovationSubsidyCost -
    publicServiceSpend;
  const fiscalBalanceB = Number(((monthlyNetFiscal / 100000) * 4.2).toFixed(2));

  const wellbeingIndex = Number(
    (updatedAgents.reduce((s, a) => s + a.wellbeing, 0) / updatedAgents.length).toFixed(1)
  );

  const unemploymentRate = Number(
    Math.max(
      2.1,
      Math.min(
        18.5,
        4.6 + Math.max(0, wageFloorRatio - 1.12) * 9.5 + (evasionRate - 8.0) * 0.22 - (gdpIndex - 100) * 0.18
      )
    ).toFixed(1)
  );

  // Build stratum breakdown
  const strataOrder: AgentStratum[] = [
    'wage_labor',
    'skilled_pro',
    'sme_owner',
    'corporate_capital',
    'retiree_dependent',
  ];

  const strata: StratumSummary[] = strataOrder.map((st) => {
    const group = updatedAgents.filter((a) => a.stratum === st);
    const avgInc = group.reduce((s, a) => s + a.monthlyIncome, 0) / group.length;
    const baseInc = group.reduce((s, a) => s + a.baselineIncome * (1 - STRATUM_META[st].baseTaxRate) + 200, 0) / group.length;
    const deltaPct = ((avgInc - baseInc) / baseInc) * 100;
    const avgWb = group.reduce((s, a) => s + a.wellbeing, 0) / group.length;
    const ev = group.filter((a) => a.complianceState === 'evading').length;
    const str = group.filter((a) => a.complianceState === 'strained').length;

    return {
      stratum: st,
      label: STRATUM_META[st].label,
      populationShare: Number(((group.length / updatedAgents.length) * 100).toFixed(1)),
      avgMonthlyIncome: Math.round(avgInc),
      incomeDeltaPct: Number(deltaPct.toFixed(1)),
      avgWellbeing: Number(avgWb.toFixed(1)),
      complianceRate: Number((((group.length - ev) / group.length) * 100).toFixed(1)),
      evasionRate: Number(((ev / group.length) * 100).toFixed(1)),
      strainedRate: Number(((str / group.length) * 100).toFixed(1)),
    };
  });

  const telemetry: MonthlyTelemetry = {
    month,
    gdpIndex,
    gini,
    complianceRate,
    strainedRate,
    evasionRate,
    fiscalBalanceB,
    wellbeingIndex,
    productivityIndex,
    unemploymentRate,
    bottom40SharePct,
    top10SharePct,
    lorenzCurve,
    strata,
  };

  return {
    agents: updatedAgents,
    telemetry,
    newEvents,
  };
}

/**
 * Runs a complete multi-month simulation for a LawPolicy and returns the full record
 */
export function runBatchSimulation(policy: LawPolicy, totalMonths = 36): SimulationRunRecord {
  const seed = hashPolicySeed(policy.parameters);
  const rng = createRng(seed);
  let agents = createInitialAgents(104729);
  const history: MonthlyTelemetry[] = [];
  const allEvents: MicroEventLog[] = [];

  // Month 0 initial snapshot
  const m0 = stepSimulationMonth(agents, 0, PRESET_LAWS[0].parameters, createRng(104729));
  history.push(m0.telemetry);

  for (let m = 1; m <= totalMonths; m++) {
    const step = stepSimulationMonth(agents, m, policy.parameters, rng);
    agents = step.agents;
    history.push(step.telemetry);
    allEvents.push(...step.newEvents);
  }

  return {
    policy,
    history,
    finalMetrics: history[history.length - 1],
    events: allEvents.slice(-24).reverse(),
  };
}
