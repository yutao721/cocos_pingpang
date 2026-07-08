import { PingPangProgressMilestones } from './PingPangProgressConfig';

export enum RewardState {
  unfinished = 0,
  received = 1,
  claimable = 2,
}

export interface IRewardApiData {
  point100: number;
  point300: number;
  point500: number;
  recordmaxscore: number;
}

export type RewardStatusKey = keyof Pick<IRewardApiData, 'point100' | 'point300' | 'point500'>;

export const RewardInfoUpdateEvent = 'rewardInfoUpdate';

export const RewardStatusFieldByKey: Record<string, RewardStatusKey> = {
  'point100': 'point100',
  'point300': 'point300',
  'point500': 'point500',
};

export const DefaultRewardStateByKey: Record<string, RewardState> = {
  'point100': RewardState.unfinished,
  'point300': RewardState.unfinished,
  'point500': RewardState.unfinished,
};

export const RewardUnlockScoreByKey: Record<string, number> = PingPangProgressMilestones.reduce(
  (result, milestone) => {
    result[milestone.key] = milestone.score;
    return result;
  },
  {} as Record<string, number>,
);
