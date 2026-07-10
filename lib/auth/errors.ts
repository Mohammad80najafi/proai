export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN";
  readonly status = 403;

  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

