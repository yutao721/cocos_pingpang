import { HttpClient } from "../../framework/http/HttpClient";

/**
 * API路径
 */
export const ApiPath = {
  LOGIN: 'api/login/game/uid/send/email',
  GAME_START: 'api/game/start',
  GENERAL: 'api/user/general',
  TASK_REPORT: 'api/game/task/report',
  USER_INFO: 'api/user/info',
  GAME_END: 'api/game/complete',
  QLD_REPORT: 'api/qld/report',
  QLD_COUNT: 'api/qld',
  REWARD: 'api/user/reward/obtain',
  RANK: 'api/user/general/ranking',
  PROP_SHARE: 'api/user/prop/share'
};

export class Api {

  public static init(baseUrl: string) {
    HttpClient.init(baseUrl);
    HttpClient.addRequestInterceptor((request) => {
      // 从本地存储获取token
      const token = localStorage.getItem('token');
      if (token) {
        request.headers = {
          ...request.headers,
          'Authorization': `${token}`
          //'Authorization': `test`
        };
      }
      return request;
    });
    HttpClient.addResponseInterceptor((response) => {
      // 服务端返回格式为 { code: number, data: any, msg: string }
      const responseData = response.data as any;

      console.log('api response', responseData);

      // 检查业务状态码
      if (responseData.code !== 0 && responseData.code !== -600) {
        const error = new Error(responseData.msg || '请求失败');
        (error as any).code = responseData.code;
        throw error;
      }

      // 提取实际数据
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
    return HttpClient.get<any>(ApiPath.USER_INFO, {});
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

Api.init('https://sgsolmnlmtest.sanguosha.com/');
//Api.init('http://10.225.68.209:8300/');