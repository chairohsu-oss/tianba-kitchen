import fs from 'node:fs';
import path from 'node:path';

import tailwindcss from '@tailwindcss/postcss';
import { UnifiedViteWeappTailwindcssPlugin } from 'weapp-tailwindcss/vite';
import { defineConfig, type UserConfigExport } from '@tarojs/cli';
import type { PluginItem } from '@tarojs/taro/types/compile/config/project';
import dotenv from 'dotenv';
import devConfig from './dev';
import prodConfig from './prod';
import pkg from '../package.json';

// 加载环境变量
const envPath = process.env.NODE_ENV === 'production' 
  ? path.resolve(__dirname, '../.env.production')
  : path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`✓ Loaded env from ${envPath}`);
}

const generateTTProjectConfig = () => {
  const config = {
    miniprogramRoot: './',
    projectname: 'coze-mini-program',
    appid: process.env.TARO_APP_TT_APPID || '',
    setting: {
      urlCheck: false,
      es6: false,
      postcss: false,
      minified: false,
    },
  };
  const outputDir = path.resolve(__dirname, '../dist-tt');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(
    path.resolve(outputDir, 'project.config.json'),
    JSON.stringify(config, null, 2),
  );
};

// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
export default defineConfig<'vite'>(async (merge, _env) => {
  const outputRootMap: Record<string, string> = {
    weapp: 'dist',
    tt: 'dist-tt',
    h5: 'dist-web',
  };
  const outputRoot = outputRootMap[process.env.TARO_ENV || ''] || 'dist-web';

  const buildMiniCIPluginConfig = () => {
    const hasWeappConfig = !!process.env.TARO_APP_WEAPP_APPID
    const hasTTConfig = !!process.env.TARO_APP_TT_EMAIL
    if (!hasWeappConfig && !hasTTConfig) {
        return []
    }
    const miniCIConfig: Record<string, any> = {
        version: pkg.version,
        desc: pkg.description,
    }
    if (hasWeappConfig) {
        miniCIConfig.weapp = {
            appid: process.env.TARO_APP_WEAPP_APPID,
            privateKeyPath: 'key/private.appid.key',
        }
    }
    if (hasTTConfig) {
        miniCIConfig.tt = {
            email: process.env.TARO_APP_TT_EMAIL,
            password: process.env.TARO_APP_TT_PASSWORD,
            setting: {
                skipDomainCheck: true,
            },
        }
    }
    return [['@tarojs/plugin-mini-ci', miniCIConfig]] as PluginItem[]
  }

  const baseConfig: UserConfigExport<'vite'> = {
    projectName: 'coze-mini-program',
    date: '2026-1-13',
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot,
            plugins: ['@tarojs/plugin-generator', ...buildMiniCIPluginConfig()],
    defineConstants: {
      PROJECT_DOMAIN: JSON.stringify(
        process.env.PROJECT_DOMAIN ||
          process.env.COZE_PROJECT_DOMAIN_DEFAULT ||
          '',
      ),
      TARO_ENV: JSON.stringify(process.env.TARO_ENV),
    },
    // copy配置仅在H5平台生效，小程序不需要这些PWA资源
    ...(process.env.TARO_ENV === 'h5' ? {
      copy: {
        patterns: [
          { from: 'public-h5/manifest.json', to: 'manifest.json' },
          { from: 'public-h5/icons', to: 'icons' },
          { from: 'public-h5/splash', to: 'splash' },
        ],
        options: {},
      },
    } : { copy: { patterns: [], options: {} } }),
    ...(process.env.TARO_ENV === 'tt' && {
      tt: {
        appid: process.env.TARO_APP_TT_APPID,
        projectName: 'coze-mini-program',
      },
    }),
    jsMinimizer: 'esbuild',
    framework: 'react',
    compiler: {
      type: 'vite',
      vitePlugins: [
        {
          name: 'postcss-config-loader-plugin',
          config(config) {
            // 通过 postcss 配置注册 tailwindcss 插件
            if (typeof config.css?.postcss === 'object') {
              config.css?.postcss.plugins?.unshift(tailwindcss());
            }
          },
        },
        {
          name: 'hmr-config-plugin',
          config() {
            if (!process.env.PROJECT_DOMAIN) {
              return;
            }
            return {
              server: {
                hmr: {
                  overlay: true,
                  path: '/hot/vite-hmr',
                  port: 6000,
                  clientPort: 443,
                  timeout: 30000,
                },
              },
            };
          },
        },
        UnifiedViteWeappTailwindcssPlugin({
          rem2rpx: true,
          cssEntries: [path.resolve(__dirname, '../src/app.css')],
        }),
        // PWA 文件复制插件（仅 H5）
        ...(process.env.TARO_ENV === 'h5'
          ? [
              {
                name: 'copy-pwa-files',
                writeBundle() {
                  const publicDir = path.resolve(__dirname, '../public-h5');
                  const outDir = path.resolve(__dirname, '../dist-web');
                  
                  // 复制 manifest.json
                  if (fs.existsSync(path.join(publicDir, 'manifest.json'))) {
                    fs.copyFileSync(
                      path.join(publicDir, 'manifest.json'),
                      path.join(outDir, 'manifest.json')
                    );
                    console.log('✓ Copied manifest.json');
                  }
                  
                  // 复制 icons 目录
                  const iconsDir = path.join(publicDir, 'icons');
                  const outIconsDir = path.join(outDir, 'icons');
                  if (fs.existsSync(iconsDir)) {
                    if (!fs.existsSync(outIconsDir)) {
                      fs.mkdirSync(outIconsDir, { recursive: true });
                    }
                    const files = fs.readdirSync(iconsDir);
                    files.forEach(file => {
                      fs.copyFileSync(
                        path.join(iconsDir, file),
                        path.join(outIconsDir, file)
                      );
                    });
                    console.log(`✓ Copied ${files.length} icon files`);
                  }
                  
                  // 复制 splash 目录
                  const splashDir = path.join(publicDir, 'splash');
                  const outSplashDir = path.join(outDir, 'splash');
                  if (fs.existsSync(splashDir)) {
                    if (!fs.existsSync(outSplashDir)) {
                      fs.mkdirSync(outSplashDir, { recursive: true });
                    }
                    const splashFiles = fs.readdirSync(splashDir);
                    splashFiles.forEach(file => {
                      fs.copyFileSync(
                        path.join(splashDir, file),
                        path.join(outSplashDir, file)
                      );
                    });
                    console.log(`✓ Copied ${splashFiles.length} splash files`);
                  }
                },
              },
            ]
          : []),
        ...(process.env.TARO_ENV === 'tt'
          ? [
              {
                name: 'generate-tt-project-config',
                closeBundle() {
                  generateTTProjectConfig();
                },
              },
            ]
          : []),
      ],
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      devServer: {
        port: 5000,
        host: '0.0.0.0',
        open: false,
        proxy: {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
          },
          '/admin.html': {
            target: 'http://localhost:3000',
            changeOrigin: true,
          },
        },
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[name].[chunkhash].css',
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
    },
    rn: {
      appName: 'coze-mini-program',
      postcss: {
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        },
      },
    },
  };

  process.env.BROWSERSLIST_ENV = process.env.NODE_ENV;

  if (process.env.NODE_ENV === 'development') {
    // 本地开发构建配置（不混淆压缩）
    return merge({}, baseConfig, devConfig);
  }
  // 生产构建配置（默认开启压缩混淆等）
  return merge({}, baseConfig, prodConfig);
});
