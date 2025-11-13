export type Bucket = "NOT_FIT" | "70_PERCENT" | "BEST_FIT";

export const PREFERRED_COUNTRIES = new Set<string>([
  "Austria","Belgium","Croatia","Cyprus","Czech Republic","Denmark","Estonia","Finland","France",
  "Germany","Greece","Hungary","Ireland","Italy","Luxembourg","Malta","Netherlands","Poland",
  "Portugal","Romania","Slovakia","Slovenia","Spain","Sweden","United Kingdom",
  "United Arab Emirates","Switzerland","Norway","Singapore","New Zealand","Australia",
  "Canada","United States","USA"
]);

export type JobLike = {
  clientCountry?: string;      // E
  paymentVerified?: string|boolean; // F ("Yes"/"No" or boolean)
  clientRating?: number|string;     // G
  jobsPosted?: number|string;       // H
  hireRate?: number|string|null;    // I (e.g. "55%", "0.55", 0.55, "")
  totalSpent?: number|string|null;  // J (plain number if possible)
  aiMatchPercent?: number|string|null; // P (e.g. "75%", 0.75, "", null)
};

/** normalize "Yes"/"No"/boolean to boolean */
export function isVerified(v: string|boolean|undefined): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "yes" || s === "true";
}

/** normalize number-like field */
export function toNumber(n: number|string|null|undefined): number | null {
  if (n === null || n === undefined) return null;
  const s = String(n).trim().replace(/\$/g,"").replace(/,/g,"").replace(/ /g,"");
  if (!s) return null;
  // K shorthand support (e.g. 381K)
  const km = s.match(/^(-?\d+(\.\d+)?)k$/i);
  if (km) return parseFloat(km[1]) * 1000;
  const val = parseFloat(s);
  return Number.isFinite(val) ? val : null;
}

/** convert "55%" or "0.55" -> 0.55  (blank allowed) */
export function toPercent01(v: number|string|null|undefined): number | null {
  if (v === null || v === undefined) return null;
  let s = String(v).trim().toLowerCase().replace(/ /g,"");
  if (!s) return null;
  if (s.endsWith("%")) {
    const num = parseFloat(s.slice(0, -1));
    return Number.isFinite(num) ? num/100 : null;
  }
  const num = parseFloat(s);
  if (!Number.isFinite(num)) return null;
  return num > 1 ? num/100 : num;
}

/** Main evaluator: replicates the Excel formula semantics */
export function evaluateFit(job: JobLike): { bucket: Bucket; fitScore: 0|70|100; reasons: string[] } {
  const country = (job.clientCountry ?? "").trim();
  const verified = isVerified(job.paymentVerified ?? "No");
  const rating = toNumber(job.clientRating) ?? 0;
  const jobsPosted = toNumber(job.jobsPosted) ?? 0;
  const hireRate = toPercent01(job.hireRate); // nullable
  const totalSpent = toNumber(job.totalSpent) ?? 0;
  const ai = toPercent01(job.aiMatchPercent); // nullable
  const isPreferred = PREFERRED_COUNTRIES.has(country);

  // HARD REJECT (NOT_FIT)
  if (!verified || !isPreferred || rating < 4) {
    const reasons: string[] = [];
    if (!verified) reasons.push("Payment not verified");
    if (!isPreferred) reasons.push("Country not preferred");
    if (rating < 4) reasons.push("Rating < 4.0");
    return { bucket: "NOT_FIT", fitScore: 0, reasons };
  }

  // BEST_FIT conditions
  const condCountry = isPreferred;
  const condVerified = verified;
  const condRating = rating >= 4.7;
  const condHire = hireRate === null || hireRate >= 0.6; // blank allowed
  const condHistory = totalSpent >= 10000 || jobsPosted >= 50;
  const condAI = ai === null || ai >= 0.75;

  if (condCountry && condVerified && condRating && condHire && condHistory && condAI) {
    return {
      bucket: "BEST_FIT",
      fitScore: 100,
      reasons: [
        "Verified",
        "Preferred country",
        "Rating ≥ 4.7",
        hireRate === null ? "Hire rate not provided (allowed)" : "Hire rate ≥ 60%",
        totalSpent >= 10000 ? "Spend ≥ $10k" : "Jobs posted ≥ 50",
        ai === null ? "AI match not provided (allowed)" : "AI match ≥ 0.75"
      ]
    };
  }

  // OTHERWISE 70%
  const reasons: string[] = ["Medium quality or missing history"];
  if (hireRate !== null && hireRate < 0.6) reasons.push("Hire rate < 60%");
  if (rating < 4.7) reasons.push("Rating < 4.7 for Best Fit");
  if (totalSpent < 10000 && jobsPosted < 50) reasons.push("Spend < $10k AND Jobs < 50");
  if (ai !== null && ai < 0.75) reasons.push("AI match < 0.75");
  return { bucket: "70_PERCENT", fitScore: 70, reasons };
}

