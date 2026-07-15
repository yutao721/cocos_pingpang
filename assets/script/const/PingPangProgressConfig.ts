export interface IPingPangProgressMilestone {
  key: string;
  score: number;
  label: string;
}

export const PingPangProgressMaxScore = 300;

export const PingPangProgressMilestones: IPingPangProgressMilestone[] = [
  {
    key: 'point100',
    score: 50,
    label: '50',
  },
  {
    key: 'point300',
    score: 100,
    label: '100',
  },
  {
    key: 'point500',
    score: 300,
    label: '300',
  },
];
