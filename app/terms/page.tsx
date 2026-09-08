import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export const metadata = { title: "Sales Agreement — HavnLine" };

export default function SalesTermsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/login" className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <span className="font-display text-[15px] font-semibold text-ink">HavnLine Sales</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-[28px] font-semibold text-ink">Independent Contractor Sales Agreement</h1>
        <p className="mt-2 text-[13px] text-text-muted">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-4 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-[12.5px] leading-relaxed text-brand-dark">
          This is a starting template, not a finished legal document. Worker classification (independent
          contractor vs. employee) carries real legal and tax consequences — have an employment attorney review
          and customize this, and confirm the classification itself, before using it with real salespeople.
        </div>

        <section className="mt-8 space-y-5 text-[14px] leading-relaxed text-text">
          <p>
            This Agreement is between HavnLine ("Company") and the individual accepting it ("Salesperson"),
            governing the Salesperson's work selling HavnLine's AI receptionist product to prospective business
            customers.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">1. Independent contractor relationship</h2>
          <p>
            The Salesperson is an independent contractor, not an employee, of HavnLine. Nothing in this Agreement
            creates an employment, partnership, or joint venture relationship. The Salesperson is responsible for
            their own taxes, including self-employment tax — HavnLine does not withhold income tax, Social
            Security, or Medicare from commission payments, and will issue tax documentation as required by law
            (e.g., Form 1099-NEC in the United States) rather than a W-2.
          </p>
          <p>
            The Salesperson controls how and when they perform their work, is not required to work exclusively
            for HavnLine, and may accept other clients or engagements, provided doing so does not violate the
            confidentiality terms below.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">2. Commission structure</h2>
          <p>The Salesperson is compensated solely through commission — no base salary, hourly wage, or guaranteed minimum payment is provided. Commission is calculated as follows:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li><strong>$150</strong> after a referred customer successfully completes their first full paid month with HavnLine.</li>
            <li>An additional <strong>$150</strong> after that same customer successfully completes their second full paid month.</li>
            <li>Maximum total commission per customer: <strong>$300</strong>. No further commission is paid on that customer after the second payment, including for any months the customer remains subscribed beyond that point.</li>
          </ul>
          <p>
            If a customer cancels, fails to pay, or is refunded before a commission milestone is reached, no
            commission is owed for that milestone. Commission amounts and payment stages are set and may be
            modified by HavnLine's administrators; the Salesperson cannot alter their own commission records.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">3. Leads and confidentiality</h2>
          <p>
            Leads, prospect information, and customer data provided through the HavnLine Sales Portfolio remain
            HavnLine's confidential property. The Salesperson agrees not to use this information for any purpose
            outside representing HavnLine, and not to retain, copy, or share it after this Agreement ends.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">4. Conduct</h2>
          <p>
            The Salesperson agrees to represent HavnLine honestly — accurately describing pricing, features, and
            terms, and never guaranteeing results, discounts, or contract terms that HavnLine has not authorized.
            Misrepresentation to a prospect may result in forfeiture of commission on that sale and termination of
            this Agreement.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">5. Term and termination</h2>
          <p>
            This Agreement may be ended by either party at any time, for any reason, with or without notice.
            Commission already earned (a milestone already completed) at the time of termination remains payable
            on its normal schedule; commission tied to milestones not yet reached at termination is forfeited
            unless HavnLine agrees otherwise in writing.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">6. No benefits</h2>
          <p>
            As an independent contractor, the Salesperson is not eligible for employee benefits of any kind,
            including health insurance, retirement contributions, paid time off, workers' compensation, or
            unemployment insurance through HavnLine.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">7. Changes to this Agreement</h2>
          <p>HavnLine may update this Agreement from time to time. Continued participation after a change means acceptance of the updated terms.</p>

          <h2 className="font-display text-[18px] font-semibold text-ink">8. Contact</h2>
          <p>Questions about this Agreement should be directed to your HavnLine administrator.</p>
        </section>
      </main>
    </div>
  );
}
