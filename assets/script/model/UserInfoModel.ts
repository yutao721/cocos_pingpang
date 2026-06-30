import { Api } from "../api/api";

export interface IUserInfo {
  nickname: string;
  openid: string;
  headimgurl: string;
}

export class UserInfoModel {

  private static readonly USER_INFO_CACHE_KEY = 'pp_user_info';

  private rewardArr: Array<any> = [];
  public get rewardList() {
    return this.rewardArr;
  }

  private dayGameNum: number = 0;
  public get dayGameNumVal() {
    return this.dayGameNum;
  }

  // 是否打开声音
  private isSoundEnabled: boolean = true;
  public get isSoundEnabledVal() {
    return this.isSoundEnabled;
  }

  private userInfo: IUserInfo | null = null;
  public get userInfoVal(): IUserInfo | null {
    return this.userInfo;
  }

  public initConfig() {
    if (localStorage.getItem('soundEnabled') === 'false') {
      this.isSoundEnabled = false;
    }
    this.loadUserInfoFromCache();
  }

  public initUserInfo() {
    this.updateUserInfo();
  }

  public updateUserInfo() {
    Api.getUserInfo()
      .then(res => {
        const info = res?.data?.userinfo;
        if (!info) return;
        const nextInfo: IUserInfo = {
          nickname: String(info.nickname || ''),
          openid: String(info.openid || ''),
          headimgurl: String(info.headimgurl || ''),
        };
        this.setUserInfo(nextInfo);
      })
      .catch(err => {
        console.warn('updateUserInfo failed', err);
      });
  }

  /**
   * 设置声音开关
   * @param val
   */
  public setSoundEnabled(val: boolean) {
    this.isSoundEnabled = val;
    localStorage.setItem('soundEnabled', val.toString());
  }

  private setUserInfo(info: IUserInfo) {
    this.userInfo = info;
    localStorage.setItem(UserInfoModel.USER_INFO_CACHE_KEY, JSON.stringify(info));
    console.log('updateUserInfo', info.nickname);
    console.log('updateUserInfo', info.openid);
    console.log('updateUserInfo', info.headimgurl);
  }

  private loadUserInfoFromCache() {
    const raw = localStorage.getItem(UserInfoModel.USER_INFO_CACHE_KEY);
    if (!raw) return;
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
}
