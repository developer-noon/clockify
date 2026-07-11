import { Response } from "express";
import { randomBytes } from "crypto";
import PDFDocument from "pdfkit";
import { AuthRequest } from "../middleware/auth";
import * as models from "../models/queries";
import { AppError, handleError } from "../utils/errorHandler";
import { buildSummary } from "../utils/reportHelpers";

type TimeEntryRow = {
  id: string;
  user_id: string;
  client_id: string;
  project_id: string;
  task_id: string | null;
  description: string | null;
  date: string;
  hours: number;
  price_per_hour: number;
  is_billable: boolean;
  created_at: string;
};

export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const clientId = req.query.clientId as string | undefined;
    const projectId = req.query.projectId as string | undefined;

    const entriesResult = await models.getTimeEntries(
      req.user.id,
      startDate,
      endDate,
      clientId,
      projectId,
      true,
    );
    const entries = entriesResult.rows as TimeEntryRow[];

    const clientNames: Record<string, string> = {};
    const projectNames: Record<string, string> = {};

    for (const entry of entries) {
      if (!clientNames[entry.client_id]) {
        const clientResult = await models.getClientById(entry.client_id);
        clientNames[entry.client_id] = clientResult.rows[0]?.name || "Unknown";
      }

      if (!projectNames[entry.project_id]) {
        const projectResult = await models.getProjectById(entry.project_id);
        projectNames[entry.project_id] =
          projectResult.rows[0]?.name || "Unknown";
      }
    }

    const summary = buildSummary(entries, clientNames, projectNames);

    res.json({
      total_hours: summary.total_hours,
      total_amount: summary.total_amount,
      by_client: summary.by_client,
      by_project: summary.by_project,
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const getDetailed = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const clientId = req.query.clientId as string | undefined;
    const projectId = req.query.projectId as string | undefined;

    const result = await models.getTimeEntries(
      req.user.id,
      startDate,
      endDate,
      clientId,
      projectId,
    );

    const entries = await Promise.all(
      (result.rows as TimeEntryRow[]).map(async (entry) => {
        const clientResult = await models.getClientById(entry.client_id);
        const projectResult = await models.getProjectById(entry.project_id);
        const taskResult = entry.task_id
          ? await models.getTaskById(entry.task_id)
          : null;

        return {
          ...entry,
          client_name: clientResult.rows[0]?.name || "Unknown",
          project_name: projectResult.rows[0]?.name || "Unknown",
          task_name: taskResult?.rows[0]?.name || null,
        };
      }),
    );

    res.json(entries);
  } catch (error) {
    handleError(error, res);
  }
};

export const generatePDF = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const clientId = req.query.clientId as string | undefined;
    const projectId = req.query.projectId as string | undefined;

    const entriesResult = await models.getTimeEntries(
      req.user.id,
      startDate,
      endDate,
      clientId,
      projectId,
      true,
    );

    const entries = await Promise.all(
      (entriesResult.rows as TimeEntryRow[]).map(async (entry) => {
        const clientResult = await models.getClientById(entry.client_id);
        const projectResult = await models.getProjectById(entry.project_id);
        const taskResult = entry.task_id
          ? await models.getTaskById(entry.task_id)
          : null;

        return {
          ...entry,
          client_name: clientResult.rows[0]?.name || "Unknown",
          project_name: projectResult.rows[0]?.name || "Unknown",
          task_name: taskResult?.rows[0]?.name || null,
          total: entry.hours * entry.price_per_hour,
        };
      }),
    );

    // Calculate totals
    let totalHours = 0;
    let totalAmount = 0;
    for (const entry of entries) {
      totalHours += entry.hours;
      totalAmount += entry.total;
    }

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    const fileName = ["report", startDate || "all", endDate || "all"].join("-");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}.pdf"`,
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("TIME TRACKING REPORT", { align: "center" });
    doc.moveDown(0.5);

    // Client info
    if (clientId && entries.length > 0) {
      doc
        .fontSize(12)
        .font("Helvetica")
        .text(`Client: ${entries[0].client_name}`);
    }

    // Date range
    const dateRange = `${startDate || "All"} to ${endDate || "All"}`;
    doc.fontSize(12).text(`Date Range: ${dateRange}`);
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown(0.5);

    // Summary section
    doc.fontSize(14).font("Helvetica-Bold").text("SUMMARY");
    doc.fontSize(11).font("Helvetica");
    doc.text(`Total Hours: ${totalHours.toFixed(2)}`);
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`);
    doc.moveDown(0.5);

    // Details section
    doc.fontSize(14).font("Helvetica-Bold").text("DETAILS");
    doc.moveDown(0.3);

    // Table header
    const tableTop = doc.y;
    const colWidth = 80;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Date", 50, tableTop);
    doc.text("Project", 130, tableTop);
    doc.text("Task", 210, tableTop);
    doc.text("Hours", 290, tableTop);
    doc.text("Rate", 350, tableTop);
    doc.text("Total", 420, tableTop);

    // Table rows
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(520, tableTop + 15)
      .stroke();
    doc.font("Helvetica").fontSize(9);

    let yPosition = tableTop + 25;
    for (const entry of entries) {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.text(entry.date.toString(), 50, yPosition);
      doc.text(entry.project_name, 130, yPosition);
      doc.text(entry.task_name || "-", 210, yPosition);
      doc.text(entry.hours.toString(), 290, yPosition);
      doc.text(`$${entry.price_per_hour.toFixed(2)}`, 350, yPosition);
      doc.text(`$${entry.total.toFixed(2)}`, 420, yPosition);

      yPosition += 20;
    }

    // Footer
    doc.moveTo(50, yPosition).lineTo(520, yPosition).stroke();
    doc.font("Helvetica-Bold").fontSize(11);
    doc.text(`TOTAL: $${totalAmount.toFixed(2)}`, 420, yPosition + 10);

    doc.end();
  } catch (error) {
    handleError(error, res);
  }
};

export const createShareLink = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const { client_id, start_date, end_date } = req.body;

    if (!client_id) throw new AppError(400, "client_id is required");

    const clientResult = await models.getClientById(client_id);
    if (!clientResult.rows[0] || clientResult.rows[0].user_id !== req.user.id) {
      throw new AppError(404, "Client not found");
    }

    const shareToken = randomBytes(32).toString("hex");
    const result = await models.createSharedReport(
      req.user.id,
      client_id,
      start_date || null,
      end_date || null,
      shareToken,
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.json({
      share_token: shareToken,
      share_url: `${frontendUrl}/report/${shareToken}`,
      created_at: result.rows[0].created_at,
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const revokeShareLink = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const sharedResult = await models.getSharedReportByToken(req.params.token);
    const shared = sharedResult.rows[0];

    if (!shared || shared.user_id !== req.user.id) {
      throw new AppError(404, "Share link not found");
    }

    await models.deleteSharedReport(req.params.token);
    res.json({ message: "Share link revoked" });
  } catch (error) {
    handleError(error, res);
  }
};

export const getSharedReport = async (req: AuthRequest, res: Response) => {
  try {
    const sharedResult = await models.getSharedReportByToken(req.params.token);
    const shared = sharedResult.rows[0];

    if (!shared) throw new AppError(404, "Report not found");

    // Get entries for this client
    const entriesResult = await models.getTimeEntries(
      shared.user_id,
      shared.start_date || undefined,
      shared.end_date || undefined,
      shared.client_id,
    );
    const entries = await Promise.all(
      (entriesResult.rows as TimeEntryRow[]).map(async (entry) => {
        const projectResult = await models.getProjectById(entry.project_id);
        const taskResult = entry.task_id
          ? await models.getTaskById(entry.task_id)
          : null;

        return {
          ...entry,
          project_name: projectResult.rows[0]?.name || "Unknown",
          task_name: taskResult?.rows[0]?.name || null,
          total: entry.hours * entry.price_per_hour,
        };
      }),
    );

    const clientResult = await models.getClientById(shared.client_id);
    const client = clientResult.rows[0];

    const summary = buildSummary(
      entries,
      { [shared.client_id]: client.name },
      Object.fromEntries(
        entries.map((entry) => [entry.project_id, entry.project_name]),
      ),
    );

    res.json({
      client_name: client.name,
      start_date: shared.start_date,
      end_date: shared.end_date,
      total_hours: summary.total_hours,
      total_amount: summary.total_amount,
      by_project: summary.by_project,
      entries: entries.map(
        (
          e: TimeEntryRow & {
            project_name: string;
            task_name: string | null;
            total: number;
          },
        ) => ({
          date: e.date,
          project: e.project_name,
          task: e.task_name,
          description: e.description,
          hours: e.hours,
          rate: e.price_per_hour,
          total: e.total,
        }),
      ),
    });
  } catch (error) {
    handleError(error, res);
  }
};
