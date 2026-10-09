// Real people and real feedback only. Both lists start empty on purpose and the
// sections that show them stay hidden until something is added here.
//
// Do not add invented tutors, ratings or testimonials: they are misleading to
// customers, against advertising rules in the US, UK, EU and Australia, and a
// fast way to lose the trust this site is built on. Add a tutor only with their
// consent, a real photo and credentials you have checked. Add a review only if
// it is a real customer's words, with their permission.

export type TeamMember = {
  name: string;
  photo?: string; // path under /public, e.g. /team/amina.jpg
  role: string; // e.g. "Writing coach and editor"
  degree: string; // e.g. "MA English Literature, University of Leeds"
  subjects: string[];
  bio: string; // one or two sentences
};

export type Review = {
  quote: string;
  name: string; // first name and initial is fine
  country: string;
  service: string;
  date: string; // e.g. "October 2026"
};

export const TEAM: TeamMember[] = [];
export const REVIEWS: Review[] = [];
