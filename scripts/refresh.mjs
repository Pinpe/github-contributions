// 抓取 GitHub 用户的贡献数据，解析成 data.json
// 数据源：https://github.com/users/<USER>/contributions （公开 HTML，无需 token）
// 输出：data.json = { user, updated, totalLastYear, contributions: [{date, count}] }
// 健壮性：解析不到任何格子（页面结构变化 / 被限流）→ 不写文件，直接退出

const USER = 'Pinpe';
const OUT_FILE = 'data.json';

async function main() {
  // 允许本地测试：`node scripts/refresh.mjs <本地HTML文件>` 直接读文件，否则抓取线上
  const input = process.argv[2];
  let html;
  if (input) {
    const fs = await import('node:fs');
    html = fs.readFileSync(input, 'utf8');
  } else {
    const res = await fetch(`https://github.com/users/${USER}/contributions`, {
      headers: {
        'User-Agent': 'pinpe-github-contributions-refresh/1.0',
        Accept: 'text/html',
      },
    });
    if (!res.ok) {
      throw new Error(`GitHub responded HTTP ${res.status}`);
    }
    html = await res.text();
  }

  // 每个格子：<td ... class="...ContributionCalendar-day" ... id="contribution-day-component-X-Y" ... data-date="YYYY-MM-DD" ...>
  const days = new Map(); // id -> date
  for (const m of html.matchAll(/<td[^>]*?class="[^"]*ContributionCalendar-day[^"]*"[^>]*>/g)) {
    const tag = m[0];
    const id = tag.match(/id="([^"]+)"/)?.[1];
    const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    if (id && date) days.set(id, date);
  }

  // 每日贡献数：<tool-tip ... for="contribution-day-component-X-Y" ...>No/1/2... contributions on ...
  const counts = new Map(); // id -> count
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>\s*([A-Za-z0-9,]+)\s+contributions?/g)) {
    const id = m[1];
    const raw = m[2].replace(/,/g, '');
    counts.set(id, /^no$/i.test(raw) ? 0 : parseInt(raw, 10) || 0);
  }

  if (days.size === 0) {
    console.error('No contribution cells parsed — aborting without writing data.json.');
    process.exit(1);
  }

  const contributions = [...days].map(([id, date]) => ({
    date,
    count: counts.get(id) ?? 0,
  }));
  contributions.sort((a, b) => a.date.localeCompare(b.date));

  const totalMatch = html.match(/([\d,]+)\s+contributions?\s+in the last year/);
  const totalLastYear = totalMatch ? parseInt(totalMatch[1].replace(/,/g, ''), 10) : null;

  const data = {
    user: USER,
    updated: new Date().toISOString(),
    totalLastYear,
    contributions,
  };

  const fs = await import('node:fs');
  fs.writeFileSync(OUT_FILE, JSON.stringify(data));
  console.log(
    `Wrote ${OUT_FILE}: ${contributions.length} days` +
      (totalLastYear != null ? `, last year total = ${totalLastYear}` : ''),
  );
}

main().catch((err) => {
  console.error('refresh.mjs failed:', err);
  process.exit(1);
});
