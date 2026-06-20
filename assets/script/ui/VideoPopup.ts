import { _decorator, find, instantiate, Label, Node, ProgressBar, VideoPlayer } from 'cc';
import { UiBase } from '../../framework/ui/UiBase';
import { MaxGeneralNum } from '../const/GameConst';
const { ccclass, property } = _decorator;

@ccclass('VideoPopup')
export class RankPopup extends UiBase {

  @property(VideoPlayer)
  videoPlayer: VideoPlayer = null;

  protected start(): void {
    let canvas = find('Canvas');
    canvas.on(Node.EventType.TOUCH_START, this.playVideo, this);
  }

  protected onLoad(): void {
    super.onLoad();
    this.videoPlayer.node.on('completed', this.onVideoComplete, this);  // 视频播放完成
    this.videoPlayer.node.on('stopped', this.onVideoComplete, this); // 视频播放停止
    this.videoPlayer.node.on('playing', this.onVideoPlaying, this); // 视频播放中
    this.videoPlayer.node.on('stopped', this.onVideoStopped, this); // 视频播放停止
    this.videoPlayer.node.on('paused', this.onVideoPaused, this); // 视频播放暂停
    this.videoPlayer.node.on('error', this.onVideoError, this); // 视频播放错误
  }

  protected onEnable(): void {
    super.onEnable();
    this.videoPlayer.play();
  }

  protected onDisable(): void {
    super.onDisable();
    this.videoPlayer.stop();
  }

  private playVideo() {
    this.videoPlayer.play();
  }

  private onVideoComplete() {
    console.log('video complete');
  }
  private onVideoPlaying() {
    console.log('video playing');
  }

  private onVideoStopped() {
    console.log('video stopped');
  }

  private onVideoPaused() {
    console.log('video paused');
  }

  private onVideoError() {
    console.log('video error');
  }
}


