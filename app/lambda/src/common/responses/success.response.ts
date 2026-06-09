import { RESULT_CODE } from '@common/constants/response.const';

export class SuccessResponse<T> {
  constructor(
    public data: T,
    public code: string = RESULT_CODE.SUCCESS,
    public message: string = 'Success',
  ) {}

  render() {
    return {
      result: {
        code: this.code,
        message: this.message,
      },
      data: this.data,
    };
  }
}
