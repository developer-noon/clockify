import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth";
import * as models from "../models/queries";
import { AppError, handleError } from "../utils/errorHandler";

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new AppError(400, "Email, password, and name are required");
    }

    const existingUser = await models.getUserByEmail(email);
    if (existingUser.rows.length > 0) {
      throw new AppError(400, "Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await models.createUser(email, passwordHash, name);
    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" },
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, "Email and password are required");
    }

    const result = await models.getUserByEmail(email);
    const user = result.rows[0];

    if (!user) {
      throw new AppError(401, "Invalid credentials");
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new AppError(401, "Invalid credentials");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" },
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError(401, "Not authenticated");
    }

    const result = await models.getUserById(req.user.id);
    const user = result.rows[0];

    res.json(user);
  } catch (error) {
    handleError(error, res);
  }
};
