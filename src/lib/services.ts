// The one list of what Trivium Tutors offers. The form, the server-side
// validation and the team notification all read from here, so a service is
// added or renamed in a single place.
//
// Deliberately NOT here: sitting exams, attending classes as the student, or
// writing work the student will submit as their own. See /integrity.

export type ServiceId = "tutoring" | "assignment" | "editing" | "coaching" | "research" | "career";

/** "call" requests are scheduled as a conversation, "quote" requests are priced from the material. */
export type Route = "call" | "quote";

export type Service = {
  id: ServiceId;
  title: string;
  blurb: string;
  route: Route;
  /** Short line shown on the form once picked, so people know what happens next. */
  next: string;
  detailsPrompt: string;
};

export const SERVICES: Service[] = [
  {
    id: "tutoring",
    title: "1:1 tutoring",
    blurb: "Live sessions to understand a subject, prepare for an exam, or build study habits.",
    route: "call",
    next: "We will suggest a short intro call to agree the plan and schedule.",
    detailsPrompt: "What do you want to get better at, and what is coming up (exam, module, deadline)?",
  },
  {
    id: "assignment",
    title: "Assignment help",
    blurb: "Make sense of your brief. We break down what is asked, plan your approach and point you to sources, and you write it.",
    route: "call",
    next: "We will suggest a short session to walk through your assignment together.",
    detailsPrompt: "What is the assignment, when is it due, and which part is confusing? Share the brief by link if you can.",
  },
  {
    id: "editing",
    title: "Editing and proofreading",
    blurb: "Feedback and corrections on a draft you wrote: grammar, clarity, structure and referencing.",
    route: "quote",
    next: "You get a live price estimate as you go. We confirm the final price with you before any work starts.",
    detailsPrompt: "Tell us about the document and what kind of help you want. Please do not paste the full text here.",
  },
  {
    id: "coaching",
    title: "Writing coaching",
    blurb: "Learn to plan, argue and write better essays, theses and reports, with feedback on your own drafts.",
    route: "call",
    next: "We will suggest a short intro call to see where you are and what to work on.",
    detailsPrompt: "What are you writing, what stage is it at, and where do you feel stuck?",
  },
  {
    id: "research",
    title: "Research support",
    blurb: "Guidance on finding sources, choosing a method, and structuring a literature review.",
    route: "call",
    next: "We will suggest a short intro call to scope the research help you need.",
    detailsPrompt: "What is the research question or topic, and what do you need help with?",
  },
  {
    id: "career",
    title: "CV and application review",
    blurb: "Review and coaching on your CV, personal statement or cover letter, so it is clearly yours and stronger.",
    route: "quote",
    next: "You get a live price estimate as you go. We confirm the final price with you before any work starts.",
    detailsPrompt: "What are you applying for, and what do you want reviewed?",
  },
];

export const LEVELS = ["High school", "Undergraduate", "Postgraduate", "Professional or other"] as const;

export const STYLES = ["APA", "MLA", "Harvard", "Chicago", "Turabian", "Vancouver", "IEEE", "Oxford", "AMA", "ASA", "Other or not sure"] as const;

export const CONTACT_PREFS = ["email", "whatsapp"] as const;
export type ContactPref = (typeof CONTACT_PREFS)[number];

export const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Ireland",
  "Germany",
  "France",
  "Netherlands",
  "Spain",
  "Italy",
  "Sweden",
  "Norway",
  "Denmark",
  "Australia",
  "New Zealand",
  "Brazil",
  "Argentina",
  "Chile",
  "Colombia",
  "Other",
] as const;

export function serviceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}
