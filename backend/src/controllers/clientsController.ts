import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as models from "../models/queries";
import { AppError, handleError } from "../utils/errorHandler";

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const { name, email } = req.body;
    if (!name) throw new AppError(400, "Client name is required");

    const result = await models.createClient(req.user.id, name, email);
    res.json(result.rows[0]);
  } catch (error) {
    handleError(error, res);
  }
};

export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const result = await models.getClients(req.user.id);
    res.json(result.rows);
  } catch (error) {
    handleError(error, res);
  }
};

export const getClient = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const result = await models.getClientById(req.params.id);
    const client = result.rows[0];

    if (!client || client.user_id !== req.user.id) {
      throw new AppError(404, "Client not found");
    }

    res.json(client);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const { name, email } = req.body;
    if (!name) throw new AppError(400, "Client name is required");

    const clientResult = await models.getClientById(req.params.id);
    const client = clientResult.rows[0];

    if (!client || client.user_id !== req.user.id) {
      throw new AppError(404, "Client not found");
    }

    const result = await models.updateClient(req.params.id, name, email);
    res.json(result.rows[0]);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const clientResult = await models.getClientById(req.params.id);
    const client = clientResult.rows[0];

    if (!client || client.user_id !== req.user.id) {
      throw new AppError(404, "Client not found");
    }

    await models.deleteClient(req.params.id);
    res.json({ message: "Client deleted" });
  } catch (error) {
    handleError(error, res);
  }
};
