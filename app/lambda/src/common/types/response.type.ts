export type Response<T = any> = {
  result: {
    code: string;
    message: string;
  };
  data?: T;
  error?: {
    error_message: string;
    error_detail: any;
  };
};
