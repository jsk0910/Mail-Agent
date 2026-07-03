import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";

import {
  AuthenticatedUserContext,
  RequestWithAuthenticatedUser
} from "./authenticated-user.types";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUserContext => {
    const request = context.switchToHttp().getRequest<RequestWithAuthenticatedUser>();
    const authenticatedUser = request.authenticatedUser;

    if (!authenticatedUser) {
      throw new UnauthorizedException("Authenticated user context is missing.");
    }

    return authenticatedUser;
  }
);
