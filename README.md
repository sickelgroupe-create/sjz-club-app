# sjz-club-app · 俱乐部小程序

uni-app / Vue 用户端，包含微信小程序及 H5 源码。

## 配套仓库

- 后端：https://github.com/sickelgroupe-create/sjz-club-backend
- 管理后台：https://github.com/sickelgroupe-create/sjz-club-admin
- 原三端源码快照：https://github.com/sickelgroupe-create/sjz-club

## 开发与构建

复制 `.env.example` 为 `.env.local`，设置自己的后端地址。默认地址为本机，不连接线上服务器。运行 `npm ci`，再执行 `npm run dev:mp-weixin` 或 `npm run build:mp-weixin`。H5 构建使用 `npm run build:h5`。构建脚本需要 Windows PowerShell。

构建默认仅同步本仓库路由，不写入其他目录。变更页面路由后，需要将 `generated/page-routes.json` 同步到后端 `ruoyi-admin/src/main/resources/club-page-routes.json`。也可显式设置环境变量 `CLUB_BACKEND_ROOT` 为后端仓库绝对路径，再执行 `npm run sync:routes` 自动同步。

修改前阅读 AGENTS.md 和 UI_FREEZE.md，执行 `npm run check:ui-freeze`。原视觉测试截图未包含在此导出中。旧 sandbox 命令依赖未导出的历史配置，不作为有效启动入口。

## 范围

从已清理的三端源码快照拆分，不含线上凭据、用户资料、旧 Git 历史和构建产物。虚拟支付相关代码仍需部署与业务核验；本仓库建立不代表支付接入或微信审核完成。业务代码未新增开源授权，仓库保持私有。
