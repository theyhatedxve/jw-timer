export const watchtowerImportEn = {
  title: 'Watchtower study articles',
  scope:
    'English and Waray PDF layouts supported. Compare the title and songs with the PDF. Match the confirmed meeting date to the printed study week.',
  choose: 'Review this study',
  review: 'Confirm Weekend meeting',
  openingHint:
    'The Watchtower article does not provide the Public Talk opening song. Confirm it locally.',
  profile:
    'Save your congregation profile and timezone in Settings before reviewing a study.',
  timezone: (value: string): string =>
    `Congregation timezone: ${value}`,
  timezoneHint: 'Change this timezone in your congregation profile.',
  fields: {
    articleTitle: 'Study title',
    openingSong: 'Opening song number',
    middleSong: 'Middle song number',
    closingSong: 'Closing song number',
    meetingDate: 'Meeting date, YYYY-MM-DD',
    startLocalTime: 'Local start time, HH:mm',
  },
  preview: 'Program preview',
  incomplete: 'Complete the fields to preview all five timed parts.',
  total: (value: string): string => `Total: ${value}`,
  open: 'Open meeting editor',
  cancel: 'Cancel review',
  unavailable: 'Reopen this study and check your congregation profile.',
  discardTitle: 'Discard this review?',
  discardMessage: 'Your unsaved import fields will be lost.',
  keep: 'Keep reviewing',
  discard: 'Discard',
} as const;
