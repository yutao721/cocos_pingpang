export interface IPingPangProgressMilestone {
  key: string;
  score: number;
  label: string;
}

export const PingPangProgressMaxScore = 500;

export const PingPangProgressMilestones: IPingPangProgressMilestone[] = [
  {
    key: 'point100',
    score: 50,
    label: '100',
  },
  {
    key: 'point300',
    score: 300,
    label: '300',
  },
  {
    key: 'point500',
    score: 500,
    label: '500',
  },
];
