export interface IPingPangProgressMilestone {
  key: string;
  score: number;
  label: string;
}

export const PingPangProgressMaxScore = 500;

export const PingPangProgressMilestones: IPingPangProgressMilestone[] = [
  {
    key: 'video',
    score: 100,
    label: '100',
  },
  {
    key: '100_hole',
    score: 300,
    label: '300',
  },
  {
    key: '500_hole',
    score: 500,
    label: '500',
  },
];
