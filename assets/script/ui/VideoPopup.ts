import { _decorator, find, Node, VideoPlayer } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';

const { ccclass, property } = _decorator;

@ccclass('VideoPopup')
export class VideoPopup extends UiBase {
  @property(VideoPlayer)
  videoPlayer: VideoPlayer = null;

  @property(Node)
  closeBtn: Node = null;

  private _canvas: Node | null = null;
  private _closeCallback: (() => void) | null = null;

  protected start(): void {
    this._canvas = find('Canvas');
    this._canvas?.on(Node.EventType.TOUCH_START, this._playVideo, this);
  }

  protected onLoad(): void {
    super.onLoad();

    this.closeBtn?.on(Node.EventType.TOUCH_START, this._onClose, this);
    this.videoPlayer?.node.on('completed', this._onVideoComplete, this);
    this.videoPlayer?.node.on('stopped', this._onVideoStopped, this);
    this.videoPlayer?.node.on('playing', this._onVideoPlaying, this);
    this.videoPlayer?.node.on('paused', this._onVideoPaused, this);
    this.videoPlayer?.node.on('error', this._onVideoError, this);
  }

  protected onEnable(): void {
    super.onEnable();
    this.videoPlayer?.play();
  }

  protected onDisable(): void {
    super.onDisable();
    this.videoPlayer?.stop();
  }

  protected onDestroy(): void {
    if (this.closeBtn?.isValid) {
      this.closeBtn.off(Node.EventType.TOUCH_START, this._onClose, this);
    }
    if (this._canvas?.isValid) {
      this._canvas.off(Node.EventType.TOUCH_START, this._playVideo, this);
    }
    if (this.videoPlayer?.node?.isValid) {
      this.videoPlayer.node.off('completed', this._onVideoComplete, this);
      this.videoPlayer.node.off('stopped', this._onVideoStopped, this);
      this.videoPlayer.node.off('playing', this._onVideoPlaying, this);
      this.videoPlayer.node.off('paused', this._onVideoPaused, this);
      this.videoPlayer.node.off('error', this._onVideoError, this);
    }

    const closeCallback = this._closeCallback;
    this._closeCallback = null;
    closeCallback?.();

    super.onDestroy();
  }

  public setCloseCallback(callback: (() => void) | null): void {
    this._closeCallback = callback;
  }

  private _playVideo(): void {
    this.videoPlayer?.play();
  }

  private _onVideoComplete(): void {
    console.log('video complete');
  }

  private _onVideoPlaying(): void {
    console.log('video playing');
  }

  private _onVideoStopped(): void {
    console.log('video stopped');
  }

  private _onVideoPaused(): void {
    console.log('video paused');
  }

  private _onVideoError(): void {
    console.log('video error');
  }

  private _onClose(): void {
    this.pageManager.removeUI(this.node);
  }
}
