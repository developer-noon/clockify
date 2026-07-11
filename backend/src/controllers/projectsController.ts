import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as models from "../models/queries";
import { AppError, handleError } from "../utils/errorHandler";

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const { name, client_id } = req.body;
    if (!name || !client_id)
      throw new AppError(400, "Project name and client_id are required");

    // Verify client belongs to user
    const clientResult = await models.getClientById(client_id);
    if (!clientResult.rows[0] || clientResult.rows[0].user_id !== req.user.id) {
      throw new AppError(404, "Client not found");
    }

    const result = await models.createProject(req.user.id, client_id, name);
    res.json(result.rows[0]);
  } catch (error) {
    handleError(error, res);
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const clientId = req.query.clientId as string | undefined;
    const result = await models.getProjects(req.user.id, clientId);
    res.json(result.rows);
  } catch (error) {
    handleError(error, res);
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const result = await models.getProjectById(req.params.id);
    const project = result.rows[0];

    if (!project || project.user_id !== req.user.id) {
      throw new AppError(404, "Project not found");
    }

    res.json(project);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const { name } = req.body;
    if (!name) throw new AppError(400, "Project name is required");

    const projectResult = await models.getProjectById(req.params.id);
    const project = projectResult.rows[0];

    if (!project || project.user_id !== req.user.id) {
      throw new AppError(404, "Project not found");
    }

    const result = await models.updateProject(req.params.id, name);
    res.json(result.rows[0]);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const projectResult = await models.getProjectById(req.params.id);
    const project = projectResult.rows[0];

    if (!project || project.user_id !== req.user.id) {
      throw new AppError(404, "Project not found");
    }

    await models.deleteProject(req.params.id);
    res.json({ message: "Project deleted" });
  } catch (error) {
    handleError(error, res);
  }
};

export const getProjectTasks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const projectResult = await models.getProjectById(req.params.projectId);
    const project = projectResult.rows[0];

    if (!project || project.user_id !== req.user.id) {
      throw new AppError(404, "Project not found");
    }

    const result = await models.getTasks(req.params.projectId);
    res.json(result.rows);
  } catch (error) {
    handleError(error, res);
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const { name } = req.body;
    const project_id = req.params.projectId || req.body.project_id;
    if (!name || !project_id)
      throw new AppError(400, "Task name and project_id are required");

    // Verify project belongs to user
    const projectResult = await models.getProjectById(project_id);
    if (
      !projectResult.rows[0] ||
      projectResult.rows[0].user_id !== req.user.id
    ) {
      throw new AppError(404, "Project not found");
    }

    const result = await models.createTask(project_id, name);
    res.json(result.rows[0]);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated");

    const taskResult = await models.getTaskById(req.params.id);
    const task = taskResult.rows[0];

    if (!task) throw new AppError(404, "Task not found");

    // Verify task's project belongs to user
    const projectResult = await models.getProjectById(task.project_id);
    if (
      !projectResult.rows[0] ||
      projectResult.rows[0].user_id !== req.user.id
    ) {
      throw new AppError(403, "Not authorized");
    }

    await models.deleteTask(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (error) {
    handleError(error, res);
  }
};
