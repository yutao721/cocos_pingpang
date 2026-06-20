import { _decorator, Button, Component, EditBox, error, Node } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { Api } from '../api/api';
import { userControl } from '../control/UserControl';
const { ccclass, property } = _decorator;

@ccclass('LoginPopup')
export class LoginPopup extends UiBase {

    @property(EditBox)
    idEditBox: EditBox = null;

    @property(EditBox)
    codeEditBox: EditBox = null;

    @property(Button)
    loginBtn: Button = null;

    @property(Button)
    ticketBtn: Button = null;
    
    private _isAutoLogin: boolean = false;

    protected onLoad(): void {
        this.loginBtn.node.on('click', this.onLoginBtnClick, this);
        this.ticketBtn.node.on('click', this.onTicketBtnClick, this);
    }

    protected start(): void {
        if (localStorage.getItem('guid')) {
            this.idEditBox.string = localStorage.getItem('guid');
        }
        if (localStorage.getItem('gcode')) {
            this.codeEditBox.string = localStorage.getItem('gcode');
        }
        if (localStorage.getItem('guid') && localStorage.getItem('gcode')) {
            this._isAutoLogin = true;
            this.onLoginBtnClick();
        }
    }

    private onLoginBtnClick() {
        let guid = this.idEditBox.string;
        let code = this.codeEditBox.string;
        if (!guid || !code) {
            //UIMgr.Instance.showToast('请输入id和确认码');
            error('请输入id和确认码');
            return;
        }
        Api.login({
            uid: guid,
            code: code,
        }).then((res) => {
            //console.log('res ===>', res);
            localStorage.setItem('guid', guid);
            localStorage.setItem('gcode', code);
            this.loginSuccess(res.data.token);
            console.log('登录成功~~');
            console.log('res ===>', res);
        }).catch(() => {
            this._isAutoLogin && (this.codeEditBox.string = '');
            localStorage.removeItem('gcode');
            console.log('登录失败~~');
        });
    }

    private onTicketBtnClick() {
        // window.showSgsPass((ticket) => {
        //     ApiService.login({
        //         from: 0,
        //         ticket: ticket
        //     }).then((res) => {
        //         this.loginSuccess(res.token);
        //         window.hideSgsPass();
        //     }).catch(() => {
        //         window.hideSgsPass();
        //         UIMgr.Instance.showToast('登录失败~');
        //     });
        // })
    }

    private loginSuccess(token) {
        localStorage.setItem('token', token);
        this.removeFromPageManager();
        userControl.login();
        userControl.initUserData();
        
        //EventMgr.Instance.emit(EventDefine.UPDATE_USER_DATA);
        //UIMgr.Instance.removeUI(this.node);
    }

}


