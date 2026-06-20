import { Api } from "../api/api";
import { ePropType } from "../const/GameConst";


export class UserInfoModel {

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
    public get isSoundEnabledVal () {
        return this.isSoundEnabled;
    }

    // 无懈可击今日使用次数
    private flawlessCount: number = 0;
    // 铁索连环今日使用次数
    private chainCount: number = 0;
    // 重置今日使用次数
    private resetCount: number = 0;

    public initConfig() {
        if (localStorage.getItem('soundEnabled') === 'false') {
            this.isSoundEnabled = false;
        }
    }

    public initUserInfo() {
        this.updateUserInfo();
    }

    public updateUserInfo() {
        Api.getUserInfo().then(res => {       
            const info = res.data;
            if (info) {
                this.rewardArr = info.user_prize;
                this.dayGameNum = info.day_game_num;
                this.flawlessCount = info.arbitrary;
                this.chainCount = info.automatic;
                this.resetCount = info.recharge;
            }
        });
    }

    /**
     * 设置声音开关
     * @param val 
     */
    public setSoundEnabled (val: boolean) {
        this.isSoundEnabled = val;
        localStorage.setItem('soundEnabled', val.toString());
    }

    /**
     * 使用道具
     * @param type 
     */
    public useProp(type: ePropType) {
        switch (type) {
            case ePropType.flawless:
                this.flawlessCount++;
                break;
            case ePropType.chain:
                this.chainCount++;
                break;
            case ePropType.reset:
                this.resetCount++;
                break;
        }
        Api.propShare({source: type});
    }

    /**
     * 使用道具次数
     * @param type 
     * @returns 
     */
    public getPropCount(type: ePropType) {
        switch (type) {
            case ePropType.flawless:
                return this.flawlessCount;
            case ePropType.chain:
                return this.chainCount;
            case ePropType.reset:
                return this.resetCount;
        }
        return 0;
    }

}