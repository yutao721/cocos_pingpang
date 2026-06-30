import { HttpClient } from "../../framework/http/HttpClient";
import { md5 } from '../../framework/utils/MD5';

/**
 * API路径
 */
export const ApiPath = {
  LOGIN: 'webapi/pingpong/record',
  GAME_START: 'api/game/start',
  GENERAL: 'api/user/general',
  TASK_REPORT: 'api/game/task/report',
  USER_INFO: 'webapi/pingpong/record',
  GAME_END: 'api/game/complete',
  QLD_REPORT: 'api/qld/report',
  QLD_COUNT: 'api/qld',
  REWARD: 'api/user/reward/obtain',
  RANK: 'api/user/general/ranking',
  PROP_SHARE: 'api/user/prop/share'
};

// 签名配置
const API_KEY = 'crocsdm.2026';

export class Api {

  public static init(baseUrl: string) {
    HttpClient.init(baseUrl);

    // 请求拦截器：自动组装 openid / timestamp / signature 签名
    HttpClient.addRequestInterceptor((request) => {
      const openid = localStorage.getItem('openid') || 'oQol45ehzK1YandpPERyoCYBUB8Q';
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

    // 响应拦截器
    HttpClient.addResponseInterceptor((response) => {
      const responseData = response.data as any;

      console.log('api response', responseData);

      if (responseData.errcode !== 0) {
        const error = new Error(responseData.msg || '请求失败');
        (error as any).errcode = responseData.code;
        throw error;
      }

      response.data = responseData.data;
      return response;
    });
  }



  /**
   * 用户登录
  */
  public static async login(param: any) {
    return HttpClient.post<{ token: string }>(ApiPath.LOGIN, param);
  }

  /**
   * 开始游戏
   * @param param 
   * @returns 
   */
  public static async gameStart() {
    return HttpClient.post<any>(ApiPath.GAME_START, {});
  }

  /**
   * 拥有武将
   * @returns 
   */
  public static async getGeneral() {
    return HttpClient.get<any>(ApiPath.GENERAL, {});
  }

  /**
   * 任务完成上报
   * @param param 
   * @returns 
   */
  public static async taskReport(param: { game_id: number, task_id: number, status: number }) {
    return HttpClient.post<any>(ApiPath.TASK_REPORT, param);
  }

  /**
   * 获取用户信息
   * @returns 
   */
  public static async getUserInfo() {
    return HttpClient.post<any>(ApiPath.USER_INFO, {});
  }

  /**
   * 游戏结束
   * @param param 
   * @returns 
   */
  public static async gameEnd(param: { game_id: number, status: number, general_status: number }) {
    return HttpClient.post<any>(ApiPath.GAME_END, param);
  }

  /**
   * 获取青龙刀任务上报
   * @param param 
   * @returns 
   */
  public static async qldReport(param: { game_id: number }) {
    return HttpClient.post<any>(ApiPath.QLD_REPORT, param);
  }

  /**
   * 获取青龙刀数量
   * @returns 
   */
  public static async getQldCount() {
    return HttpClient.get<any>(ApiPath.QLD_COUNT);
  }

  /**
   * 获取奖励
   * @param param 
   * @returns 
   */
  public static async getReward(param: { source: number }) {
    return HttpClient.get<any>(ApiPath.REWARD, param);
  }

  /**
   * 获取排行榜
   * @returns 
   */
  public static async getRankList() {
    return HttpClient.get<{ list: { nickname: string, general: number }[] }>(ApiPath.RANK);
  }

  /**
   * 道具分享后使用上报
   * @param param 
   * @returns 
   */
  public static async propShare(param: { source: number }) {
    return HttpClient.post<any>(ApiPath.PROP_SHARE, param);
  }
}

const LOCAL_PROXY_BASE_URL = 'http://127.0.0.1:3001/';
const PROD_BASE_URL = 'http://dm.crocs.cn/webapi/pingpong';

const isLocalHost = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// 本地开发走代理（仅转发 /webapi/pingpong 前缀）
Api.init(isLocalHost ? LOCAL_PROXY_BASE_URL : PROD_BASE_URL);
