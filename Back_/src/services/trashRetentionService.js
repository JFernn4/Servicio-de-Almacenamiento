import cron from 'node-cron';
import { purgeExpiredTrash } from './storageService.js';

let cronTask = null;

/**
 * Ejecuta la purga de archivos en papelera con más de 30 días de antigüedad
 * tanto en la base de datos como en el almacenamiento físico en disco/nube.
 *
 * @param {number} retentionDays Días de retención permitidos en papelera (por defecto 30).
 * @returns {Promise<{ eliminadosCount: number, bytesLiberados: number, archivos: Array }>}
 */
export async function runTrashRetentionCleanup(retentionDays = 30) {
  try {
    const resultado = await purgeExpiredTrash({ retentionDays });
    if (resultado.eliminadosCount > 0) {
      console.log(
        `[PapeleraCron] Retención de ${retentionDays} días: se purgaron ${resultado.eliminadosCount} archivo(s) vencido(s) (${(resultado.bytesLiberados / (1024 * 1024)).toFixed(2)} MB liberados).`
      );
    }
    return resultado;
  } catch (error) {
    console.error('[PapeleraCron] Error al purgar archivos vencidos de la papelera:', error.message);
    throw error;
  }
}

/**
 * Inicia la tarea programada (cron) que purga diariamente los archivos de papelera
 * que han superado los 30 días de retención.
 *
 * @param {Object} options
 * @param {string} [options.cronExpression='0 3 * * *'] Expresión cron (por defecto 03:00 AM diario).
 * @param {number} [options.retentionDays=30] Días de retención en papelera.
 * @param {boolean} [options.runOnStartup=true] Si debe verificar una vez al arrancar el servidor.
 */
export function startTrashRetentionCron({
  cronExpression = '0 3 * * *',
  retentionDays = 30,
  runOnStartup = true,
} = {}) {
  if (cronTask) {
    return cronTask;
  }

  // Comprobación inicial al arrancar (delay de 5 segundos para que la BD esté disponible)
  if (runOnStartup) {
    setTimeout(() => {
      runTrashRetentionCleanup(retentionDays).catch(() => {});
    }, 5000);
  }

  cronTask = cron.schedule(cronExpression, async () => {
    console.log('[PapeleraCron] Ejecutando purga programada de papelera (> 30 días)...');
    await runTrashRetentionCleanup(retentionDays).catch(() => {});
  });

  console.log(`[PapeleraCron] Tarea automática de retención programada ('${cronExpression}', retención: ${retentionDays} días).`);
  return cronTask;
}

/**
 * Detiene la tarea cron en ejecución si está activa.
 */
export function stopTrashRetentionCron() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log('[PapeleraCron] Tarea automática de retención detenida.');
  }
}
