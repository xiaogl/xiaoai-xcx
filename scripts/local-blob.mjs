import fs from 'node:fs';
import {join,basename} from 'node:path';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
const dir=process.env.XIAOAI_PREVIEW_DATA||join(homedir(),'.xiaoai-local-preview');
fs.mkdirSync(dir,{recursive:true,mode:0o700});
export class BlobNotFoundError extends Error {}
export class BlobPreconditionFailedError extends Error {}
export async function get(key){
  try{return JSON.parse(fs.readFileSync(join(dir,basename(key)),'utf8'));}
  catch(error){if(error.code==='ENOENT')return null;throw error;}
}
export async function head(key){const row=await get(key);if(!row)throw new BlobNotFoundError();return row;}
export async function put(key,stream,options){
  const current=await get(key);
  if(current?.etag!==options.ifMatch)throw new BlobPreconditionFailedError();
  const target=join(dir,basename(key)),temporary=target+'.'+randomUUID();
  fs.writeFileSync(temporary,JSON.stringify({etag:randomUUID(),stream}),{mode:0o600});
  fs.renameSync(temporary,target);
}
