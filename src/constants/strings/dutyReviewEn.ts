export const dutyReviewEn = {
  publisher: 'Needs review: publisher is missing, inactive, or ineligible.',
  duplicate: 'Needs review: publisher has another duty in this meeting.',
  conflict: (title: string): string =>
    `Overlapping assignment: ${title}.`,
  unverified: (title: string): string =>
    `Cannot verify: check the date, start time, end time, and time zone for "${title}".`,
} as const;