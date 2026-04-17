import { buildAnnualReport, buildMonthlyReport, serializeReportToCsv } from '../services/report.service';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';

export const getMonthlyReport = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const { year, month } = req.query as Record<string, string>;
  const report = await buildMonthlyReport(req.user.id, Number(year), Number(month));
  res.json(report);
});

export const getAnnualReport = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const { year } = req.query as Record<string, string>;
  const report = await buildAnnualReport(req.user.id, Number(year));
  res.json(report);
});

export const downloadReport = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const { scope, year, month, format = 'csv' } = req.query as Record<string, string>;
  const report =
    scope === 'monthly'
      ? await buildMonthlyReport(req.user.id, Number(year), Number(month))
      : await buildAnnualReport(req.user.id, Number(year));

  if (format === 'json') {
    res.json(report);
    return;
  }

  const csv = serializeReportToCsv(report);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="ledger-${scope}-${year}.csv"`);
  res.send(csv);
});