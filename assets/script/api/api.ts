import { HttpClient } from "../../framework/http/HttpClient";
import { HttpMethod, HttpResponse } from "../../framework/http/HttpRequester";
import { md5 } from '../../framework/utils/MD5';
import { getUrlParam } from '../../framework/utils/CommonFun';
import { EnableMockApi } from "../const/GameConst";
import { IRewardApiData } from "../const/RewardConst";

/**
 * API paths
 */
export const ApiPath = {
  USER_INFO: 'webapi/pingpong/userinfo',
  GAME_END: 'webapi/pingpong/result',
  REWARD: 'webapi/pingpong/record',
  RANK: 'webapi/pingpong/rank',
  CLEAR: 'webapi/pingpong/clear'
};

const API_KEY = 'crocsdm.2026';
const MOCK_API_STORAGE_KEY = 'pp_mock_api';
const MOCK_USER_INFO_CACHE_KEY = 'pp_user_info';
const MOCK_REWARD_INFO_CACHE_KEY = 'pp_reward_info';

interface IApiUserInfo {
  nickname: string;
  openid: string;
  headimgurl: string;
}

interface IApiRankItem {
  rank: number;
  openid: string;
  nickname: string;
  headimgurl: string;
  score: number;
  general: number;
}

const DEFAULT_MOCK_USER_INFO: IApiUserInfo = {
  nickname: '测试用户',
  openid: 'oQol45ehzK1YandpPERyoCYBUB8Q',
  headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202512/24/1766565681651113.png',
};

const DEFAULT_MOCK_REWARD_DATA: IRewardApiData = {
  video: 1,
  point100: 1,
  point500: 1,
  recordmaxscore: 100,
};

const DEFAULT_MOCK_RANK_ITEMS: Omit<IApiRankItem, 'rank'>[] = [
  {
    openid: 'mock-user-1',
    nickname: 'Alice',
    headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202504/6/174391468672043.png',
    score: 188,
    general: 15,
  },
  {
    openid: 'mock-user-2',
    nickname: 'Bob',
    headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202403/171159961960775.png',
    score: 156,
    general: 12,
  },
  {
    openid: 'mock-user-3',
    nickname: 'Cathy',
    headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202512/24/1766565681651113.png',
    score: 128,
    general: 10,
  },
  {
    openid: 'mock-user-4',
    nickname: 'David',
    headimgurl: 'https://usersstatic.solomochina.com/crocs/dm/avatar/202504/6/174391468672043.png',
    score: 96,
    general: 8,
  },
];

let hasReportedMockMode = false;

export class Api {

  public static init(baseUrl: string) {
    HttpClient.init(baseUrl);

    HttpClient.addRequestInterceptor((request) => {
      const openid = getUrlParam('openid') || DEFAULT_MOCK_USER_INFO.openid;
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signature = md5(API_KEY + openid + timestamp + API_KEY);

      request.headers = {
        ...request.headers,
        'openid': openid,
        'timestamp': timestamp,
        'signature': signature,
      };
      return request;
    });

    HttpClient.addResponseInterceptor((response) => {
      const responseData = response.data as any;

      console.log('api response', responseData);

      if (responseData.errcode !== 0) {
        const error = new Error(responseData.msg || 'request failed');
        (error as any).errcode = responseData.code;
        throw error;
      }

      response.data = responseData;
      return response;
    });
  }

  public static async getUserInfo() {
    if (this.shouldUseMockApi()) {
      return this.mockResponse(ApiPath.USER_INFO, {
        userinfo: this.getMockUserInfo(),
      });
    }

    return HttpClient.post<any>(ApiPath.USER_INFO);
  }

  public static async gameEnd(param: Record<string, any>) {
    if (this.shouldUseMockApi()) {
      this.updateMockRecordMaxScore(param?.score);
      return this.mockResponse(ApiPath.GAME_END, {
        success: true,
        ...param,
      });
    }

    return HttpClient.post<any>(ApiPath.GAME_END, param);
  }

  public static async getReward() {
    if (this.shouldUseMockApi()) {
      return this.mockResponse(ApiPath.REWARD, this.getMockRewardData());
    }

    return HttpClient.post<any>(ApiPath.REWARD);
  }

  public static async getRankList() {
    if (this.shouldUseMockApi()) {
      return this.mockResponse(ApiPath.RANK, this.buildMockRankData());
    }

    return HttpClient.post<any>(ApiPath.RANK);
  }

  public static async clearData() {
    if (this.shouldUseMockApi()) {
      this.saveJsonToStorage(MOCK_REWARD_INFO_CACHE_KEY, { ...DEFAULT_MOCK_REWARD_DATA });
      return this.mockResponse(ApiPath.CLEAR, {
        success: true,
      });
    }

    return HttpClient.post<any>(ApiPath.CLEAR);
  }

  private static shouldUseMockApi(): boolean {
    if (EnableMockApi) {
      return true;
    }

    const queryMockFlag = this.readQueryMockFlag();
    if (queryMockFlag !== null) {
      return queryMockFlag;
    }

    const storageMockFlag = this.readStorageValue(MOCK_API_STORAGE_KEY)?.trim().toLowerCase();
    return storageMockFlag === '1' || storageMockFlag === 'true' || storageMockFlag === 'on';
  }

  private static readQueryMockFlag(): boolean | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const rawValue = new URLSearchParams(window.location.search).get('mockApi');
      if (!rawValue) {
        return null;
      }

      const normalizedValue = rawValue.trim().toLowerCase();
      if (normalizedValue === '1' || normalizedValue === 'true' || normalizedValue === 'on') {
        return true;
      }

      if (normalizedValue === '0' || normalizedValue === 'false' || normalizedValue === 'off') {
        return false;
      }
    } catch (error) {
      console.warn('[Api] read mockApi query failed', error);
    }

    return null;
  }

  private static mockResponse<T>(url: string, data: T, method: HttpMethod = HttpMethod.POST): Promise<HttpResponse<T>> {
    if (!hasReportedMockMode) {
      hasReportedMockMode = true;
      console.warn('[Api] mock mode enabled, real requests are skipped.');
    }

    return Promise.resolve({
      data,
      status: 200,
      headers: {
        'x-mock-api': '1',
      },
      config: {
        url,
        method,
      },
    });
  }

  private static getMockUserInfo(): IApiUserInfo {
    const cachedInfo = this.readJsonFromStorage<Partial<IApiUserInfo>>(MOCK_USER_INFO_CACHE_KEY) ?? {};

    return {
      nickname: String(cachedInfo.nickname || DEFAULT_MOCK_USER_INFO.nickname),
      openid: String(cachedInfo.openid || DEFAULT_MOCK_USER_INFO.openid),
      headimgurl: String(cachedInfo.headimgurl || DEFAULT_MOCK_USER_INFO.headimgurl),
    };
  }

  private static getMockRewardData(): IRewardApiData {
    const cachedReward = this.readJsonFromStorage<Partial<IRewardApiData>>(MOCK_REWARD_INFO_CACHE_KEY) ?? {};

    return {
      video: this.toSafeInt(cachedReward.video),
      point100: this.toSafeInt(cachedReward.point100),
      point500: this.toSafeInt(cachedReward.point500),
      recordmaxscore: this.toSafeInt(cachedReward.recordmaxscore),
    };
  }

  private static updateMockRecordMaxScore(score: unknown): void {
    const safeScore = this.toSafeInt(score);
    if (safeScore <= 0) {
      return;
    }

    const rewardData = this.getMockRewardData();
    if (safeScore <= rewardData.recordmaxscore) {
      return;
    }

    rewardData.recordmaxscore = safeScore;
    this.saveJsonToStorage(MOCK_REWARD_INFO_CACHE_KEY, rewardData);
  }

  private static buildMockRankData(): { datas: IApiRankItem[]; myrank: IApiRankItem } {
    const userInfo = this.getMockUserInfo();
    const rewardData = this.getMockRewardData();
    const rawItems: Omit<IApiRankItem, 'rank'>[] = [
      {
        openid: userInfo.openid,
        nickname: userInfo.nickname,
        headimgurl: userInfo.headimgurl,
        score: rewardData.recordmaxscore,
        general: 0,
      },
      ...DEFAULT_MOCK_RANK_ITEMS,
    ];

    const datas = rawItems
      .sort((left, right) => right.score - left.score)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    const myrank = datas.find(item => item.openid === userInfo.openid) ?? datas[0];
    return { datas, myrank };
  }

  private static readStorageValue(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`[Api] read storage failed: ${key}`, error);
      return null;
    }
  }

  private static readJsonFromStorage<T>(key: string): T | null {
    const rawValue = this.readStorageValue(key);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch (error) {
      console.warn(`[Api] parse storage failed: ${key}`, error);
      return null;
    }
  }

  private static saveJsonToStorage(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[Api] save storage failed: ${key}`, error);
    }
  }

  private static toSafeInt(value: unknown): number {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    return Math.max(0, Math.floor(numericValue));
  }
}

const LOCAL_PROXY_BASE_URL = 'http://127.0.0.1:3001';
// const PROD_BASE_URL = 'https://dm.crocs.cn';
const PROD_BASE_URL = '';

const isLocalHost = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

Api.init(isLocalHost ? LOCAL_PROXY_BASE_URL : PROD_BASE_URL);
