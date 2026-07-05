import { HttpClient } from "../../framework/http/HttpClient";
import { md5 } from '../../framework/utils/MD5';

/**
 * API路径
 */
export const ApiPath = {
  USER_INFO: 'webapi/pingpong/userinfo',
  GAME_END: 'webapi/pingpong/result',
  REWARD: 'webapi/pingpong/record',
  RANK: 'webapi/pingpong/rank',
  CLEAR: 'webapi/pingpong/clear'
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

      response.data = responseData;
      return response;
    });
  }


  /**
   * 获取用户信息
   * @returns 
   */
  public static async getUserInfo() {
    return HttpClient.post<any>(ApiPath.USER_INFO);
  }

  /**
   * 游戏结束，提交游戏结果
   * @param param 
   * @returns 
   */
  public static async gameEnd(param: { score: number, second: number }) {
    return HttpClient.post<any>(ApiPath.GAME_END, param);
  }


  /**
   * 获取奖励
   * @param param 
   * @returns 
   */
  public static async getReward() {
    return HttpClient.post<any>(ApiPath.REWARD);
  }

  /**
   * 获取排行榜
   * @returns 
   */
  public static async getRankList() {
    return HttpClient.post<any>(ApiPath.RANK);
  }

  /**
   * 清除数据
   * @returns 
   */
  public static async clearData() {
    return HttpClient.post<any>(ApiPath.CLEAR);
  }

}

const LOCAL_PROXY_BASE_URL = 'http://127.0.0.1:3001/';
const PROD_BASE_URL = 'http://dm.crocs.cn/webapi/pingpong';

const isLocalHost = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// 本地开发走代理（仅转发 /webapi/pingpong 前缀）
Api.init(isLocalHost ? LOCAL_PROXY_BASE_URL : PROD_BASE_URL);
