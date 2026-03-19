import Taro from '@tarojs/taro';

/**
 * 小程序调试工具
 * 仅在开发版开启调试模式
 * 体验版和正式版自动关闭vconsole
 */
export function devDebug() {
  const env = Taro.getEnv();
  if (env === Taro.ENV_TYPE.WEAPP || env === Taro.ENV_TYPE.TT) {
    try {
      const accountInfo = Taro.getAccountInfoSync();
      const envVersion = accountInfo.miniProgram.envVersion;
      console.log('[Debug] envVersion:', envVersion);

      // 仅在开发版开启调试，体验版和正式版都不开启（隐藏vconsole按钮）
      if (envVersion === 'develop') {
        Taro.setEnableDebug({ enableDebug: true });
      } else {
        // 体验版和正式版显式关闭调试模式
        Taro.setEnableDebug({ enableDebug: false });
      }
    } catch (error) {
      console.error('[Debug] 设置调试模式失败:', error);
    }
  }
}
