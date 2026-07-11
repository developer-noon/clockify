import { Response } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export const handleError = (error: any, res: Response) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
};
