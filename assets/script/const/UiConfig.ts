
const basePrefabPath = 'prefab/';
export const UI_PATH = {
  LOADING: basePrefabPath + 'page/LoadingPage', // 加载
  HOME: basePrefabPath + 'page/HomePage', // 主页
  GAME: basePrefabPath + 'page/PingPangPage', // 游戏
  RANK: basePrefabPath + 'page/RankPage', // 大营
  REWARD: basePrefabPath + 'page/RewardPage', // 奖励
  PINGPANG: basePrefabPath + 'page/PingPangPage', // 颠球游戏
  PINGPANG_COUNTDOWN: basePrefabPath + 'page/PingPangCountDownPage', // 颠球倒计时页

  RESULT: basePrefabPath + 'popup/ResultPopup', // 游戏结算
  RULE: basePrefabPath + 'popup/RulePopup', // 规则
  VIDEO: basePrefabPath + 'popup/VideoPopup', // 视频
  SHARE: basePrefabPath + 'popup/SharePopup', // 分享

  TIP: basePrefabPath + 'common/Tip' // 提示
} as const;
