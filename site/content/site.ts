/**
 * Every string and image path the homepage renders.
 *
 * This file is deliberately the ONLY place content lives. When the CMS takes
 * over, the components stay untouched — a loader returning this same shape
 * replaces the constants below. That is the whole reason the sections take
 * props instead of reaching for literals.
 *
 * Copy is transcribed from the Figma file (emNaKtvekBj0uV2nuvnZQG). Where the
 * source had an evident typo it is corrected here and listed in README.md.
 */

export const clinic = {
  name: "SmileOn",
  legalName: "SmileOn Dental Clinic",
  tagline: "Specialist Dental Practice",
  address: "Johar Town, Lahore (Near Shaukat Khanum Hospital)",
  fullAddress:
    "385 - Moin Jinnah, Khayaban-e-Jinnah Service Road, Near Shaukat Khanum Hospital, Johar Town, Lahore",
  phone: "03311066666",
  email: "info@smileon.pk",
  hours: "Mon-Sat: 11:00am - 9:00pm | Sun: 10:00am - 6:00pm",
  hoursLines: ["Mon-Sat: 11:00am - 9:00pm", "Sun: 10:00am - 6:00pm"],
  // Fits beside the phone number in a single 44px topbar row on phones.
  hoursShort: "Mon–Sat 11am–9pm · Sun 10am–6pm",
  whatsapp: "https://wa.me/923311066666",
  mapsUrl: "https://maps.app.goo.gl/KZ61Teu9av2QARtf8",
} as const;

export type NavItem = { label: string; href: string; hasDropdown?: boolean };

export const nav: readonly NavItem[] = [
  { label: "Treatments", href: "#treatments", hasDropdown: true },
  { label: "Dentists", href: "#dentists" },
  { label: "Results", href: "#results" },
  { label: "Overseas Patients", href: "#overseas" },
  { label: "About", href: "#why" },
  { label: "Contact", href: "#contact" },
];

export const hero = {
  eyebrow: "DENTAL CLINIC IN JOHAR TOWN, LAHORE",
  titleLead: "Specialist Dental Care",
  titleAccent: "in Lahore",
  // Two lines in the design: 649px then 293px at 36px/39px.
  bodyLines: ["Complete care from trusted specialists-", "all under one roof."],
  primaryCta: { label: "Book a consultation", href: "#contact" },
  secondaryCta: { label: "Chat on WhatsApp", href: clinic.whatsapp },
  image: { src: "/img/hero-consultation.webp", alt: "A SmileOn dentist talking through a treatment plan with a patient" },
} as const;

export const stats = [
  { value: "18 +", label: "Years of Excellence", icon: "/icons/stat-trophy.svg", w: 66, h: 53 },
  { value: "14+", label: "Dental Specialists", icon: "/img/stat-specialists.webp", w: 280, h: 212 },
  { value: "50,000+", label: "Patients Treated", icon: "/icons/stat-smile.svg", w: 66, h: 66 },
  { value: "Strict Sterilization", label: "& Safety Protocols", icon: "/img/stat-sterilization.webp", w: 240, h: 282 },
] as const;

/* ---------------------------------------------------------------------------
   Find Your Solution — two tabs over the same slot. In Figma these were drawn
   as two whole page frames (page1 / page2); they are one component here.
   --------------------------------------------------------------------------- */

export const treatments = [
  {
    title: "Check-up & Treatment Planning",
    blurb: "Assessment and a clear care plan.",
    cta: "Explore Check-up & Treatment Planning",
    image: "/img/treatment-checkup.webp",
  },
  {
    title: "Smile Makeover",
    blurb: "Personalised cosmetic improvements.",
    cta: "Explore Smile Makeover",
    image: "/img/treatment-smile-makeover.webp",
  },
  {
    title: "Clear Aligners",
    blurb: "Straighten teeth discreetly.",
    cta: "Explore Clear Aligners",
    image: "/img/treatment-clear-aligners.webp",
  },
  {
    title: "Metal Braces",
    blurb: "Correct crowded teeth.",
    cta: "Explore Metal Braces",
    image: "/img/treatment-metal-braces.webp",
  },
  {
    title: "Dental Implants",
    blurb: "Replace missing teeth.",
    cta: "Explore Dental Implants",
    image: "/img/treatment-dental-implants.webp",
  },
  {
    title: "Veneers",
    blurb: "Improve tooth shape and colour.",
    cta: "Explore Veneers",
    image: "/img/treatment-veneers.webp",
  },
] as const;

export const concerns = [
  { title: "Bleeding Gums", blurb: "Treat gum problems early.", icon: "/img/concern-bleeding-gums.png", w: 130, h: 93 },
  { title: "Crooked Teeth", blurb: "Solutions for a straighter smile.", icon: "/img/concern-crooked-teeth.png", w: 130, h: 60 },
  { title: "Yellow Teeth", blurb: "Ways to brighten your smile.", icon: "/img/concern-yellow-teeth.png", w: 130, h: 120 },
  { title: "Tooth Pain", blurb: "Find the cause and relieve pain.", icon: "/img/concern-tooth-pain.png", w: 130, h: 130 },
  { title: "Missing Teeth", blurb: "Restore gaps and improve chewing.", icon: "/img/concern-missing-teeth.png", w: 130, h: 62 },
  { title: "Chipped Teeth", blurb: "Restore shape and strength.", icon: "/img/concern-chipped-teeth.png", w: 130, h: 124 },
] as const;

export const dentists = [
  {
    name: "Dr. Ali Farooq",
    role: "Implantologist & Oral Surgeon",
    focus: "Complex implant care",
    image: "/img/dentist-ali-farooq.webp",
  },
  {
    name: "Dr. Sarooj Hannan",
    role: "Cosmetic & Aligner Dentist",
    focus: "Smile designs & aligners",
    image: "/img/dentist-sarooj-hannan.webp",
  },
  {
    name: "Dr. Hussain Shahid",
    role: "Pediatric Dentist",
    focus: "Gentle care for children",
    image: "/img/dentist-hussain-shahid.webp",
  },
  {
    name: "Dr. Amna Riaz",
    role: "Restorative & Endodontic Dentist",
    focus: "Root canals & crowns",
    image: "/img/dentist-amna-riaz.webp",
  },
] as const;

export const results = {
  title: "SmileOn Treatments Before & After Results",
  subtitle: "Actual patients. Real transformations. (Shared with consent)",
  tabs: ["Smile Makeovers", "Dental Implants", "Aligners & Braces"],
  image: { src: "/img/before-after-smile-makeover.webp", alt: "Before and after a ceramic veneer smile makeover" },
  featured: {
    heading: "Featured Smile Makeover",
    rows: [
      { label: "Concern:", value: "Discoloured and uneven teeth" },
      { label: "Treatment:", value: "Ceramic veneers" },
      { label: "Result:", value: "A brighter, more confident smile" },
      { label: "Treating Dentist:", value: "Dr. Sarooj Hannan" },
    ],
    cta: "View Complete Case",
  },
} as const;

export const whyChoose = [
  {
    title: "Registered & Qualified Dentists",
    body: "Our dentists are fully qualified and registered with PMDC.",
    icon: "/icons/why-registered.svg",
    w: 56,
    h: 41,
  },
  {
    title: "Specialist-Led Treatment",
    body: "Your care is guided by the right specialist for your needs.",
    icon: "/icons/why-specialist.svg",
    w: 50,
    h: 52,
  },
  {
    title: "Complete Transparency",
    body: "We explain your options, treatment plan and costs before you begin.",
    icon: "/img/why-transparency.webp",
    w: 180,
    h: 220,
  },
  {
    title: "Patient-Focused Care",
    body: "We tailor treatment to your needs, comfort and long-term oral health.",
    icon: "/icons/why-patient-focused.svg",
    w: 55,
    h: 47,
  },
] as const;

export const overseas = {
  title: "Overseas Patients Welcome",
  points: [
    "Flexible scheduling around your travel",
    "Virtual consultations & treatment planning",
    "Assistance with airport transfers and local stay",
  ],
  cta: "Dental Care for Overseas Patients",
  image: { src: "/img/overseas-consultation.webp", alt: "A patient joining a virtual dental consultation" },
} as const;

export const reviews = {
  title: "What our patients say",
  subtitle: "Real reviews from our patients on Google.",
  cta: "View more reviews on Google",
  items: [
    {
      quote:
        "Excellent experience from consultation to treatment. The team explained everything clearly and the results are amazing.",
      author: "Ayesha K.",
    },
    {
      quote: "Very professional and friendly clinic. My braces journey has been smooth and comfortable.",
      author: "Hassan R.",
    },
    {
      quote:
        "Highly recommend SmileOn for anyone looking for quality dental care in Lahore. Great team and excellent service.",
      author: "Nadia S.",
    },
  ],
} as const;

export const faqs = [
  {
    q: "How do I book a consultation?",
    a: "Call the clinic, message us on WhatsApp, or use the booking form above. We will confirm your appointment the same day.",
  },
  {
    q: "Can I see the dentist who specialises in my treatment?",
    a: "Yes. Tell us what you are coming in for and we will book you with the specialist who handles that treatment.",
  },
  {
    q: "What happens during my first consultation?",
    a: "A full assessment, any imaging your case needs, and a written treatment plan with costs before anything begins.",
  },
  {
    q: "Do you welcome overseas patients?",
    a: "We do. We run virtual consultations before you travel and can help with scheduling, transfers and local stay.",
  },
  {
    q: "How much do dental treatments cost?",
    a: "Cost depends on the treatment and the number of visits. You will always have a written estimate before you commit.",
  },
  {
    q: "How long does dental treatment usually take?",
    a: "Some treatments finish in a single visit; implants and aligners run over several months. Your plan sets out the timeline.",
  },
] as const;

export const patientCare = {
  title: "Patient Care & Safety Promise",
  body: "Your care, safety and feedback are important to us. If you have any questions or concerns, contact our patient relations team.",
  cta: "Contact Patient Care Team",
  visitTitle: "Visit SmileOn in Johar Town",
  callCta: "Call Clinic",
  directionsCta: "Get directions",
  image: { src: "/img/clinic-exterior.webp", alt: "The SmileOn Dental Clinic building in Johar Town, Lahore" },
} as const;

export const footer = {
  blurb: "Patient care For every smile.",
  script: "Healthier Smiles Happier Lives",
  columns: [
    {
      title: "Quick Links",
      links: ["Dentists", "Results", "Overseas Patients", "About", "Contact"],
    },
    {
      title: "Treatments",
      links: ["Dental Implants", "Clear Aligners", "Braces", "Root Canal Treatment", "All Treatments"],
    },
  ],
  legal: "2026 SmileOn Dental Clinic. All rights reserved.",
  policies: ["Privacy Policy", "Terms & Conditions", "Sitemap"],
} as const;
