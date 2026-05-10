# EN /tools/ 번역 검수 review (2026-05-10)

> 사용자 검수용 doc — AI 초안 영어 텍스트의 어색한 표현·도메인 용어·번역 누락 점검. 각 도구별 SEO meta(title/desc/OG/Twitter) + H1 + subtitle + privacy box + FAQ + HowTo step 추출. 수정 결정 후 패치.

카테고리: Calculators (8 도구 + 1 hub)

---

## Hub
`en/tools/index.html`

| field | value |
|---|---|
| `<title>` (77c) | Free Calculators — 8 Tools (Compound, BMI, TDEE, Loan &amp; more) | TAYSTUDIO |
| `meta description` (186c) | 8 free privacy-first calculators that run entirely in your browser — compound interest, BMI, calorie/TDEE, body fat, ideal weight, savings, loan, D-Day. No upload, no signup, no install. |
| `og:title` | Free Calculators — 8 Tools (Compound, BMI, TDEE, Loan & more) | TAYSTUDIO |
| `og:description` | 8 free privacy-first calculators that run entirely in your browser — compound interest, BMI, calorie/TDEE, body fat, ideal weight, savings, loan, D-Day. No upload, no signup. |
| `twitter:title` | Free Calculators — 8 Tools | TAYSTUDIO |
| `twitter:description` | 8 free privacy-first calculators in your browser — compound interest, BMI, TDEE, body fat, ideal weight, savings, loan, D-Day. |
| `<h1>` | Universal Calculators |
| `subtitle` | Privacy-first calculators in your browser — no signup, no install. |

**FAQ (4)**
- **Q:** Is my data uploaded anywhere?
  **A:** No. All calculations happen inside your browser using JavaScript and WebAssembly. Your inputs never leave your device. This is a static site with no server-side processing.
- **Q:** Can I use these results for tax filing or medical decisions?
  **A:** No. All calculations are estimates for reference only. Use official tools or consult licensed professionals (tax accountants, doctors, financial advisors) for accurate, decision-grade results. The site simplifies common cases — special exemptions or edge cases may not be covered.
- **Q:** What calculators are available in English?
  **A:** Eight universal calculators: compound interest, BMI, calorie/TDEE, body fat (Navy method), ideal weight, savings, loan, and D-Day. Korean-specific tools (Korean tax, real estate law, labor law) are not translated as they are jurisdiction-bound — see the Korean version of the site for those.
- **Q:** Does it work on mobile?
  **A:** Yes. Chrome on Android, Samsung Internet, and Safari on iOS are all supported, and you can install it as an app via \

---

## compound
`en/tools/compound/index.html`

| field | value |
|---|---|
| `<title>` (62c) | Compound Interest Calculator | Lump Sum + Monthly Future Value |
| `meta description` (191c) | Calculate future value of a lump sum and monthly contributions with compound interest. See total profit, return multiple, and growth over time. Free, no signup, runs entirely in your browser. |
| `og:title` | Compound Interest Calculator | Lump Sum + Monthly Future Value |
| `og:description` | Calculate future value of a lump sum and monthly contributions with compound interest. See total profit, return multiple, and growth over time. |
| `twitter:title` | Compound Interest Calculator | Lump Sum + Monthly Future Value |
| `twitter:description` | Calculate future value of a lump sum and monthly contributions with compound interest. See total profit, return multiple, and growth over time. |
| `<h1>` | Compound Interest Calculator |
| `subtitle` | Lump sum + monthly contributions, computed together. See your future value at a glance. |

**FAQ (6)**
- **Q:** What's the difference between simple and compound interest?
  **A:** Simple interest applies only to the original principal, while compound interest applies to both the principal and accumulated interest. For $100,000 at 7% over 30 years: simple interest yields $310,000, while compound yields $761,226 — a $451,226 difference. The longer the period, the more dramatic …
- **Q:** If I save $500 a month for 30 years, will I really have $610,000?
  **A:** At a 7% annual return, $500/month over 30 years ($180,000 invested) grows to approximately $609,985 (3.4× the principal). Over 5 years it's only 1.2×, and over 10 years 1.4× — but 30 years yields 3.4× because compound growth eats time. Note: these figures don't account for inflation or taxes, so rea…
- **Q:** Does a 1 percentage point difference in return really matter?
  **A:** Significantly. For $1,000/month over 30 years: 5% returns $832,259, 7% returns $1,219,971, and 10% returns $2,260,488. A 1 percentage point difference creates $150K–$400K gaps over 30 years. In long-term investing, even a 0.5% expense ratio compounds into massive losses.
- **Q:** What is the Rule of 72?
  **A:** 72 ÷ annual return rate = approximate years for principal to double. At 7%, that's about 10.3 years; at 9%, about 8 years; at 12%, about 6 years. The exact formula ln(2)/ln(1+r) differs by less than a year. Useful as a quick mental-math heuristic.
- **Q:** How do taxes affect compound interest?
  **A:** Taxes vary by country and account type. In tax-deferred accounts (401(k), Traditional IRA), gains compound untaxed until withdrawal. In taxable brokerage accounts, dividends and realized gains are taxed annually, lowering the effective rate. This calculator computes pre-tax compound growth — your re…
- **Q:** Are tax-advantaged retirement accounts worth it?
  **A:** Yes, substantially. In a 401(k), Roth IRA, or similar account, gains compound without annual tax drag. Over 30 years, the difference between taxable and tax-advantaged compounding can exceed 25% of the final balance — often hundreds of thousands of dollars. Maximize tax-advantaged contributions befo…

---

## bmi
`en/tools/bmi/index.html`

| field | value |
|---|---|
| `<title>` (56c) | BMI Calculator | Body Mass Index with WHO Classification |
| `meta description` (231c) | Calculate Body Mass Index (BMI) instantly from height and weight. WHO 4-tier classification (Underweight, Normal, Overweight, Obese), healthy weight range, and ideal weight at BMI 22. Free, no signup,… |
| `og:title` | BMI Calculator | Body Mass Index with WHO Classification |
| `og:description` | Calculate Body Mass Index (BMI) instantly from height and weight. WHO 4-tier classification (Underweight, Normal, Overweight, Obese) and healthy weight range. |
| `twitter:title` | BMI Calculator | Body Mass Index with WHO Classification |
| `twitter:description` | Calculate Body Mass Index instantly. WHO 4-tier classification and healthy weight range. |
| `<h1>` | BMI Calculator WHO standard |
| `subtitle` | Body mass index and healthy weight range, instantly. |

**FAQ (5)**
- **Q:** How is BMI calculated?
  **A:** BMI = weight (kg) ÷ height (m)². Example: 175 cm and 70 kg → 70 ÷ 1.75² = 22.86. WHO classification: under 18.5 underweight, 18.5–24.9 normal, 25–29.9 overweight, 30+ obese.
- **Q:** Can I be obese with a normal BMI?
  **A:** Yes. BMI does not distinguish muscle from fat. Athletes with high muscle mass may have high BMI but low body-fat percentage. Conversely, 'skinny fat' individuals can have a normal BMI but body-fat over 30%. For accurate body composition, use DEXA scan, hydrostatic weighing, or BIA (bioelectrical imp…
- **Q:** How is ideal weight determined?
  **A:** BMI 22 (the middle of the normal range) is commonly considered ideal weight. Formula: height (m)² × 22. Example: 175 cm → 1.75² × 22 = 67.4 kg. This calculator displays both the normal range (BMI 18.5–24.9) and the BMI 22 reference.
- **Q:** Does the same standard apply to children and the elderly?
  **A:** No. Children are evaluated using growth percentile charts (CDC or WHO charts). For the elderly, nutritional status is prioritized — some research suggests BMI 23–28 may be optimal. This calculator is intended for adults aged 19+.
- **Q:** Why does the WHO use 25 as the overweight threshold?
  **A:** The WHO BMI classification (Underweight <18.5, Normal 18.5–24.9, Overweight 25–29.9, Obese ≥30) is based on global epidemiological data correlating BMI with mortality and chronic disease risk. Some regional health bodies (e.g., Asia-Pacific) use a stricter threshold of 23 due to differences in body …

---

## calorie
`en/tools/calorie/index.html`

| field | value |
|---|---|
| `<title>` (75c) | Calorie Calculator (BMR &amp; TDEE) | Mifflin–St Jeor + Protein &amp; Water |
| `meta description` (224c) | BMR (Mifflin–St Jeor 1990) + TDEE by activity level + cutting / lean bulk calorie targets + protein 1.6 g/kg + water 33 ml/kg in one screen. Compared with Harris-Benedict 1984. Free, no signup, runs e… |
| `og:title` | Calorie Calculator (BMR & TDEE) | Mifflin–St Jeor + Protein & Water |
| `og:description` | Calculate BMR (Mifflin–St Jeor) + TDEE by activity level + cutting / lean bulk targets + protein 1.6 g/kg + water 33 ml/kg in one screen. Compared with Harris-Benedict 1984. |
| `twitter:title` | Calorie Calculator (BMR & TDEE) | Mifflin–St Jeor + Protein & Water |
| `twitter:description` | BMR (Mifflin–St Jeor) + TDEE + cut / bulk targets + protein and water in one screen. |
| `<h1>` | Calorie Calculator Mifflin–St Jeor 1990 |
| `subtitle` | BMR + TDEE by activity level + cutting / lean bulk + protein and water — one screen. |

**FAQ (6)**
- **Q:** What's the difference between BMR and TDEE?
  **A:** BMR (Basal Metabolic Rate) is the minimum calories your body burns at complete rest to keep your heart, lungs, and temperature running. TDEE (Total Daily Energy Expenditure) is BMR multiplied by an activity factor — your actual daily calorie burn. Cutting and bulking targets are based on TDEE, not B…
- **Q:** Why is the Mifflin–St Jeor formula recommended?
  **A:** Published in 1990, it's the most modern major BMR equation. The American Dietetic Association meta-analysis rated it the most accurate, including in obese populations. It typically returns values about 5% lower than the original 1919 Harris-Benedict, better fitting the modern population. This calcul…
- **Q:** How do I choose an activity level?
  **A:** Sedentary (×1.2): desk job, little to no exercise. Lightly active (×1.375): light exercise 1–3 days/week. Moderately active (×1.55): moderate exercise 3–5 days/week (lifting, running). Very active (×1.725): hard exercise 6–7 days/week. Extra active (×1.9): physical labor or training twice a day. Whe…
- **Q:** Why is −500 kcal the standard cutting deficit?
  **A:** 1 kg of fat ≈ 7,700 kcal. A daily 500 kcal deficit yields about −0.45 kg per week, matching WHO and ADA's safe rate (0.5–1 kg/week). Faster cuts cause muscle loss, rebound, and metabolic adaptation (BMR drops). Deficits over 1,000 kcal/day should only be used short-term under medical supervision.
- **Q:** Why is protein 1.6 g/kg recommended?
  **A:** The general adult RDA is 0.8 g/kg, but for those exercising or in a calorie deficit, the meta-analysis by Morton et al. (2018, BJSM) recommends 1.6–2.2 g/kg to preserve muscle. The default 1.6 g/kg here covers most active adults and dieters. Sedentary adults can use the standard RDA.
- **Q:** Does the same formula apply to pregnancy and breastfeeding?
  **A:** No. Pregnancy adds approximately +340 kcal in the second trimester and +450 kcal in the third; breastfeeding adds about +330 kcal. This calculator targets general healthy adults — pregnant or nursing women should consult their OB/GYN or a registered dietitian. Adolescents (under 19) also have growth…

---

## body-fat
`en/tools/body-fat/index.html`

| field | value |
|---|---|
| `<title>` (65c) | Body Fat Calculator (Navy Method) | Tape Measure Body Composition |
| `meta description` (250c) | Estimate body fat percentage with just a tape measure (U.S. Navy method) + CUN-BAE BMI-based comparison + ACE classification (essential, athletes, fitness, average, obese) + fat mass and lean body mas… |
| `og:title` | Body Fat Calculator (Navy Method) | Tape Measure Body Composition |
| `og:description` | Estimate body fat percentage with just a tape measure using the U.S. Navy method. Compared with CUN-BAE BMI-based formula. ACE classification (essential, athletes, fitness, average, obese) plus fat ma… |
| `twitter:title` | Body Fat Calculator (Navy Method) | Tape Measure Body Composition |
| `twitter:description` | Estimate body fat using just a tape measure. Navy method + CUN-BAE comparison + ACE classification. |
| `<h1>` | Body Fat Calculator U.S. Navy 1984 |
| `subtitle` | Estimate body fat with just a tape measure — Navy formula + CUN-BAE comparison + ACE classification + fat and lean mass. |

**FAQ (6)**
- **Q:** How accurate is the Navy formula?
  **A:** The U.S. Navy adopted this tape-measure formula in 1984. Compared with hydrostatic weighing (the historical gold standard), average error is ±3–4%. Less precise than DEXA or BIA, but the most common method that requires only a tape measure. This calculator also displays the BMI-based CUN-BAE (Spain …
- **Q:** How do I take the measurements?
  **A:** Neck: just below the larynx (Adam's apple), at the narrowest part, with the tape level. Waist: men measure at the navel; women measure at the narrowest point (usually 2–3 cm above the navel). Hips (women only): the widest point around the buttocks. Breathe out naturally during measurement; the tape …
- **Q:** What classification does this calculator use?
  **A:** American Council on Exercise (ACE) standards — Men: essential 2–5%, athletes 6–13%, fitness 14–17%, average 18–24%, obese 25%+. Women: essential 10–13%, athletes 14–20%, fitness 21–24%, average 25–31%, obese 32%+. Women naturally maintain 5–9 percentage points more body fat than men due to hormonal …
- **Q:** BMI vs body fat — which is more accurate?
  **A:** Body fat percentage is more accurate. BMI only considers height and weight, so muscular athletes can be misclassified as obese, and 'skinny fat' (normal BMI but body fat 30%+) is missed. BMI is still useful as a quick screen because it requires no tape measure. If you train regularly or have an atyp…
- **Q:** Why do Navy and BIA / scale results differ?
  **A:** The two methods measure different things. Navy uses circumference regression (shape estimation); BIA scales use bioelectrical impedance to estimate water content, then convert to body fat. BIA is sensitive to hydration (fasting, exercise, menstruation) and can vary ±2–3% in the same person. Both met…
- **Q:** How do I lower my body fat?
  **A:** Preserve muscle while losing fat: ① calorie deficit (0.5–1 kg/week, TDEE − 500 kcal), ② protein 1.6–2.2 g/kg/day (Morton 2018, BJSM), ③ resistance training 3+ days/week (prevents muscle loss), ④ adequate sleep (7+ hours) to normalize cortisol, leptin, and testosterone. Cuts faster than 1 kg/week oft…

---

## ideal-weight
`en/tools/ideal-weight/index.html`

| field | value |
|---|---|
| `<title>` (66c) | Ideal Weight Calculator | BMI 22 + Devine, Robinson, Miller, Hamwi |
| `meta description` (244c) | Ideal body weight from BMI 22 + four medical formulas (Devine 1974, Robinson 1983, Miller 1983, Hamwi 1964) + healthy weight range (BMI 18.5–24.9). Enter your current weight to see the difference. Fre… |
| `og:title` | Ideal Weight Calculator | BMI 22 + Devine, Robinson, Miller, Hamwi |
| `og:description` | Ideal body weight from BMI 22 + four medical formulas (Devine, Robinson, Miller, Hamwi) + healthy weight range (BMI 18.5–24.9). Enter your current weight to see the difference. |
| `twitter:title` | Ideal Weight Calculator | BMI 22 + Devine, Robinson, Miller, Hamwi |
| `twitter:description` | BMI 22 + 4 medical IBW formulas + healthy weight range, all in one screen. |
| `<h1>` | Ideal Weight Calculator BMI 22 + 4 medical formulas |
| `subtitle` | BMI 22 reference + Devine / Robinson / Miller / Hamwi + healthy weight range. |

**FAQ (6)**
- **Q:** What's the difference between 'ideal weight,' 'standard weight,' and 'healthy weight'?
  **A:** These terms are used almost interchangeably but differ in origin. 'Healthy weight' typically refers to the BMI 18.5–24.9 range (WHO). 'Ideal Body Weight (IBW)' was originally derived for medication dosing in U.S. medicine (Devine 1974). This calculator displays both: BMI 22 as the simple reference a…
- **Q:** Why use BMI 22 as the primary reference?
  **A:** BMI 22 sits in the middle of the WHO normal range (18.5–24.9) and is associated with the lowest mortality risk in many epidemiological studies. It is widely used as a target for ideal weight in clinical and dietetic practice.
- **Q:** How do the Devine, Robinson, Miller, and Hamwi formulas differ?
  **A:** Devine 1974 is the U.S. medical standard for medication dosing. Robinson 1983 is a more conservative refinement of Devine. Miller 1983 returns higher values (about +3 kg on average). Hamwi 1964 is the oldest and most generous (about +5 kg on average). All four use 5 ft (152 cm) as the baseline plus …
- **Q:** If I weigh more than my ideal, am I automatically obese?
  **A:** No. Ideal weight is a height-based regression that doesn't distinguish muscle from fat. Athletes can have BMI 25+ with low body fat and good health, and 'skinny fat' (normal BMI but body fat 30%+) is missed. For accurate evaluation, look at BMI, body fat percentage, and waist circumference (abdomina…
- **Q:** Is the calculator accurate below 152 cm?
  **A:** The Devine and similar formulas all start from a baseline of 5 ft (152.4 cm) = 60 inches. Below that, they can return negative or unrealistic values. This calculator skips the four medical formulas under 152 cm and shows only BMI 22. For very short adults or children, use BMI 22 or pediatric growth …
- **Q:** Is the same standard applicable during pregnancy?
  **A:** No. Recommended weight gain during pregnancy depends on pre-pregnancy BMI (IOM 2009): underweight (<18.5) 12.5–18 kg, normal (18.5–24.9) 11.5–16 kg, overweight (25–29.9) 7–11.5 kg, obese (30+) 5–9 kg. This calculator targets non-pregnant adults — pregnant women should consult their OB/GYN.

---

## savings
`en/tools/savings/index.html`

| field | value |
|---|---|
| `<title>` (64c) | Savings Calculator | Simple vs Compound Interest, Maturity Value |
| `meta description` (211c) | Calculate the maturity value of a regular savings deposit. Choose simple or monthly-compound interest. Enter monthly contribution, annual rate, and term in months. Free, no signup, runs entirely in yo… |
| `og:title` | Savings Calculator | Simple vs Compound Interest, Maturity Value |
| `og:description` | Calculate the maturity value of a regular savings deposit with simple or compound interest. Enter monthly contribution, annual rate, and term (months). |
| `twitter:title` | Savings Calculator | Simple vs Compound Interest |
| `twitter:description` | Calculate maturity value of regular savings — simple or compound interest. |
| `<h1>` | Savings Calculator |
| `subtitle` | Monthly deposit, rate, and term — get simple and compound maturity value at a glance. |

**FAQ (5)**
- **Q:** What's the difference between simple and compound interest on a regular savings plan?
  **A:** For a recurring monthly deposit, simple interest applies an annual rate to each contribution from deposit to maturity (first contribution earns n months, last earns 1 month). Monthly compound interest applies a monthly rate to the running balance every month. At the same nominal rate, simple interes…
- **Q:** How much will I have if I save $300 a month for 24 months at 4%?
  **A:** With simple interest: $7,200 principal + about $300 interest = approximately $7,500 at maturity (before any taxes). The exact number depends on the formula your bank uses. This calculator computes pre-tax interest — actual after-tax results depend on your jurisdiction and account type.
- **Q:** What is the maturity value of a $100,000 1-year deposit at 4%?
  **A:** Pre-tax interest is $4,000, so the maturity value is $104,000. Most fixed-term deposits use simple interest (per-year rate × principal). For a fixed lump sum compounded monthly, use the compound interest calculator instead.
- **Q:** How are taxes handled?
  **A:** Tax treatment varies by country and account type. In the US, interest earned in a regular savings or CD is taxed as ordinary income at your marginal rate. In an IRA or 401(k), it grows tax-deferred. This calculator computes pre-tax interest only — your real take-home depends on jurisdiction and acco…
- **Q:** Is my deposit insured?
  **A:** In the US, FDIC insurance covers up to $250,000 per depositor, per insured bank, per ownership category. NCUA provides equivalent coverage at credit unions. Other countries have similar schemes (UK FSCS £85,000, EU national schemes €100,000, etc.). For amounts above the limit, spread funds across mu…

---

## loan
`en/tools/loan/index.html`

| field | value |
|---|---|
| `<title>` (63c) | Loan Calculator | Monthly Payment, Total Interest, Amortization |
| `meta description` (206c) | Enter loan amount, rate, and term to instantly compute monthly payment and total interest. Supports equal monthly payment (PMT) and equal principal repayment. Free, no signup, runs entirely in your br… |
| `og:title` | Loan Calculator | Monthly Payment, Total Interest, Amortization |
| `og:description` | Enter loan amount, rate, and term to instantly compute monthly payment and total interest. Supports equal monthly payment (PMT) and equal principal repayment. |
| `twitter:title` | Loan Calculator | Monthly Payment, Total Interest, Amortization |
| `twitter:description` | Monthly payment, total interest, amortization for any loan — equal monthly or equal principal. |
| `<h1>` | Loan Calculator Standard formulas |
| `subtitle` | Mortgages, auto loans, personal loans — equal monthly or equal principal supported. |

**FAQ (6)**
- **Q:** Equal monthly payment vs equal principal — which is better?
  **A:** Total interest is lower with equal-principal repayment. For a $300K, 4.5%, 30-year mortgage, equal-monthly totals about $247K interest while equal-principal totals about $203K — a roughly $44K difference. However, equal-principal has a higher first payment ($1,960 vs $1,520), so it suits borrowers w…
- **Q:** How much difference does loan term make (20 vs 30 years)?
  **A:** For a $300K mortgage at 4.5% (equal monthly): 30-year = $1,520/month with $247K total interest, 20-year = $1,898/month with $156K total interest. A 10-year shorter term raises the monthly payment by about $378 but saves about $91K in total interest.
- **Q:** How much does a 1 percentage point rate difference matter?
  **A:** On a $300K, 30-year loan, going from 4.5% to 5.5% raises the monthly payment from $1,520 to $1,703 (+$183) and total interest from $247K to $313K (+$66K). Over 30 years, a 1pp change equals roughly $60K–$100K in lifetime interest.
- **Q:** What's the difference between APR and the interest rate?
  **A:** The interest rate is the cost of borrowing the principal expressed as a percentage. APR (Annual Percentage Rate) includes the interest rate plus most fees (origination, points, mortgage insurance) expressed as an annualized rate. Use APR when comparing loan offers — it captures more of the true cost…
- **Q:** Are there fees this calculator doesn't capture?
  **A:** Yes. Real loans typically add origination or processing fees (often 0.5–1% of principal), discount points, appraisal fees, recording / lien fees, and (for mortgages) mandatory hazard insurance. Some loans also have prepayment penalties for early payoff in the first few years. Compare offers using AP…
- **Q:** Fixed vs variable rate — which should I pick?
  **A:** Fixed-rate loans keep the same rate for the full term, protecting against rate hikes — typically 0.3–0.5pp higher than starting variable rates. Variable / ARM loans reset every 1–10 years (after an initial fixed period), benefiting borrowers if rates fall. Hybrid ARMs (5/1, 7/1) are popular: fixed f…

---

## dday
`en/tools/dday/index.html`

| field | value |
|---|---|
| `<title>` (41c) | D-Day Calculator | Days Between Two Dates |
| `meta description` (185c) | Calculate days, weeks, months, and years between two dates. Anniversary, deadline, milestone — supports D-Day countdown and elapsed days. Free, no signup, runs entirely in your browser. |
| `og:title` | D-Day Calculator | Days Between Two Dates |
| `og:description` | Calculate days, weeks, months, and years between two dates. Anniversary, deadline, milestone — D-Day countdown and elapsed days. |
| `twitter:title` | D-Day Calculator | Days Between Two Dates |
| `twitter:description` | Days, weeks, months, years between two dates. Anniversary, deadline, milestone. |
| `<h1>` | D-Day Calculator |
| `subtitle` | Days, weeks, months, and years between two dates — at a glance. |

**FAQ (5)**
- **Q:** What does D-Day stand for?
  **A:** D-Day is the day a planned event occurs (D-0). One day before is D-1; one day after is D+1. The 'D' simply stands for 'Day,' first used in WWI U.S. Army field orders and made famous by the 1944 Normandy landings. Today it's a generic countdown / elapsed-day notation: 9 days before an exam = D-9, 100…
- **Q:** How are weeks, months, and years calculated?
  **A:** Total days are converted using averages: 30.4375 days/month and 365.25 days/year (accounting for leap years). These are not exact calendar differences but useful approximations for everyday use ('about 6 months').
- **Q:** Are leap years handled automatically?
  **A:** Yes. The day count uses JavaScript's Date object in milliseconds, so leap years and varying month lengths are handled automatically. Expect a +1 day shift roughly every 4 years across long ranges.
- **Q:** How do I track 100-day, 1000-day, or anniversary milestones?
  **A:** Enter the original event date as the start, and any future date (start + N days, or any anniversary) as the end. The calculator returns the exact day count. For relationship milestones, just put the start date in the start field and the milestone date in the end field.
- **Q:** Can I use today's date automatically?
  **A:** Yes. The start field is pre-filled with today's date. Change either field to whatever you need. The result also shows a 'today vs target' badge (D-N / D-Day / D+N) regardless of which dates you enter.

---
