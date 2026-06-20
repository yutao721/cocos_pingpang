import { loadJson } from "../../framework/utils/CommonFun";
import { Api } from "../api/api";
import { IGeneralConfig } from "../const/Interface";




export class GeneralModel {
    
    // 武将配置数据
    private generalConfig: IGeneralConfig[];

    public get generalConfigVal () {
        return this.generalConfig;
    }

    private myGeneral: number[] = [];
    public get myGeneralList () {
        return this.myGeneral;
    }

    // 青龙刀数量
    private greenDragonBladeNum: number = 0;
    public get greenDragonBladeNumVal () {
        return this.greenDragonBladeNum;
    }

    public initConfig () {
        loadJson('json/general').then((data: IGeneralConfig[]) => {
            this.generalConfig = data;
        });
    }

    /**
     * 更新已获取的武将列表
     */
    public async updateGeneral () {
        const res = await Api.getGeneral();
        this.myGeneral = [];
        res.data.general && res.data.general.forEach((item: any) => {
            this.myGeneral.push(item.generalId);
        });
    }

    /**
     * 更新青龙刀数量
     */
    public async updateGreenDragonNum () {
        const res = (await Api.getQldCount()).data;
        this.greenDragonBladeNum = res.num;
        return this.greenDragonBladeNum;
    }

}