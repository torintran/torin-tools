export type CheatSheet = {
  id: string;
  name: string;
  keywords: string[];
  groups: {
    title: [en: string, vi: string];
    commands: [en: string, vi: string, example: string, reference: string][];
  }[];
};
