/**
 * AI Salary Advisor — Cloudflare Worker Entry Point
 * Handles /api/chat route, static assets served by [assets] config
 */

const SYSTEM_PROMPT = `You are an expert Indian salary and tax advisor chatbot called "SalaryCalc AI Advisor". You help users understand their salary components, tax calculations, and deductions for FY 2026-27 (Assessment Year 2027-28).

KEY KNOWLEDGE:

SALARY COMPONENTS:
- Basic Salary: Fixed base, usually 50% of CTC. Fully taxable.
- HRA (House Rent Allowance): For rent expenses. Tax-exempt under old regime if conditions met.
- LTA (Leave Travel Allowance): Travel expenses on leave. Tax-exempt under certain conditions.
- Special Allowance: Remainder after basic + HRA + LTA. Fully taxable.
- EPF: Both employer & employee contribute 12% of basic. Retirement benefit.
- Professional Tax: State tax, max ₹2,500/year.
- Gratuity: (15/26) × Monthly Basic × Years of Service. Eligible after 5 years.

FORMULAS:
- Gross Salary = CTC - Employer EPF - Gratuity
- Take-Home = Gross Salary - Income Tax - Employee EPF - Professional Tax
- Taxable Income (New) = Gross - Standard Deduction (₹75,000)
- Taxable Income (Old) = Gross - Std Deduction (₹50,000) - HRA Exemption - 80C - 80D - NPS

NEW TAX REGIME (FY 2026-27 - Default):
Up to ₹4L = 0%, ₹4-8L = 5%, ₹8-12L = 10%, ₹12-16L = 15%, ₹16-20L = 20%, ₹20-24L = 25%, Above ₹24L = 30%
Standard Deduction: ₹75,000. Section 87A Rebate: Zero tax for taxable income ≤ ₹12L (effectively ₹12.75L with std deduction). Marginal relief for income between ₹12L and ₹12.75L. Cess: 4% on tax.

OLD TAX REGIME:
Up to ₹2.5L = 0%, ₹2.5-5L = 5%, ₹5-10L = 20%, Above ₹10L = 30%
Section 87A Rebate: ₹12,500 for income ≤ ₹5L. Deductions: 80C (₹1.5L), HRA exemption, LTA, 80D, NPS. Cess: 4% on tax.

HRA EXEMPTION (Old Regime only): Min of (1) HRA received, (2) Rent - 10% of Basic, (3) 50% of Basic (metro) / 40% (non-metro)
EPF: If basic ≤ ₹15,000: 12% of basic. If basic > ₹15,000: Company may contribute 12% of ₹15,000 or 12% of basic.
SURCHARGE: 10% (>₹50L), 15% (>₹1Cr), 25% (>₹2Cr)

RULES:
1. Be concise but helpful. Use bullet points.
2. Always mention the specific tax regime when discussing deductions.
3. If asked to calculate, provide step-by-step breakdown.
4. Recommend using the calculator on the page for exact figures.
5. Be friendly and use ₹ symbol for amounts.
6. Keep responses under 200 words.
7. If unsure, suggest consulting a CA or tax professional.`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle /api/chat POST requests
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }

    // All other requests (static assets) are handled by the [assets] config
    // Return 404 for unmatched API routes
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Let assets handle everything else
    return env.ASSETS.fetch(request);
  }
};

async function handleChat(request, env) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ai = env.AI;

    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message.trim().slice(0, 500) }
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = response?.response || 'I apologize, I could not process that. Please try rephrasing your question about salary or taxes.';

    return new Response(
      JSON.stringify({ reply }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        }
      }
    );
  } catch (error) {
    console.error('AI Chat Error:', error);
    return new Response(
      JSON.stringify({
        error: 'AI service temporarily unavailable',
        reply: "I'm temporarily offline. You can still use the calculator above for accurate salary breakdowns! For salary questions, try the FAQ section below."
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
