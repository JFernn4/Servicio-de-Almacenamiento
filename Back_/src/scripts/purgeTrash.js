import { purgeExpiredTrash } from '../services/storageService.js';
import { getPool } from '../config/db.js';

const daysArg = process.argv.find((arg) => arg.startsWith('--days='));
const retentionDays = daysArg ? parseInt(daysArg.split('=')[1], 10) : 30;

if (Number.isNaN(retentionDays) || retentionDays < 0) {
  console.error('[Script] El parámetro --days debe ser un número entero mayor o igual a 0.');
  process.exit(1);
}

console.log(`[Script] Iniciando purga de archivos en papelera con más de ${retentionDays} días...`);

try {
  const result = await purgeExpiredTrash({ retentionDays });
  console.log('----------------------------------------------------');
  console.log(`Purga completada exitosamente:`);
  console.log(`  - Archivos eliminados: ${result.eliminadosCount}`);
  console.log(`  - Espacio liberado: ${(result.bytesLiberados / (1024 * 1024)).toFixed(2)} MB (${result.bytesLiberados} bytes)`);

  if (result.archivos && result.archivos.length > 0) {
    console.log('  - Archivos purgados:');
    result.archivos.forEach((a) => {
      console.log(`    * [ID ${a.id}] ${a.nombre} (${(a.tamano / 1024).toFixed(1)} KB, usuario ID: ${a.usuarioId})`);
    });
  } else {
    console.log('  - No se encontraron archivos vencidos en la papelera.');
  }
  console.log('----------------------------------------------------');
} catch (error) {
  console.error('[Script] Error durante la purga de la papelera:', error);
  process.exitCode = 1;
} finally {
  const pool = getPool();
  if (pool) {
    await pool.end().catch(() => {});
  }
}
