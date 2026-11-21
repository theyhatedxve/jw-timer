export const meetingConflictEn = {
  overlap: (title: string): string =>
    `This publisher is already assigned to overlapping meeting "${title}".`,

  unverified: (title: string): string =>
    `Cannot verify "${title}". Set valid start and end times and a time zone. Ambiguous daylight-saving times cannot be verified.`,
} as const;
