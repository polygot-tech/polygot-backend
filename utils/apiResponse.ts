import type { Response } from "express";
import type { ZodFormattedError } from "zod";

export type ApiResponseType = {
  (res: Response, code?: number, message?: string, data?: any | null): Response;
  error: (
    res: Response,
    code?: number,
    message?: string | ZodFormattedError<unknown>
  ) => Response;
};

const ApiResponse = (
  res: Response,
  code: number = 200,
  message: string = "",
  data: any | null = null
) => {
  const success = code >= 200 && code < 300;

  return res.status(code).json({
    code,
    success,
    message,
    data,
  });
};

(ApiResponse as ApiResponseType).error = (
  res: Response,
  code: number = 500,
  message: string | ZodFormattedError<unknown> = "Internal Server Error"
) => {
  return res.status(code).json({
    code,
    success: false,
    error: message,
  });
};

export default ApiResponse as ApiResponseType;
