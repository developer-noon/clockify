import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as models from "../models/queries";
import { AppError, handleError } from "../utils/errorHandler";

export const createTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const {
      client_id,
      project_id,
      task_id,
      description,
      date,
      hours,
      price_per_hour,
      is_billable = true,
    } = req.body;

    if (!client_id || !project_id || !date || !hours || !price_per_hour) {
      throw new AppError(
        400,
        "Required fields: client_id, project_id, date, hours, price_per_hour",
      );
    }

    // Verify client belongs to user
    const clientResult = await models.getClientById(client_id);
    if (!clientResult.rows[0] || clientResult.rows[0].user_id !== req.user.id) {
      throw new AppError(404, "Client not found");
    }

    // Verify project belongs to user
    const projectResult = await models.getProjectById(project_id);
    if (
      !projectResult.rows[0] ||
      projectResult.rows[0].user_id !== req.user.id
    ) {
      throw new AppError(404, "Project not found");
    }

    const result = await models.createTimeEntry(
      req.user.id,
      client_id,
      project_id,
      task_id || null,
      description || null,
      date,
      hours,
      price_per_hour,
      is_billable,
    );

    res.json(result.rows[0]);
  } catch (error) {
    handleError(error, res);
  }
};

export const getTimeEntries = async (req: AuthRequest, res: Response) => {
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
    res.json(result.rows);
  } catch (error) {
    handleError(error, res);
  }
};

export const getTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const result = await models.getTimeEntryById(req.params.id);
    const entry = result.rows[0];

    if (!entry || entry.user_id !== req.user.id) {
      throw new AppError(404, "Time entry not found");
    }

    res.json(entry);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const {
      client_id,
      project_id,
      task_id,
      description,
      date,
      hours,
      price_per_hour,
      is_billable = true,
    } = req.body;

    if (!client_id || !project_id || !date || !hours || !price_per_hour) {
      throw new AppError(
        400,
        "Required fields: client_id, project_id, date, hours, price_per_hour",
      );
    }

    const entryResult = await models.getTimeEntryById(req.params.id);
    const entry = entryResult.rows[0];

    if (!entry || entry.user_id !== req.user.id) {
      throw new AppError(404, "Time entry not found");
    }

    const result = await models.updateTimeEntry(
      req.params.id,
      client_id,
      project_id,
      task_id || null,
      description || null,
      date,
      hours,
      price_per_hour,
      is_billable,
    );

    res.json(result.rows[0]);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const entryResult = await models.getTimeEntryById(req.params.id);
    const entry = entryResult.rows[0];

    if (!entry || entry.user_id !== req.user.id) {
      throw new AppError(404, "Time entry not found");
    }

    await models.deleteTimeEntry(req.params.id);
    res.json({ message: "Time entry deleted" });
  } catch (error) {
    handleError(error, res);
  }
};
