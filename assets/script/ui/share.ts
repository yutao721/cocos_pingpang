
import { _decorator, Component, game, sys, ImageAsset } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { IPingPangResult } from '../const/Interface';
import { BundleManager } from '../../framework/bundle/BundleManager';
import { IUserInfo } from '../model/UserInfoModel';

const POSTER_W = 750;
const POSTER_H = 1624;


/**
 * 加载图片资源
 * @param src 图片地址
 */
const { ccclass, property } = _decorator;

@ccclass('SharePopup')
export class SharePopup extends UiBase {

  share_bg: string = 'https://sgssj-hdimg.oss-cn-hangzhou.aliyuncs.com/icons/h5game_jump/share_bg.jpg';

  _canvas: HTMLCanvasElement = null!;
  shareUrl: string = 'https://www.baidu.com';
  nickname: string = 'yutao';
  score: number = 88108;
  img: HTMLImageElement;


  start() {

  }

  update(deltaTime: number) {

  }

  show({ score, url, nickname }) {
    console.log(score, url, nickname);
    this.score = score || 0;
    this.shareUrl = url || '';
    this.nickname = nickname || '佚名';
    // this.generateImage();
  }

  onLoad() {
    // this.nickname = UserManager.instance.user.nickname;
    // console.log(this.nickname);
    // this.generate({}, { nickname: this.nickname, headimgurl: '' });
  }


  /**
   * @Author: yutao
   * @Date: 2024-08-06 15:09:19
   * @Descripttion: 生成分享图片
   * @param {*}
   * @return {*}
   */
  generateImage() {
    if (!this._canvas) {
      this._canvas = document.createElement('canvas');
      this._canvas.width = 750;
      this._canvas.height = 1624;
    } else {
      let ctx = this._canvas.getContext('2d');
      ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
    let ctx = this._canvas.getContext('2d')!;

  }



  downloadImage1() {
    if (!this._canvas) {
      this._canvas = document.createElement('canvas');
      this._canvas.width = 750;
      this._canvas.height = 1624;
    } else {
      this._canvas.toBlob((blob) => {
        if (blob) {
          let url = URL.createObjectURL(blob);
          let a = document.createElement('a');
          a.href = url;
          a.download = 'share.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    }
  }

  /**
     * 生成海报
     * @param result 游戏结算数据
     * @param userInfo 用户信息（昵称 + 头像 URL）
     */
  async generate(result: IPingPangResult, userInfo: IUserInfo | null): Promise<void> {
    const canvas = document.createElement('canvas');
    canvas.width = POSTER_W;
    canvas.height = POSTER_H;
    const ctx = canvas.getContext('2d');

    // 1. 背景图（从 bundle resources 加载，无 CORS 问题）
    try {
      const imgAsset = await BundleManager.loadAsync<ImageAsset>('image/game/shareBg', ImageAsset);
      ctx.drawImage(imgAsset.data as HTMLImageElement, 0, 0, POSTER_W, POSTER_H);
    } catch (e) {
      // 背景加载失败时用渐变兜底
      const grad = ctx.createLinearGradient(0, 0, 0, POSTER_H);
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(1, '#16213e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, POSTER_W, POSTER_H);
      console.warn('[PosterHelper] load bg failed', e);
    }

    // 2. 半透明卡片区域
    // ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    // this._roundRect(ctx, 60, 300, 630, 680, 28);
    // ctx.fill();

    // 3. 圆形头像
    const avatarUrl = userInfo?.headimgurl ?? '';
    await this._drawRoundAvatar(ctx, avatarUrl, POSTER_W / 2, 510, 82);

    // 4. 昵称
    const nickname = userInfo?.nickname ?? '匿名玩家';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._ellipsis(nickname, 12), POSTER_W / 2, 530);

    // // 5. 分数（主体）
    // ctx.fillStyle = '#FFD700';
    // ctx.font = 'bold 120px sans-serif';
    // ctx.textAlign = 'center';
    // ctx.textBaseline = 'middle';
    // ctx.fillText(String(result.score), POSTER_W / 2, 670);

    // ctx.fillStyle = 'rgba(255,255,255,0.7)';
    // ctx.font = '30px sans-serif';
    // ctx.fillText('我的得分', POSTER_W / 2, 755);

    // // 6. 连颠 / 命中次数
    // ctx.fillStyle = 'rgba(255,255,255,0.85)';
    // ctx.font = '28px sans-serif';
    // ctx.textAlign = 'left';
    // ctx.fillText(`最高连颠：${result.maxCombo} 次`, 140, 830);
    // ctx.fillText(`总颠球数：${result.hitCount} 次`, 140, 878);

    // // 7. 底部邀请文案
    // ctx.fillStyle = 'rgba(255,255,255,0.6)';
    // ctx.font = '26px sans-serif';
    // ctx.textAlign = 'center';
    // ctx.fillText('快来挑战我吧！', POSTER_W / 2, 1180);

    // 8. 导出
    const dataUrl = canvas.toDataURL('image/png');
    this._triggerDownload(dataUrl);
  }

  // ----------------------------------------------------------------
  // 私有工具
  // ----------------------------------------------------------------

  /** 加载任意 URL 的 HTMLImageElement，失败时返回 null */
  private _loadImg(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  /** 绘制圆形头像，失败时绘制灰色占位 */
  private async _drawRoundAvatar(
    ctx: CanvasRenderingContext2D,
    url: string,
    centerX: number,
    centerY: number,
    radius: number,
  ) {
    const img = url ? await this._loadImg(url) : null;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    if (img) {
      ctx.drawImage(img, centerX - radius, centerY - radius, radius * 2, radius * 2);
    } else {
      ctx.fillStyle = '#888888';
      ctx.fill();
    }
    ctx.restore();

    // 白色描边
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** 圆角矩形路径 */
  private _roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /** 文本超长截断 */
  private _ellipsis(str: string, maxLen: number): string {
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
  }

  /**
   * PC：<a download> 直接下载
   * 移动端：弹出浮层展示图片，引导用户长按保存
   */
  private _triggerDownload(dataUrl: string) {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    if (!isMobile) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'poster.png';
      a.click();
      return;
    }

    // 移动端浮层
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.88)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '99999',
    });

    const tip = document.createElement('p');
    tip.textContent = '长按图片保存到相册';
    Object.assign(tip.style, {
      color: '#fff',
      fontSize: '18px',
      margin: '0 0 20px',
      letterSpacing: '2px',
      fontFamily: 'KarlST',
    });

    const img = document.createElement('img');
    img.src = dataUrl;
    Object.assign(img.style, {
      maxWidth: '75vw',
      display: 'block',
    });

    const closeBtn = document.createElement('p');
    closeBtn.textContent = '关闭';
    Object.assign(closeBtn.style, {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '14px',
      marginTop: '24px',
      cursor: 'pointer',
    });
    closeBtn.onclick = () => document.body.removeChild(overlay);

    overlay.append(tip, img, closeBtn);
    document.body.appendChild(overlay);
  }


  onBtnCloseClick() {
    game.container.removeChild(this.img);
  }


  showImage() {
    if (this._canvas) {
      let img = new Image();
      this.img = img;
      img.style.position = "absolute";
      img.style.top = "50%";
      img.style.left = "50%";
      img.style.width = "220px";
      img.style.height = "auto";
      img.style.zIndex = "100";
      img.style.transform = "translate(-50%, -50%)";
      img.src = this._canvas.toDataURL('image/png', 0.1);
      img.onload = () => {
        game.container.appendChild(this.img);
      }
    }
  }
}


