
const basePrefabPath = 'prefab/';
export const UI_PATH = {
  LOADING: basePrefabPath + 'page/LoadingPage', // 加载
  HOME: basePrefabPath + 'page/HomePage', // 主页
  GAME: basePrefabPath + 'page/PingPangPage', // 游戏
  CAMP: basePrefabPath + 'page/CampPage', // 大营
  REWARD: basePrefabPath + 'page/RewardPage', // 奖励
  PINGPANG: basePrefabPath + 'page/PingPangPage', // 颠球游戏

  LOGIN: basePrefabPath + 'popup/LoginPopup', // 登录
  RESULT: basePrefabPath + 'popup/ResultPopup', // 游戏结算
  RULE: basePrefabPath + 'popup/RulePopup', // 规则
  RANK: basePrefabPath + 'popup/RankPopup', // 排行榜
  PROPGET: basePrefabPath + 'popup/PropGetPopup', // 道具分享获取
  PINGPANG_RESULT: basePrefabPath + 'popup/ResultPopup', // 颠球结算

  TIP: basePrefabPath + 'common/Tip' // 提示
} as const;
