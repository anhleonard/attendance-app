import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // Nếu không có data (property name), trả về toàn bộ user object
    if (!data) {
      return user;
    }

    // Nếu có data, trả về giá trị của property đó
    const value = user[data];

    // Nếu property là 'id', chuyển đổi sang number
    if (data === 'id' && value !== undefined) {
      return Number(value);
    }

    return value;
  },
);
