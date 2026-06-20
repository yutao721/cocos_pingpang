import { AudioManager } from "../../framework/audio/AudioManager";
import { Api } from "../api/api";
import { ePropType } from "../const/GameConst";
import { GeneralModel } from "../model/GeneralModel";
import { UserInfoModel } from "../model/UserInfoModel";


export class UserControl {
    private static instance: UserControl;

    public static get Instance(): UserControl {
        if (this.instance == null) {
            this.instance = new UserControl();
        }
        return this.instance;
    }

    private generalModel: GeneralModel = null;
    private userInfoModel: UserInfoModel = null;

    private isLogin: boolean = false;
    public get isLoginVal(): boolean {
        return this.isLogin;
    }

    private constructor() {
        this.userInfoModel = new UserInfoModel();
        this.generalModel = new GeneralModel();
    }

    public login() {
        this.isLogin = true;
    }

    public initConfigData() {
        this.userInfoModel.initConfig();
        this.generalModel.initConfig();
    }

    public async initUserData() {
        this.userInfoModel.initUserInfo();
        this.generalModel.updateGeneral();
    }

    public getRewardList() {
        return this.userInfoModel.rewardList;
    }

    /**
     * 当天游戏次数
     * @returns 
     */
    public getDayGameNum() {
        return this.userInfoModel.dayGameNumVal;
    }

    /**
     * 已获取的武将
     * @returns 
     */
    public getMyGeneral() {
        return this.generalModel.myGeneralList;
    }

    /**
     * 是否有该武将
     * @param generalId 
     * @returns 
     */
    public hasGeneral(generalId: number) {
        return this.generalModel.myGeneralList.some(id => id === generalId);
    }

    /**
     * 更新武将数据
     */
    public async updateMyGeneral() {
        await this.generalModel.updateGeneral();
        return this.generalModel.myGeneralList;
    }

    /**
     * 所有武将配置数据
     * @returns 
     */
    public getAllGeneralConfig() {
        return this.generalModel.generalConfigVal;
    }

    /**
     * 武将配置数据
     * @param generalId 
     * @returns 
     */
    public getGeneralConfig(generalId: number) {
        return this.generalModel.generalConfigVal.find(config => config.id === generalId);
    }

    /**
     * 获取青龙刀的数量
     * @returns 
     */
    public getGreenDragonBladeNum() {
        return this.generalModel.updateGreenDragonNum();
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

    /**
     * 使用道具次数
     * @param type 
     * @returns 
     */
    public getPropUseCount(type: ePropType) {
        return this.userInfoModel.getPropCount(type);
    }

    /**
     * 使用道具
     * @param type 
     */
    public useProp(type: ePropType) {
        this.userInfoModel.useProp(type);
    }
}

export const userControl = UserControl.Instance;