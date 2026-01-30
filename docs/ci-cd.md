# CI/CD Integration

## GitHub Actions

```yaml
name: Web Audit

on:
  push:
    branches: [main]
  schedule:
    - cron: "0 8 * * *"  # Daily at 8am

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Install Playwright
        run: npx playwright install chromium --with-deps

      - name: Run webguard
        run: npx webguardx run
        env:
          EMAIL: ${{ secrets.EMAIL }}
          PASSWORD: ${{ secrets.PASSWORD }}

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: webguard-results
          path: webguard-results/

      - name: Upload JUnit results
        if: always()
        uses: dorny/test-reporter@v1
        with:
          name: Webguard Audits
          path: webguard-results/**/results.xml
          reporter: java-junit
```

## JUnit Output

Add `"junit"` to your output formats:

```ts
output: {
  formats: ["terminal", "html", "json", "junit"],
},
```

This generates `results.xml` compatible with CI tools like Jenkins, GitLab CI, and GitHub Actions test reporters.

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All audits passed |
| `1` | One or more audits failed |

## Baseline in CI

Save a baseline from a known-good run, then compare on every deploy:

```yaml
- name: Run with diff
  run: npx webguardx run --diff
```

The baseline file (`baseline.json`) can be committed to your repo or cached between CI runs.

## Notifications

Send results to Slack or a webhook:

```ts
import { defineConfig, createSlackNotifier } from "webguardx";

export default defineConfig({
  // ...
  notifications: [
    createSlackNotifier(process.env.SLACK_WEBHOOK!, {
      onlyOnFailure: true,
    }),
  ],
});
```
