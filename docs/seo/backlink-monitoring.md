# Backlink Monitoring + Disavow Workflow

Scope: detect toxic backlinks, protect indexation, and publish a monthly backlink report.

Tools
- Google Search Console (GSC) Links report
- 1 paid tool (Ahrefs, Semrush, or Majestic)

Monthly cadence (owner: Growth)
1) Export latest backlinks from GSC (Top linking sites + Top linking text).
2) Export latest backlinks from the paid tool (all links, new/lost).
3) Diff vs last month: new, lost, suspicious spikes.
4) Flag risky domains (adult, pharma, gambling, link farms, hacked sites).
5) Create a disavow update if needed.
6) Store report in `/docs/seo/reports/YYYY-MM.md`.

Disavow workflow
1) Validate risk (multiple spam signals or manual penalty risk).
2) Create/update `/docs/seo/disavow.txt`.
3) Submit disavow in GSC.
4) Record submission date in monthly report.

Monthly report template
Use `/docs/seo/monthly-backlink-report.md`.
