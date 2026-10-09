// The revision and refund terms in one place. The FAQ, the Terms, the Refunds
// page and the form copy all read from here, so a change is made once and the
// site never contradicts itself. These are sensible starting defaults chosen by
// Claude on 2026-10-09 with Joshua's go-ahead; change the numbers freely, but
// only to terms the business will actually honour.

export const POLICY = {
  /** Free follow-up passes on editing and application reviews, on the same document. */
  freeRevisions: 1,
  /** Days after delivery the free revision can be requested. */
  revisionWindowDays: 7,
  /** How late (hours) a delivery must be before the rush surcharge is refunded. */
  lateHours: 24,
  /** Days after delivery to tell us the work missed what was agreed. */
  disputeWindowDays: 7,
  /** Notice, in hours, to cancel or move a tutoring session without losing it. */
  sessionNoticeHours: 24,
  /** Days within which unused prepaid tutoring hours can be refunded. */
  unusedHoursDays: 90,
  /** Days to expect a refund once approved. */
  refundPayoutDays: 10,
} as const;
