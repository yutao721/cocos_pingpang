import { UiBase } from "../../framework/ui/UiBase";
import { Api } from "../api/api";
import {
  DefaultRewardStateByKey,
  IRewardApiData,
  RewardInfoUpdateEvent,
  RewardState,
  RewardStatusFieldByKey,
  RewardUnlockScoreByKey,
} from "../const/RewardConst";

export interface IUserInfo {
  nickname: string;
  openid: string;
  headimgurl: string;
}

type RewardStateMap = Record<string, RewardState>;

const DEFAULT_REWARD_DATA: IRewardApiData = {
  point100: 1,
  point300: 0,
  point500: 0,
  recordmaxscore: 0,
};

export class UserInfoModel {
  private static readonly USER_INFO_CACHE_KEY = 'pp_user_info';
  private static readonly REWARD_INFO_CACHE_KEY = 'pp_reward_info';

  private rewardStateMap: RewardStateMap = { ...DefaultRewardStateByKey };
  public get rewardList(): RewardStateMap {
    return this.rewardStateMap;
  }

  private rewardData: IRewardApiData = { ...DEFAULT_REWARD_DATA };
  public get rewardInfoVal(): IRewardApiData {
    return { ...this.rewardData };
  }

  private rewardCompletedCount = 0;
  public get rewardCompletedCountVal(): number {
    return this.rewardCompletedCount;
  }

  private recordMaxScore = 0;
  public get recordMaxScoreVal(): number {
    return this.recordMaxScore;
  }

  private dayGameNum = 0;
  public get dayGameNumVal(): number {
    return this.dayGameNum;
  }

  private isSoundEnabled = true;
  public get isSoundEnabledVal(): boolean {
    return this.isSoundEnabled;
  }

  private userInfo: IUserInfo | null = null;
  public get userInfoVal(): IUserInfo | null {
    return this.userInfo;
  }

  public initConfig(): void {
    if (localStorage.getItem('soundEnabled') === 'false') {
      this.isSoundEnabled = false;
    }

    this.loadUserInfoFromCache();
    this.loadRewardInfoFromCache();
  }

  public async initUserInfo(): Promise<void> {
    await Promise.all([
      this.updateUserInfo(),
      this.updateRewardInfo(),
    ]);
  }

  public async updateUserInfo(): Promise<void> {
    try {
      const res = await Api.getUserInfo();
      const info = res?.data?.userinfo;
      if (!info) {
        return;
      }

      const nextInfo: IUserInfo = {
        nickname: String(info.nickname || ''),
        openid: String(info.openid || ''),
        headimgurl: String(info.headimgurl || ''),
      };
      this.setUserInfo(nextInfo);
    } catch (err) {
      console.warn('updateUserInfo failed', err);
    }
  }

  public async updateRewardInfo(): Promise<void> {
    try {
      const res = await Api.getReward();
      const info = res?.data?.data ?? res?.data;
      console.log('updateRewardInfo', info);
      if (!info) {
        return;
      }

      this.applyRewardData({
        point100: this.toSafeInt(info.point100),
        point300: this.toSafeInt(info.point300),
        point500: this.toSafeInt(info.point500),
        recordmaxscore: this.toSafeInt(info.recordmaxscore),
      });
    } catch (err) {
      console.warn('updateRewardInfo failed', err);
    }
  }

  public getRewardState(key: string): RewardState {
    return this.rewardStateMap[key] ?? RewardState.unfinished;
  }

  public updateRecordMaxScore(score: number): void {
    const safeScore = this.toSafeInt(score);
    if (safeScore <= this.recordMaxScore) {
      return;
    }

    this.recordMaxScore = safeScore;
    this.rewardData.recordmaxscore = safeScore;
    this.rebuildRewardStateMap();
    this.saveRewardInfoToCache();
    this.emitRewardInfoUpdate();
  }

  public setSoundEnabled(val: boolean): void {
    this.isSoundEnabled = val;
    localStorage.setItem('soundEnabled', val.toString());
  }

  private setUserInfo(info: IUserInfo): void {
    this.userInfo = info;
    localStorage.setItem(UserInfoModel.USER_INFO_CACHE_KEY, JSON.stringify(info));
  }

  private loadUserInfoFromCache(): void {
    const raw = localStorage.getItem(UserInfoModel.USER_INFO_CACHE_KEY);
    if (!raw) {
      return;
    }

    try {
      const info = JSON.parse(raw);
      this.userInfo = {
        nickname: String(info.nickname || ''),
        openid: String(info.openid || ''),
        headimgurl: String(info.headimgurl || ''),
      };
    } catch (err) {
      console.warn('parse user info cache failed', err);
      localStorage.removeItem(UserInfoModel.USER_INFO_CACHE_KEY);
    }
  }

  private loadRewardInfoFromCache(): void {
    const raw = localStorage.getItem(UserInfoModel.REWARD_INFO_CACHE_KEY);
    if (!raw) {
      this.rebuildRewardStateMap();
      return;
    }

    try {
      const info = JSON.parse(raw);
      this.applyRewardData(
        {
          point100: info.point100,
          point300: info.point300,
          point500: info.point500,
          recordmaxscore: info.recordmaxscore,
        },
        false,
      );
    } catch (err) {
      console.warn('parse reward info cache failed', err);
      localStorage.removeItem(UserInfoModel.REWARD_INFO_CACHE_KEY);
      this.rebuildRewardStateMap();
    }
  }

  private applyRewardData(data: Partial<IRewardApiData>, shouldEmit = true): void {
    this.rewardData = {
      point100: this.toSafeInt(data.point100),
      point300: this.toSafeInt(data.point300),
      point500: this.toSafeInt(data.point500),
      recordmaxscore: this.toSafeInt(data.recordmaxscore),
    };
    this.recordMaxScore = Math.max(this.recordMaxScore, this.rewardData.recordmaxscore);
    this.rewardData.recordmaxscore = this.recordMaxScore;
    this.rebuildRewardStateMap();
    this.saveRewardInfoToCache();

    if (shouldEmit) {
      this.emitRewardInfoUpdate();
    }
  }

  private rebuildRewardStateMap(): void {
    const nextStateMap: RewardStateMap = {};

    Object.keys(DefaultRewardStateByKey).forEach((key) => {
      nextStateMap[key] = DefaultRewardStateByKey[key];
    });

    Object.keys(RewardStatusFieldByKey).forEach((key) => {
      const statusKey = RewardStatusFieldByKey[key];
      const unlockScore = RewardUnlockScoreByKey[key] ?? 0;
      const isUnlocked = this.recordMaxScore >= unlockScore;
      const rawState = this.rewardData[statusKey];
      nextStateMap[key] = this.normalizeRewardState(rawState, isUnlocked);
    });

    this.rewardCompletedCount = Object.keys(nextStateMap).reduce((count, key) => {
      return nextStateMap[key] !== RewardState.unfinished ? count + 1 : count;
    }, 0);
    this.rewardStateMap = nextStateMap;
  }

  private normalizeRewardState(rawState: number, isUnlocked: boolean): RewardState {
    const safeState = this.toSafeInt(rawState);
    if (safeState === RewardState.received || safeState === RewardState.claimable) {
      return safeState;
    }

    if (!isUnlocked) {
      return RewardState.unfinished;
    }

    return safeState > 0 ? RewardState.received : RewardState.claimable;
  }

  private saveRewardInfoToCache(): void {
    localStorage.setItem(
      UserInfoModel.REWARD_INFO_CACHE_KEY,
      JSON.stringify(this.rewardData),
    );
  }

  private emitRewardInfoUpdate(): void {
    UiBase.emitUiEvent(
      RewardInfoUpdateEvent,
      this.recordMaxScore,
      this.rewardStateMap,
      this.rewardCompletedCount,
      this.rewardInfoVal,
    );
  }

  private toSafeInt(value: unknown): number {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    return Math.max(0, Math.floor(numericValue));
  }
}
