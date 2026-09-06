// Evidencia reproducible de auditoría. No usa la base de datos del proyecto.
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
process.env.SQLITE_STORAGE = ':memory:';
const base = new URL('../tareas-2/tareas-back-main/src/', import.meta.url);
const mod = (path) => import(new URL(path, base));
const { sequelize } = await mod('config/database.js');
await mod('models/associations.js');
const { Cuenta } = await mod('models/Cuenta.js');
const { Lista } = await mod('models/lista.js');
const { Tarea } = await mod('models/tarea.js');
const { ListasService } = await mod('services/listasService.js');
const { TareasService } = await mod('services/TareasService.js');
const { CuentasService } = await mod('services/CuentasService.js');
const { ListasRepository } = await mod('repositories/listasRepository.js');
const { TareasRepository } = await mod('repositories/tareasRepository.js');
const { ListasController } = await mod('controllers/listasController.js');
const { TareasController } = await mod('controllers/TareasController.js');
const { HealthCheckController } = await mod('controllers/healthCheckController.js');
const results = [];
const record = (name, evidence) => { results.push({ name, evidence }); console.log(name, JSON.stringify(evidence)); };
async function controller(handler, body, cuentaId, id = 1) {
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
  await handler({ body, cuenta: { id: cuentaId }, validatedParams: { id }, params: { id }, query: {} }, res);
  return { status: res.statusCode, body: res.body };
}
await sequelize.sync({ force: true });
try {
  const a = await Cuenta.create({ keycloakSub: 'audit-a', username: 'audit-a' });
  const b = await Cuenta.create({ keycloakSub: 'audit-b', username: 'audit-b' });
  const ls = new ListasService();
  const ts = new TareasService();
  const lista = (await ls.crearLista(a.id, { nombre: 'Audit lista' })).data;
  const tarea = (await ts.crearTarea(a.id, { titulo: 'Audit tarea', listaId: lista.id })).data;
  const isolation = {
    readList: await ls.obtenerListaPorId(b.id, lista.id),
    readTask: await ts.obtenerTareaPorId(b.id, tarea.id),
    updateList: (await ls.actualizarLista(b.id, lista.id, { nombre: 'Ajena' })).status,
    deleteList: (await ls.eliminarLista(b.id, lista.id)).status,
    updateTask: (await ts.actualizarTarea(b.id, tarea.id, { titulo: 'Ajena' })).status,
    completeTask: (await ts.completarTarea(b.id, tarea.id)).status,
    deleteTask: (await ts.eliminarTarea(b.id, tarea.id)).status,
    createTaskForeignList: (await ts.crearTarea(b.id, { titulo: 'Ajena', listaId: lista.id })).status,
    collection: (await ts.obtenerTareas(b.id)).data.length,
  };
  assert.equal(isolation.readList, null); assert.equal(isolation.readTask, null);
  for (const [k,v] of Object.entries(isolation)) if (!['readList','readTask','collection'].includes(k)) assert.equal(v,404);
  assert.equal(isolation.collection, 0); record('Aislamiento entre cuentas', isolation);
  record('Eliminar lista pendiente', (await ls.eliminarLista(a.id, lista.id)).status);
  record('Completar y repetir', [(await ts.completarTarea(a.id,tarea.id)).status,(await ts.completarTarea(a.id,tarea.id)).status]);
  for (const [name,handler,body,id] of [
    ['nombre numérico',ListasController.crearLista,{nombre:123},lista.id],
    ['titulo numérico',TareasController.crearTarea,{titulo:123,listaId:lista.id},tarea.id],
    ['PATCH nombre null',ListasController.actualizarLista,{nombre:null},lista.id],
    ['PATCH sin body',TareasController.actualizarTarea,undefined,tarea.id],
  ]) record(name, await controller(handler,body,a.id,id));
  const invalidTags = await ts.crearTarea(a.id,{titulo:'Etiquetas inválidas',listaId:lista.id,etiquetas:'texto'});
  record('Etiquetas string aceptadas', {status:invalidTags.status,stored:(await Tarea.findByPk(invalidTags.data.id)).etiquetas});
  const oversized = await ls.crearLista(a.id,{nombre:'Campos extensos',descripcion:'x'.repeat(251),color:'x'.repeat(31)});
  record('Límites de lista no aplicados', {status:oversized.status,descriptionLength:oversized.data.descripcion.length,colorLength:oversized.data.color.length});
  const longTask = await ts.crearTarea(a.id,{titulo:'Descripción extensa',listaId:lista.id,descripcion:'x'.repeat(501)});
  record('Límite descripción tarea no aplicado', {status:longTask.status,length:longTask.data.descripcion.length});
  const parallel = await Promise.allSettled([new CuentasService().resolverDesdeUsuario({id:'audit-race',username:'race'}),new CuentasService().resolverDesdeUsuario({id:'audit-race',username:'race'})]);
  record('Alta concurrente de cuenta', parallel.map(x=>({status:x.status,error:x.reason?.name})));
  const originalCreate = Lista.create;
  Lista.create = async () => { throw new Error('fallo simulado de listas iniciales'); };
  try { await new CuentasService().resolverDesdeUsuario({id:'audit-partial',username:'partial'}); } catch {}
  Lista.create = originalCreate;
  const partial = await new CuentasService().resolverDesdeUsuario({id:'audit-partial',username:'partial'});
  record('Alta parcial persiste sin reparación', {cuentaExiste:!!partial,listas:await Lista.count({where:{cuentaId:partial.id}})});
  const dl = (await ls.crearLista(a.id,{nombre:'Borrado parcial'})).data;
  await Tarea.create({titulo:'Completada',listaId:dl.id,completada:true});
  const repo = new ListasRepository(); repo.eliminar = async () => { throw new Error('fallo simulado al borrar lista'); };
  try {await new ListasService({listasRepository:repo}).eliminarLista(a.id,dl.id);} catch {}
  record('Borrado no atómico con fallo inyectado', {listaExiste:!!await Lista.findByPk(dl.id),tareasRestantes:await Tarea.count({where:{listaId:dl.id}})});
  const sql=[]; sequelize.options.logging=(q)=>sql.push(q);
  const lists = await ls.obtenerListasConCantidadDeTareas(a.id);
  sequelize.options.logging=false;
  record('Consultas N+1', {listas:lists.length,consultas:sql.length});
  record('Índices tareas', await sequelize.query('PRAGMA index_list(TAREAS)',{type:sequelize.QueryTypes.SELECT}));
  record('FK tareas', await sequelize.query('PRAGMA foreign_key_list(TAREAS)',{type:sequelize.QueryTypes.SELECT}));
  const raceList=(await ls.crearLista(a.id,{nombre:'Carrera al borrar'})).data;
  const raceRepo=new TareasRepository();
  const countOriginal=raceRepo.contarPendientesPorListaId.bind(raceRepo);
  let lateTask;
  raceRepo.contarPendientesPorListaId=async(id)=>{const count=await countOriginal(id);lateTask=await Tarea.create({titulo:'Pendiente concurrente',listaId:id});return count;};
  let deleteRace;
  try { deleteRace=await new ListasService({tareasRepository:raceRepo}).eliminarLista(a.id,raceList.id); } catch(e){deleteRace={error:e.name};}
  record('Crear pendiente entre conteo y borrado', {result:deleteRace,pendienteExiste:!!await Tarea.findByPk(lateTask.id)});
  const duplicates=await Promise.allSettled([ls.crearLista(a.id,{nombre:'Duplicada concurrente'}),ls.crearLista(a.id,{nombre:'Duplicada concurrente'})]);
  record('Lista duplicada concurrente',duplicates.map(x=>({status:x.status,http:x.value?.status,error:x.reason?.name})));
  const originalAuthenticate=sequelize.authenticate;
  sequelize.authenticate=async()=>{throw new Error('DB no disponible');};
  const hc=await controller(HealthCheckController.getHealthCheck,{},a.id);
  sequelize.authenticate=originalAuthenticate;
  record('Health-check con DB caída',{http:hc.status,success:hc.body.success,status:hc.body.data.status});
  // Ejecuta el módulo OAuth real con almacenamiento y red simulados.
  const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
  globalThis.window={location:{origin:'http://localhost:5173'}};
  globalThis.localStorage=storage(); globalThis.sessionStorage=storage();
  const source=(await readFile(new URL('../tareas-2/tareas-fe/src/auth/oauth.js',import.meta.url),'utf8')).replaceAll('import.meta.env.','({}).');
  const oauth=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  localStorage.setItem('access_token','expired-or-invalid-token');
  record('UI autenticada con token inválido',oauth.estaAutenticado());
  sessionStorage.setItem('pkce_state','state'); sessionStorage.setItem('pkce_code_verifier','verifier');
  let calls=0; const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>{const call=++calls; await new Promise(r=>setTimeout(r,5)); return {ok:call===1,json:async()=>({access_token:'audit-token'})};};
  const callbacks=await Promise.allSettled([oauth.manejarCallback(new URLSearchParams('code=code&state=state')),oauth.manejarCallback(new URLSearchParams('code=code&state=state'))]);
  globalThis.fetch=originalFetch;
  record('Callback concurrente, proveedor simulado de un solo uso',{tokenRequests:calls,results:callbacks.map(x=>x.status)});
} finally {
  await sequelize.close();
  await writeFile(new URL('./resultados-probes.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
}
