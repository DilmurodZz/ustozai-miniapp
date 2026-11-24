// Application deadlines for the Top 300 universities (fall 2027 entry).
// - United States: each university's own plans (ED, EA, REA, ED II, RD). These dates repeat almost every year.
// - United Kingdom: UCAS. 15 October 2026 for Oxford, Cambridge, medicine and dentistry; 13 January 2027 for the rest (ucas.com).
// - Canada and Switzerland: each university's usual date. Other countries: the country's usual window, marked approximate.
// Each entry is [plan, "MM-DD"]; "ok" true means a fixed official date, false means approximate (check the official site).
window.DL_DATA = (() => {
  const US = {
    "Massachusetts Institute of Technology": [["EA", "11-01"], ["RD", "01-05"]],
    "Princeton University": [["REA", "11-01"], ["RD", "01-01"]],
    "Stanford University": [["REA", "11-01"], ["RD", "01-05"]],
    "Harvard University": [["REA", "11-01"], ["RD", "01-01"]],
    "California Institute of Technology": [["REA", "11-01"], ["RD", "01-03"]],
    "Yale University": [["REA", "11-01"], ["RD", "01-02"]],
    "University of Pennsylvania": [["ED", "11-01"], ["RD", "01-05"]],
    "The University of Chicago": [["ED", "11-02"], ["EA", "11-02"], ["ED2", "01-06"], ["RD", "01-06"]],
    "Johns Hopkins University": [["ED", "11-01"], ["ED2", "01-02"], ["RD", "01-02"]],
    "Columbia University": [["ED", "11-01"], ["RD", "01-01"]],
    "Cornell University": [["ED", "11-01"], ["RD", "01-02"]],
    "University of Michigan-Ann Arbor": [["EA", "11-01"], ["RD", "02-01"]],
    "Carnegie Mellon University": [["ED", "11-01"], ["ED2", "01-03"], ["RD", "01-03"]],
    "University of Washington": [["RD", "11-15"]],
    "New York University (NYU)": [["ED", "11-01"], ["ED2", "01-01"], ["RD", "01-05"]],
    "Northwestern University": [["ED", "11-01"], ["RD", "01-02"]],
    "Duke University": [["ED", "11-01"], ["RD", "01-02"]],
    "University of Illinois at Urbana-Champaign": [["EA", "11-01"], ["RD", "01-05"]],
    "Georgia Institute of Technology": [["EA", "11-01"], ["RD", "01-05"]],
    "University of Texas at Austin": [["EA", "10-15"], ["RD", "12-01"]],
    "University of Wisconsin-Madison": [["EA", "11-01"], ["RD", "01-15"]],
    "Washington University in St Louis": [["ED", "11-01"], ["ED2", "01-02"], ["RD", "01-02"]],
    "University of Southern California": [["EA", "11-01"], ["ED", "11-01"], ["RD", "01-10"]],
    "Brown University": [["ED", "11-01"], ["RD", "01-03"]],
    "Purdue University West Lafayette": [["EA", "11-01"], ["RD", "01-15"]],
    "University of North Carolina at Chapel Hill": [["EA", "10-15"], ["RD", "01-15"]],
    "Boston University": [["ED", "11-01"], ["ED2", "01-04"], ["RD", "01-04"]],
    "University of Minnesota": [["EA", "11-01"], ["RD", "01-01"]],
    "Vanderbilt University": [["ED", "11-01"], ["ED2", "01-01"], ["RD", "01-01"]],
    "Michigan State University": [["EA", "11-01"], ["RD", "02-01"]],
    "Ohio State University (Main campus)": [["EA", "11-01"], ["RD", "02-01"]],
    "Penn State (Main campus)": [["EA", "11-01"], ["RD", "11-30"]],
    "Rice University": [["ED", "11-01"], ["ED2", "01-04"], ["RD", "01-04"]],
    "Emory University": [["ED", "11-01"], ["ED2", "01-01"], ["RD", "01-01"]],
    "University of Maryland, College Park": [["EA", "11-01"], ["RD", "01-20"]],
    "University of Rochester": [["ED", "11-01"], ["ED2", "01-05"], ["RD", "01-05"]],
    "University of Florida": [["RD", "11-01"]],
    "University of Arizona": [["EA", "11-01"], ["RD", "05-01"]],
    "University of Massachusetts": [["EA", "11-05"], ["ED", "11-05"], ["RD", "01-15"]],
    "Case Western Reserve University": [["ED", "11-01"], ["EA", "11-01"], ["ED2", "01-15"], ["RD", "01-15"]],
    "Texas A&M University": [["RD", "12-01"]],
    "University of Pittsburgh-Pittsburgh campus": [["EA", "11-01"], ["RD", "01-15"]],
    "Dartmouth College": [["ED", "11-01"], ["RD", "01-02"]],
    "University of Virginia (Main campus)": [["ED", "11-01"], ["EA", "11-01"], ["RD", "01-05"]],
    "University of Notre Dame": [["REA", "11-01"], ["RD", "01-01"]],
    "Georgetown University": [["EA", "11-01"], ["RD", "01-10"]],
    "Arizona State University (Tempe)": [["RD", "02-01"]],
    "Tufts University": [["ED", "11-01"], ["ED2", "01-04"], ["RD", "01-04"]],
    "Indiana University": [["EA", "11-01"], ["RD", "02-01"]],
    "University of Miami": [["ED", "11-01"], ["EA", "11-01"], ["ED2", "01-01"], ["RD", "01-01"]],
    "University of Utah": [["EA", "12-01"], ["RD", "04-01"]],
    "George Washington University": [["ED", "11-01"], ["ED2", "01-05"], ["RD", "01-05"]],
    "Northeastern University, US": [["ED", "11-01"], ["EA", "11-01"], ["ED2", "01-01"], ["RD", "01-01"]],
    "University of Illinois Chicago": [["EA", "11-02"], ["RD", "01-15"]],
    "Virginia Polytechnic Institute and State University": [["ED", "11-01"], ["EA", "11-15"], ["RD", "01-15"]],
    "Boston College": [["ED", "11-01"], ["ED2", "01-01"], ["RD", "01-01"]],
  };
  // the University of California applies once for every campus, 30 November
  ["University of California, Berkeley", "University of California, Los Angeles", "University of California, San Diego", "University of California, Davis",
    "University of California, Santa Barbara", "University of California, Irvine", "University of California, Santa Cruz"].forEach((n) => { US[n] = [["UC", "11-30"]]; });
  const CA = {
    "University of Toronto": [["APP", "01-15"]], "McGill University": [["APP", "01-15"]], "University of British Columbia": [["APP", "01-15"]],
    "McMaster University": [["APP", "01-15"]], "University of Alberta": [["APP", "03-01"]], "University of Waterloo": [["APP", "02-01"]],
    "University of Calgary": [["APP", "03-01"]], "Western University": [["APP", "01-15"]], "Queen’s University": [["APP", "01-15"]], "Queen's University": [["APP", "01-15"]],
  };
  const OXBRIDGE = ["University of Oxford", "University of Cambridge"];
  // a country's usual deadline for a September or October start (approximate: each university sets its own)
  const COUNTRY = {
    "Germany": [["WS", "07-15"], ["SS", "01-15"]], "Netherlands": [["APP", "05-01"]], "Switzerland": [["APP", "04-30"]], "Australia": [["S1", "10-31"], ["S2", "04-30"]],
    "Hong Kong": [["APP", "01-15"]], "Singapore": [["APP", "02-20"]], "China": [["APP", "03-31"]], "South Korea": [["APP", "05-15"]], "Sweden": [["APP", "01-15"]],
    "Denmark": [["APP", "03-15"]], "Finland": [["APP", "01-14"]], "Norway": [["APP", "12-01"]], "Ireland": [["APP", "02-01"]], "Belgium": [["APP", "03-01"]],
    "France": [["APP", "12-15"]], "Italy": [["APP", "03-31"]], "Spain": [["APP", "05-31"]], "Austria": [["APP", "01-15"]], "Canada": [["APP", "01-15"]],
  };
  // plans: [Uzbek name, English name, a short explanation]
  const PLAN = {
    ED: ["Early Decision", "majburiy: qabul qilinsangiz, shu universitetga borasiz"],
    ED2: ["Early Decision II", "ikkinchi majburiy erta muddat"],
    EA: ["Early Action", "erta, lekin majburiy emas"],
    REA: ["Restrictive Early Action", "erta, majburiy emas; boshqa xususiy universitetlarga erta topshirib bo'lmaydi"],
    RD: ["Regular Decision", "asosiy muddat"],
    UC: ["UC Application", "Kaliforniya universitetlarining yagona arizasi"],
    UCAS: ["UCAS", "Buyuk Britaniya universitetlari uchun yagona ariza"],
    APP: ["Ariza muddati", "kuzgi qabul uchun"],
    WS: ["Qishki semestr (oktabr)", "ko'pincha uni-assist orqali"],
    SS: ["Yozgi semestr (aprel)", "ko'p dasturlarda"],
    S1: ["1-semestr (fevral)", "xalqaro talabalar uchun"],
    S2: ["2-semestr (iyul)", "xalqaro talabalar uchun"],
  };
  function of(name, country) {
    if (US[name]) return { ok: true, plans: US[name] };
    if (country === "United Kingdom") return { ok: true, plans: OXBRIDGE.includes(name) ? [["UCAS", "10-15"]] : [["UCAS", "01-13"]] };
    if (CA[name]) return { ok: true, plans: CA[name] };
    if (COUNTRY[country]) return { ok: false, plans: COUNTRY[country] };
    return { ok: false, plans: [] };
  }
  return { of, PLAN };
})();
