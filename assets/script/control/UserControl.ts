import { AudioManager } from "../../framework/audio/AudioManager";
import { IUserInfo, UserInfoModel } from "../model/UserInfoModel";


export class UserControl {
  private static instance: UserControl;

  public static get Instance(): UserControl {
    if (this.instance == null) {
      this.instance = new UserControl();
    }
    return this.instance;
  }

  private userInfoModel: UserInfoModel = null;

  private isLogin: boolean = true;
  public get isLoginVal(): boolean {
    return this.isLogin;
  }

  private constructor() {
    this.userInfoModel = new UserInfoModel();
  }

  public login() {
    this.isLogin = true;
  }

  public initConfigData() {
    this.userInfoModel.initConfig();
  }

  public async initUserData() {
    this.userInfoModel.initUserInfo();
  }

  public getRewardList() {
    return this.userInfoModel.rewardList;
  }

  public getUserInfo(): IUserInfo | null {
    return this.userInfoModel.userInfoVal;
  }


  /**
   * 设置声音是否开启
   * @returns 
   */
  public setSoundEnabled(isOn: boolean) {
    this.userInfoModel.setSoundEnabled(isOn);
  }

  /**
   * 声音是否开启
   * @returns 
   */
  public getSoundEnabled() {
    return this.userInfoModel.isSoundEnabledVal;
  }

  /**
   * 更新背景音乐
   */
  public updatePlayBgmState() {
    if (this.getSoundEnabled()) {
      AudioManager.Instance.playBGM('audio/bgm');
    }
    else {
      AudioManager.Instance.stopBGM();
    }
  }

  /**
   * 音效
   * @param audioName 
   */
  public playSFX(audioName: string) {
    if (this.getSoundEnabled()) {
      AudioManager.Instance.playSFX(audioName);
    }
  }


}

export const userControl = UserControl.Instance;
