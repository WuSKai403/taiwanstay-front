/**
 * API 錯誤類
 * 用於在 API 處理過程中拋出帶有狀態碼的錯誤
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;

    // 確保 instanceof 正常工作
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * 創建一個 400 Bad Request 錯誤
   */
  static badRequest(message: string = '請求無效'): ApiError {
    return new ApiError(message, 400);
  }

  /**
   * 創建一個 401 Unauthorized 錯誤
   */
  static unauthorized(message: string = '未授權'): ApiError {
    return new ApiError(message, 401);
  }

  /**
   * 創建一個 403 Forbidden 錯誤
   */
  static forbidden(message: string = '權限不足'): ApiError {
    return new ApiError(message, 403);
  }

  /**
   * 創建一個 404 Not Found 錯誤
   */
  static notFound(message: string = '資源不存在'): ApiError {
    return new ApiError(message, 404);
  }

  /**
   * 創建一個 409 Conflict 錯誤
   */
  static conflict(message: string = '資源衝突'): ApiError {
    return new ApiError(message, 409);
  }

  /**
   * 創建一個 422 Unprocessable Entity 錯誤
   */
  static validationError(message: string = '驗證失敗'): ApiError {
    return new ApiError(message, 422);
  }

  /**
   * 創建一個 500 Internal Server Error 錯誤
   */
  static internal(message: string = '伺服器錯誤'): ApiError {
    return new ApiError(message, 500);
  }
}