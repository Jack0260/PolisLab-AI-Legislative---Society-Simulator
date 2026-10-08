import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Endpoint 1: AI Legislative Drafter
  app.post('/api/policies/draft', async (req, res) => {
    try {
      const { prompt, focusArea, jurisdictionScale } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'A policy objective or prompt is required.' });
      }

      const systemInstruction = `You are a non-partisan Senior Legislative Counsel and Computational Economist.
Draft a rigorous, realistic hypothetical statute based on the user's policy concept, and calibrate its quantitative parameters for an agent-based socio-economic simulator.
Ensure clauses use authentic statutory language (Sections, Subsections, Definitions, Enforcement Mechanisms, Fiscal Allocations) and that the numerical parameters accurately reflect the economic incentives, redistribution mechanisms, and regulatory friction implied by the bill.`;

      const userPrompt = `Draft a comprehensive hypothetical law for the following policy directive:
Directive: "${prompt}"
Primary Domain Hint: ${focusArea || 'General Socio-Economic Policy'}
Jurisdiction Context: ${jurisdictionScale || 'National Mixed-Market Economy'}

Calibrate the simulation parameters strictly within these bounds:
- taxRateDelta: number between -20 and +30 (percentage point change in effective marginal tax on capital/high-income)
- universalTransferMonthly: number between 0 and 2000 (USD monthly direct dividend/transfer to low & middle income strata)
- enforcementIntensity: number between 5 and 95 (regulatory inspection and algorithmic audit probability index)
- penaltySeverity: number between 10 and 95 (financial fine multiplier upon detected non-compliance)
- complianceFriction: number between 5 and 90 (administrative paperwork, reporting burden, and operational overhead index)
- innovationIncentive: number between 0 and 95 (R&D tax credit, green transition subsidy, or productivity grant index)
- publicServiceReinvestment: number between 10 and 95 (% of net fiscal intake dedicated to healthcare, infrastructure, and upskilling)
- minimumWageFloorIndex: number between 70 and 145 (statutory wage floor relative to baseline 100)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              billCode: {
                type: Type.STRING,
                description: 'Legislative reference code such as HB-2026-512 or SB-804',
              },
              title: {
                type: Type.STRING,
                description: 'Formal legislative short title of the act',
              },
              category: {
                type: Type.STRING,
                description:
                  'One of: Fiscal & Taxation, Labor & Automation, Environmental & Carbon, Housing & Urban, Public Health & Welfare, Digital & AI Governance',
              },
              preamble: {
                type: Type.STRING,
                description: 'Formal legislative enacting clause and executive summary (2-3 sentences)',
              },
              clauses: {
                type: Type.ARRAY,
                description: '3 to 4 structured statutory articles/sections',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    section: {
                      type: Type.STRING,
                      description: 'Section identifier, e.g., Section 101',
                    },
                    heading: {
                      type: Type.STRING,
                      description: 'Section heading, e.g., Autonomous Capital Excise Levy',
                    },
                    statuteText: {
                      type: Type.STRING,
                      description: 'Formal statutory text specifying thresholds, duties, and exemptions',
                    },
                    behavioralMechanism: {
                      type: Type.STRING,
                      description: '1-sentence explanation of how agents in the simulation respond to this clause',
                    },
                  },
                  required: ['section', 'heading', 'statuteText', 'behavioralMechanism'],
                },
              },
              parameters: {
                type: Type.OBJECT,
                properties: {
                  taxRateDelta: { type: Type.NUMBER },
                  universalTransferMonthly: { type: Type.NUMBER },
                  enforcementIntensity: { type: Type.NUMBER },
                  penaltySeverity: { type: Type.NUMBER },
                  complianceFriction: { type: Type.NUMBER },
                  innovationIncentive: { type: Type.NUMBER },
                  publicServiceReinvestment: { type: Type.NUMBER },
                  minimumWageFloorIndex: { type: Type.NUMBER },
                },
                required: [
                  'taxRateDelta',
                  'universalTransferMonthly',
                  'enforcementIntensity',
                  'penaltySeverity',
                  'complianceFriction',
                  'innovationIncentive',
                  'publicServiceReinvestment',
                  'minimumWageFloorIndex',
                ],
              },
              hypotheses: {
                type: Type.OBJECT,
                properties: {
                  economyHypothesis: {
                    type: Type.STRING,
                    description: 'Expected macroeconomic effect on GDP, productivity, and fiscal balance',
                  },
                  fairnessHypothesis: {
                    type: Type.STRING,
                    description: 'Expected distributional impact on Gini coefficient and bottom-decile mobility',
                  },
                  complianceHypothesis: {
                    type: Type.STRING,
                    description: 'Expected compliance dynamics, evasion risk, and administrative strain',
                  },
                  unintendedRisk: {
                    type: Type.STRING,
                    description: 'Primary second-order unintended consequence to watch for in simulation',
                  },
                },
                required: ['economyHypothesis', 'fairnessHypothesis', 'complianceHypothesis', 'unintendedRisk'],
              },
            },
            required: ['billCode', 'title', 'category', 'preamble', 'clauses', 'parameters', 'hypotheses'],
          },
        },
      });

      const rawText = response.text;
      if (!rawText) {
        return res.status(500).json({ error: 'Model returned an empty legislative draft.' });
      }
      const parsed = JSON.parse(rawText.trim());
      return res.json(parsed);
    } catch (error: any) {
      console.error('Error drafting policy:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to draft hypothetical policy via Gemini API.',
      });
    }
  });

  // Endpoint 2: Empirical Simulation Outcome Audit & Statutory Amendment Generator
  app.post('/api/policies/audit', async (req, res) => {
    try {
      const { policy, finalMetrics, baselineMetrics, stratumBreakdown } = req.body;
      if (!policy || !finalMetrics) {
        return res.status(400).json({ error: 'Policy and simulation outcome metrics are required.' });
      }

      const systemInstruction = `You are a Chief Empirical Policy Auditor analyzing the results of a 36-month multi-agent societal simulation.
Evaluate the empirical delta between baseline and simulated outcomes across Economy (GDP Index, Fiscal Balance), Fairness (Gini Coefficient, Bottom-40% Share), and Compliance (Voluntary Compliance, Shadow Economy Evasion).
Provide a rigorous diagnosis of why agents behaved this way and propose a concrete statutory amendment with recalibrated parameters to mitigate observed bottlenecks.`;

      const userPrompt = `Analyze the 36-month agent-based simulation outcome for:
Law: ${policy.billCode} — ${policy.title}
Parameters Used: ${JSON.stringify(policy.parameters)}

Simulated 36-Month Outcomes vs Baseline:
- Real GDP Index: ${finalMetrics.gdpIndex.toFixed(1)} (Baseline: ${baselineMetrics?.gdpIndex?.toFixed(1) || '100.0'})
- Gini Inequality Coefficient: ${finalMetrics.gini.toFixed(3)} (Baseline: ${baselineMetrics?.gini?.toFixed(3) || '0.385'})
- Voluntary Compliance Rate: ${finalMetrics.complianceRate.toFixed(1)}% (Shadow Evasion: ${finalMetrics.evasionRate.toFixed(1)}%, Regulatory Strain: ${finalMetrics.strainedRate.toFixed(1)}%)
- Annual Fiscal Balance: $${finalMetrics.fiscalBalanceB.toFixed(1)}B
- Public Wellbeing Index: ${finalMetrics.wellbeingIndex.toFixed(1)}/100
- Stratum Breakdown: ${JSON.stringify(stratumBreakdown || [])}

Provide an empirical audit and a targeted amendment with recalibrated parameters.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdictHeadline: {
                type: Type.STRING,
                description: 'Crisp 1-sentence empirical verdict on the law performance',
              },
              economicDiagnosis: {
                type: Type.STRING,
                description: '2-sentence analysis of output, productivity, and fiscal sustainability',
              },
              fairnessDiagnosis: {
                type: Type.STRING,
                description: '2-sentence analysis of wealth distribution, Lorenz shift, and stratum winners/losers',
              },
              complianceDiagnosis: {
                type: Type.STRING,
                description: '2-sentence analysis of agent evasion vs voluntary compliance and friction',
              },
              amendmentTitle: {
                type: Type.STRING,
                description: 'Title of recommended corrective amendment, e.g., Amendment I: SME Safe-Harbor & Audit Recalibration',
              },
              amendmentRationale: {
                type: Type.STRING,
                description: 'Explanation of how the amended parameters resolve the observed friction or evasion',
              },
              recommendedParameters: {
                type: Type.OBJECT,
                properties: {
                  taxRateDelta: { type: Type.NUMBER },
                  universalTransferMonthly: { type: Type.NUMBER },
                  enforcementIntensity: { type: Type.NUMBER },
                  penaltySeverity: { type: Type.NUMBER },
                  complianceFriction: { type: Type.NUMBER },
                  innovationIncentive: { type: Type.NUMBER },
                  publicServiceReinvestment: { type: Type.NUMBER },
                  minimumWageFloorIndex: { type: Type.NUMBER },
                },
                required: [
                  'taxRateDelta',
                  'universalTransferMonthly',
                  'enforcementIntensity',
                  'penaltySeverity',
                  'complianceFriction',
                  'innovationIncentive',
                  'publicServiceReinvestment',
                  'minimumWageFloorIndex',
                ],
              },
            },
            required: [
              'verdictHeadline',
              'economicDiagnosis',
              'fairnessDiagnosis',
              'complianceDiagnosis',
              'amendmentTitle',
              'amendmentRationale',
              'recommendedParameters',
            ],
          },
        },
      });

      const rawText = response.text;
      if (!rawText) {
        return res.status(500).json({ error: 'Empty audit response from Gemini.' });
      }
      return res.json(JSON.parse(rawText.trim()));
    } catch (error: any) {
      console.error('Error auditing simulation:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to generate empirical policy audit.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PolisLab server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
