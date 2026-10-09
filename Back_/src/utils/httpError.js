/**
 * Error con código HTTP cuyo mensaje es seguro de mostrar al cliente.
 */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}
