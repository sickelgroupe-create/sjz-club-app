# 前端 UI 冻结说明

冻结日期：2026-08-31

## 冻结基线

- 全部页面视觉基线：`tests/visual-round-2/*.png`
- “我的”页面基线：`tests/visual-round-2/05-profile.png`
- 线上冻结版本：`/opt/sjz-club/user-web/releases/20260831-155300-ui-frozen`
- 上一版本保留于：`/opt/sjz-club/user-web/releases/20260830-213714`

## 冻结范围

- 页面模板与样式
- 全局样式和页面路由视觉配置
- 公共 UI 组件
- 图标、图片和品牌素材
- 颜色、字体、间距、圆角、阴影、卡片、导航与响应式布局

接口、鉴权、支付、数据请求和业务状态可以继续修改，但不得改变上述视觉结果。

## 强制检查

```bash
npm run check:ui-freeze
```

检查失败表示视觉基线发生变化。除非用户在当前任务中明确要求修改 UI，否则不得更新指纹文件或绕过检查。

只有获得明确授权后，才可在视觉验收通过后更新基线：

```bash
node scripts/check-ui-freeze.mjs --write
```

## 本次恢复

H5 版 `navigator` 会生成 `.navigator-wrap` 包装层，曾导致“消费排行榜”内容从横向排列变成纵向堆叠。本次仅补充 H5 包装层兼容样式，没有重做设计。

