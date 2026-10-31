import { DEFAULT_STORAGE_QUOTA_BYTES, PLAN_UPLOAD_POLICIES } from '../config/constants.js';

const GB_BYTES = 1024 ** 3;
const TB_BYTES = 1024 ** 4;

/**
 * <<interfaz>> Plan
 * Define el contrato base para cualquier plan de suscripción en Aplicacion VinCloud
 * según el diagrama de clases DiagramaDecorator.
 */
export class Plan {
  costo() {
    throw new Error('El método costo() debe ser implementado por la subclase.');
  }

  decripcion() {
    throw new Error('El método decripcion() debe ser implementado por la subclase.');
  }

  // Alias ortográfico estándar para compatibilidad en todo el sistema
  descripcion() {
    return this.decripcion();
  }

  almacenamiento() {
    throw new Error('El método almacenamiento() debe ser implementado por la subclase.');
  }

  obtenerPoliticaMulter() {
    return PLAN_UPLOAD_POLICIES.PlanGratuito;
  }

  obtenerCadenaDecoradores() {
    return [this.constructor.name];
  }

  toJSON() {
    const politica = this.obtenerPoliticaMulter();
    return {
      clase: this.constructor.name,
      cadenaDecoradores: this.obtenerCadenaDecoradores(),
      costo: this.costo(),
      decripcion: this.decripcion(),
      descripcion: this.descripcion(),
      almacenamiento: this.almacenamiento(),
      almacenamientoGb: Number((this.almacenamiento() / GB_BYTES).toFixed(2)),
      politicaMulter: {
        maxFileSizeBytes: politica.maxFileSizeBytes,
        maxFileSizeMb: Number((politica.maxFileSizeBytes / (1024 * 1024)).toFixed(2)),
        maxFiles: politica.maxFiles,
        shareExpiresIn: politica.shareExpiresIn,
        features: politica.features,
      },
    };
  }
}

/**
 * Componente Concreto Base: PlanGratuito
 * Implementa la interfaz Plan con 5 GB de almacenamiento gratuito y costo Q0.00.
 */
export class PlanGratuito extends Plan {
  costo() {
    return 0;
  }

  decripcion() {
    return 'Plan Gratuito (Base 5 GB)';
  }

  almacenamiento() {
    return DEFAULT_STORAGE_QUOTA_BYTES; // 5 GB = 5,368,709,120 bytes
  }

  obtenerPoliticaMulter() {
    return PLAN_UPLOAD_POLICIES.PlanGratuito;
  }

  obtenerCadenaDecoradores() {
    return ['PlanGratuito'];
  }
}

/**
 * Decorador Base: DecoradorPlanes
 * Envuelve una instancia de Plan (wrappee) y delega las operaciones base.
 */
export class DecoradorPlanes extends Plan {
  /**
   * @param {Plan} wrappee Instancia de Plan a envolver
   */
  constructor(wrappee = new PlanGratuito()) {
    super();
    if (!(wrappee instanceof Plan)) {
      throw new Error('DecoradorPlanes requiere una instancia válida de Plan como wrappee.');
    }
    this.wrappee = wrappee;
  }

  costo() {
    return this.wrappee.costo();
  }

  decripcion() {
    return this.wrappee.decripcion();
  }

  almacenamiento() {
    return this.wrappee.almacenamiento();
  }

  obtenerPoliticaMulter() {
    return this.wrappee.obtenerPoliticaMulter();
  }

  obtenerCadenaDecoradores() {
    return [...this.wrappee.obtenerCadenaDecoradores(), this.constructor.name];
  }
}

/**
 * Decorador Concreto: PlanBasico
 * Extiende DecoradorPlanes agregando las capacidades del Plan Básico (+45 GB sobre los 5 GB base = 50 GB, Q25.00).
 */
export class PlanBasico extends DecoradorPlanes {
  constructor(wrappee = new PlanGratuito(), overrides = {}) {
    super(wrappee);
    const targetStorage = overrides.capacidadAlmacenamiento ?? 50 * GB_BYTES;
    const targetPrice = overrides.precio ?? 25.0;

    // Si envuelve directamente a PlanGratuito, ajusta el delta para alcanzar el total del catálogo;
    // si se apila sobre otro decorador en modo aditivo, suma su aporte neto (+45 GB, +Q25).
    this.costoAdicional =
      overrides.modoAditivoPuro
        ? 25.0
        : Math.max(0, Number(targetPrice) - this.wrappee.costo());
    this.almacenamientoAdicional =
      overrides.modoAditivoPuro
        ? 45 * GB_BYTES
        : Math.max(0, Number(targetStorage) - this.wrappee.almacenamiento());
    this.detalle = overrides.descripcion || 'Para uso personal: respalda documentos y fotos (+45 GB, límite Multer 50 MB, hasta 3 archivos)';
  }

  costo() {
    return Number((super.costo() + this.costoAdicional).toFixed(2));
  }

  decripcion() {
    return `${super.decripcion()} + PlanBasico [${this.detalle}]`;
  }

  almacenamiento() {
    return super.almacenamiento() + this.almacenamientoAdicional;
  }

  obtenerPoliticaMulter() {
    const basePolicy = super.obtenerPoliticaMulter();
    const ownPolicy = PLAN_UPLOAD_POLICIES.PlanBasico;
    return {
      maxFileSizeBytes: Math.max(basePolicy.maxFileSizeBytes, ownPolicy.maxFileSizeBytes),
      maxFiles: Math.max(basePolicy.maxFiles, ownPolicy.maxFiles),
      shareExpiresIn: ownPolicy.shareExpiresIn,
      features: ownPolicy.features,
    };
  }
}

/**
 * Decorador Concreto: Profesional
 * Extiende DecoradorPlanes agregando las capacidades del Plan Profesional (+195 GB sobre 5 GB base = 200 GB, Q60.00).
 */
export class Profesional extends DecoradorPlanes {
  constructor(wrappee = new PlanGratuito(), overrides = {}) {
    super(wrappee);
    const targetStorage = overrides.capacidadAlmacenamiento ?? 200 * GB_BYTES;
    const targetPrice = overrides.precio ?? 60.0;

    this.costoAdicional =
      overrides.modoAditivoPuro
        ? 60.0
        : Math.max(0, Number(targetPrice) - this.wrappee.costo());
    this.almacenamientoAdicional =
      overrides.modoAditivoPuro
        ? 195 * GB_BYTES
        : Math.max(0, Number(targetStorage) - this.wrappee.almacenamiento());
    this.detalle = overrides.descripcion || 'Para freelancers y equipos pequeños (+195 GB, límite Multer 250 MB, hasta 10 archivos)';
  }

  costo() {
    return Number((super.costo() + this.costoAdicional).toFixed(2));
  }

  decripcion() {
    return `${super.decripcion()} + Profesional [${this.detalle}]`;
  }

  almacenamiento() {
    return super.almacenamiento() + this.almacenamientoAdicional;
  }

  obtenerPoliticaMulter() {
    const basePolicy = super.obtenerPoliticaMulter();
    const ownPolicy = PLAN_UPLOAD_POLICIES.Profesional;
    return {
      maxFileSizeBytes: Math.max(basePolicy.maxFileSizeBytes, ownPolicy.maxFileSizeBytes),
      maxFiles: Math.max(basePolicy.maxFiles, ownPolicy.maxFiles),
      shareExpiresIn: ownPolicy.shareExpiresIn,
      features: ownPolicy.features,
    };
  }
}

/**
 * Decorador Concreto: Empresarial
 * Extiende DecoradorPlanes agregando las capacidades del Plan Empresarial (1 TB = 1,024 GB, Q150.00).
 */
export class Empresarial extends DecoradorPlanes {
  constructor(wrappee = new PlanGratuito(), overrides = {}) {
    super(wrappee);
    const targetStorage = overrides.capacidadAlmacenamiento ?? 1 * TB_BYTES;
    const targetPrice = overrides.precio ?? 150.0;

    this.costoAdicional =
      overrides.modoAditivoPuro
        ? 150.0
        : Math.max(0, Number(targetPrice) - this.wrappee.costo());
    this.almacenamientoAdicional =
      overrides.modoAditivoPuro
        ? 1019 * GB_BYTES
        : Math.max(0, Number(targetStorage) - this.wrappee.almacenamiento());
    this.detalle = overrides.descripcion || 'Gran capacidad para equipos y empresas (+1,019 GB, límite Multer 1 GB, hasta 25 archivos)';
  }

  costo() {
    return Number((super.costo() + this.costoAdicional).toFixed(2));
  }

  decripcion() {
    return `${super.decripcion()} + Empresarial [${this.detalle}]`;
  }

  almacenamiento() {
    return super.almacenamiento() + this.almacenamientoAdicional;
  }

  obtenerPoliticaMulter() {
    const basePolicy = super.obtenerPoliticaMulter();
    const ownPolicy = PLAN_UPLOAD_POLICIES.Empresarial;
    return {
      maxFileSizeBytes: Math.max(basePolicy.maxFileSizeBytes, ownPolicy.maxFileSizeBytes),
      maxFiles: Math.max(basePolicy.maxFiles, ownPolicy.maxFiles),
      shareExpiresIn: ownPolicy.shareExpiresIn,
      features: ownPolicy.features,
    };
  }
}

/**
 * Resuelve la clase decoradora correspondiente al nombre de un plan en base de datos
 * y envuelve una instancia de PlanGratuito (o el wrappee indicado).
 */
export function crearPlanDecorado(planRow = null, wrappeeBase = new PlanGratuito()) {
  if (!planRow) {
    return wrappeeBase;
  }

  const nombreNormalizado = String(planRow.nombre || planRow.plan_nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const overrides = {
    precio: Number(planRow.precio ?? planRow.plan_precio ?? 0),
    capacidadAlmacenamiento: Number(planRow.capacidad_almacenamiento ?? planRow.capacidadAlmacenamiento ?? 0),
    descripcion: planRow.descripcion || undefined,
  };

  if (nombreNormalizado.includes('empresarial') || nombreNormalizado.includes('business')) {
    return new Empresarial(wrappeeBase, overrides);
  }

  if (nombreNormalizado.includes('profesional') || nombreNormalizado.includes('pro')) {
    return new Profesional(wrappeeBase, overrides);
  }

  if (nombreNormalizado.includes('basico') || nombreNormalizado.includes('basic')) {
    return new PlanBasico(wrappeeBase, overrides);
  }

  // Si un administrador creó un plan personalizado en el catálogo, lo decora proporcionalmente
  if (overrides.capacidadAlmacenamiento >= 500 * GB_BYTES) {
    return new Empresarial(wrappeeBase, overrides);
  }
  if (overrides.capacidadAlmacenamiento >= 100 * GB_BYTES) {
    return new Profesional(wrappeeBase, overrides);
  }
  return new PlanBasico(wrappeeBase, overrides);
}

/**
 * Permite apilar múltiples decoradores en cadena sobre PlanGratuito (ej. ['PlanBasico', 'Profesional'])
 * para demostrar el encadenamiento recursivo del patrón Decorator (wrappee -> Decorador1 -> Decorador2).
 */
export function construirCadenaDecoradores(decoradores = [], { modoAditivoPuro = true } = {}) {
  let planActual = new PlanGratuito();

  const mapaClases = {
    plangratuito: null,
    gratuito: null,
    planbasico: PlanBasico,
    basico: PlanBasico,
    profesional: Profesional,
    empresarial: Empresarial,
  };

  for (const item of decoradores) {
    const clave = String(item || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .trim();

    const ClaseDecorador = mapaClases[clave];
    if (ClaseDecorador) {
      planActual = new ClaseDecorador(planActual, { modoAditivoPuro });
    }
  }

  return planActual;
}
