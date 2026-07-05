import { PingPangProgressMilestones } from './PingPangProgressConfig';

export enum RewardState {
  unfinished = 0,
  received = 1,
  claimable = 2,
}

export interface IRewardApiData {
  video: number;
  point100: number;
  point500: number;
  recordmaxscore: number;
}

export type RewardStatusKey = keyof Pick<IRewardApiData, 'video' | 'point100' | 'point500'>;

export const RewardInfoUpdateEvent = 'rewardInfoUpdate';

export const RewardStatusFieldByKey: Record<string, RewardStatusKey> = {
  video: 'video',
  '100_hole': 'point100',
  '500_hole': 'point500',
};

export const DefaultRewardStateByKey: Record<string, RewardState> = {
  video: RewardState.unfinished,
  '100_hole': RewardState.unfinished,
  '500_hole': RewardState.unfinished,
};

export const RewardUnlockScoreByKey: Record<string, number> = PingPangProgressMilestones.reduce(
  (result, milestone) => {
    result[milestone.key] = milestone.score;
    return result;
  },
  {} as Record<string, number>,
);
