# github-contributions

Pinpe 的 GitHub 贡献数据快照，供 [pinpe.top](https://pinpe.top) 侧边栏热力图使用。

- 数据源：`https://github.com/users/Pinpe/contributions`（GitHub 公开贡献日历）
- 更新：GitHub Action 每 6 小时自动刷新（`.github/workflows/refresh.yml`），可 `workflow_dispatch` 手动触发
- 产出：`data.json` → 浏览器通过 `raw.githubusercontent.com`（带 CORS）实时拉取

## data.json 结构

```json
{
  "user": "Pinpe",
  "updated": "2026-08-27T12:00:00.000Z",
  "totalLastYear": 260,
  "contributions": [{ "date": "2026-08-27", "count": 1 }]
}
```

## 本地验证

```bash
node scripts/refresh.mjs              # 抓线上并写 data.json
node scripts/refresh.mjs some.html    # 用本地 HTML 文件测试解析
```
