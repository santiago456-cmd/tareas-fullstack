// HTTP contra createApp real; JWKS y usuarios sintéticos. SQLite exclusivamente en memoria.
import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const appURL = new URL('../tareas-2/tareas-back-main/src/app.js',import.meta.url);
const require = createRequire(appURL);
const { generateKeyPair, exportJWK, SignJWT } = await import(pathToFileURL(require.resolve('jose')));
const { publicKey,privateKey }=await generateKeyPair('RS256');
const jwk=await exportJWK(publicKey); jwk.kid='audit'; jwk.alg='RS256';
const listen=server=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const keys=http.createServer((req,res)=>{res.setHeader('content-type','application/json');res.end(JSON.stringify({keys:[jwk]}));});
const keyPort=await listen(keys);
process.env.SQLITE_STORAGE=':memory:';
process.env.KEYCLOAK_BASE_URL=`http://127.0.0.1:${keyPort}`;
process.env.KEYCLOAK_REALM='audit';
process.env.KEYCLOAK_CLIENT_ID='tareas-api';
const issuer=`${process.env.KEYCLOAK_BASE_URL}/realms/audit`;
let source=await readFile(appURL,'utf8');
source=source.slice(0,source.indexOf('main().catch'))+'\nexport { createApp };';
source=source.replace(/(['"])(\.[^'"\n]+)\1/g,(_,quote,spec)=>quote+new URL(spec,appURL).href+quote);
source=source.replace(/from (['"])([^.'"/][^'"\n]*)\1/g,(_,quote,spec)=>'from '+quote+(spec.startsWith('file:')?spec:pathToFileURL(require.resolve(spec)).href)+quote);
const {createApp}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const {sequelize}=await import(new URL('./config/database.js',appURL));
await sequelize.sync({force:true});
const api=http.createServer(createApp());
const apiPort=await listen(api);
const sign=async({aud='account',azp='tareas-api',sub='audit-user',roles=['usuario'],exp='5m',iss=issuer}={})=>new SignJWT({azp,preferred_username:sub,realm_access:{roles}}).setProtectedHeader({alg:'RS256',kid:'audit'}).setIssuer(iss).setSubject(sub).setAudience(aud).setIssuedAt().setExpirationTime(exp).sign(privateKey);
const results=[];
async function request(name,path,{token,method='GET',body}={}) {
 const headers={}; if(token) headers.Authorization=`Bearer ${token}`; if(body!==undefined)headers['content-type']='application/json';
 const res=await fetch(`http://127.0.0.1:${apiPort}${path}`,{method,headers,body});
 const contentType=res.headers.get('content-type'); const raw=await res.text();
 let data; try{data=JSON.parse(raw);}catch{data={html:raw.startsWith('<!DOCTYPE html>')};}
 const result={name,status:res.status,contentType,data};results.push(result);console.log(JSON.stringify(result));return result;
}
try {
 const own=await sign();
 await request('sin token','/api/listas');
 await request('token inválido','/api/listas',{token:'invalid'});
 const wrongKeys=await generateKeyPair('RS256');
 const badSignature=await new SignJWT({}).setProtectedHeader({alg:'RS256',kid:'audit'}).setIssuer(issuer).setSubject('bad-signature').setAudience('account').setExpirationTime('5m').sign(wrongKeys.privateKey);
 await request('firma incorrecta','/api/listas',{token:badSignature});
 await request('issuer incorrecto','/api/listas',{token:await sign({iss:'https://wrong.invalid'})});
 await request('token vencido','/api/listas',{token:await sign({exp:1})});
 await request('token para otro cliente del mismo realm','/api/listas',{token:await sign({azp:'otro-cliente',sub:'audit-other-client'})});
 await request('audiencia propia rechazada','/api/listas',{token:await sign({aud:'tareas-api'})});
 await request('usuario sin admin','/api/admin/cuentas',{token:own});
 await request('admin permitido','/api/admin/cuentas',{token:await sign({sub:'audit-admin',roles:['admin']})});
 await request('JSON malformado','/api/listas',{method:'POST',token:own,body:'{"nombre":'});
 await request('body mayor de límite','/api/listas',{method:'POST',token:own,body:JSON.stringify({nombre:'x'.repeat(110000)})});
 await request('nombre numérico HTTP','/api/listas',{method:'POST',token:own,body:'{"nombre":123}'});
 await request('PATCH recurso inexistente','/api/tareas/99999',{method:'PATCH',token:own,body:'{"desconocido":true}'});
 await request('ruta inexistente','/api/no-existe');
} finally {
 await new Promise(r=>api.close(r)); await new Promise(r=>keys.close(r)); await sequelize.close();
 await writeFile(new URL('./resultados-http.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
}
