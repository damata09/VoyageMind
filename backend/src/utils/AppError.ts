export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code: string = "GENERIC_ERROR"
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
