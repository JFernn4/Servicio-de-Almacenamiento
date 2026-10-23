import { HttpError } from '../utils/httpError.js';

function extractLast4Digits(body = {}) {
  const rawCard = String(body.tarjetaUltimos4 ?? body.numeroTarjeta ?? body.tarjeta ?? '4242').replace(/\D/g, '');
  if (rawCard.length < 4) {
    throw new HttpError(400, 'Debes ingresar al menos los últimos 4 dígitos numéricos de la tarjeta.');
  }
  return rawCard.slice(-4);
}

export function validateSubscribeInput(body = {}) {
  const planId = Number(body.planId);
  if (!Number.isInteger(planId) || planId <= 0) {
    throw new HttpError(400, 'El identificador del plan (planId) no es válido.');
  }

  const tarjetaUltimos4 = extractLast4Digits(body);
  const simularRechazo = Boolean(body.simularRechazo) || tarjetaUltimos4 === '0000';

  return {
    planId,
    tarjetaUltimos4,
    simularRechazo,
  };
}

export function validateRenewInput(body = {}) {
  const tarjetaUltimos4 = extractLast4Digits(body);
  const simularRechazo = Boolean(body.simularRechazo) || tarjetaUltimos4 === '0000';

  return {
    tarjetaUltimos4,
    simularRechazo,
  };
}

export function validateDecoratorChainInput(body = {}) {
  const rawList = Array.isArray(body.decoradores) ? body.decoradores : [];
  const modoAditivoPuro = body.modoAditivoPuro !== undefined ? Boolean(body.modoAditivoPuro) : true;

  return {
    decoradores: rawList.map((d) => String(d).trim()).filter(Boolean),
    modoAditivoPuro,
  };
}
