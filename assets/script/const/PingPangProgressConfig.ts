export interface IPingPangProgressMilestone {
  key: string;
  score: number;
  label: string;
  /** 该里程碑在进度条上的实际比例位置（0~1），不填则按 score/maxScore 线性计算 */
  progress?: number;
}

export const PingPangProgressMaxScore = 300;

export const PingPangProgressMilestones: IPingPangProgressMilestone[] = [
  {
    key: 'point100',
    score: 50,
    label: '50',
    progress: 0.235,
  },
  {
    key: 'point300',
    score: 100,
    label: '100',
    progress: 0.606,
  },
  {
    key: 'point500',
    score: 300,
    label: '300',
    progress: 0.970,
  },
];
