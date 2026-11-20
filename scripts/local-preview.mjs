import {registerHooks} from 'node:module';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname} from 'node:path';
registerHooks({resolve(specifier,context,next){
  if(specifier==='@vercel/blob')return {url:new URL('./local-blob.mjs',import.meta.url).href,shortCircuit:true};
  return next(specifier,context);
}});
const {default:handler}=await import('../api/operations.mjs');
const mime={'.js':'application/javascript','.css':'text/css','.html':'text/html; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/api/operations'){
      req.query=Object.fromEntries(url.searchParams);
      let data='';for await(const chunk of req){data+=chunk;if(data.length>8e6){res.writeHead(413);res.end();return;}}
      req.body=data?JSON.parse(data):{};
      res.status=code=>{res.statusCode=code;return res;};
      res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
      res.redirect=(code,path)=>{res.writeHead(code,{Location:path});res.end();};
      await handler(req,res);return;
    }
    let path=url.pathname.replace(/\/$/,'');
    if(['','/merchant','/admin'].includes(path))path+='/index.html';
    if(!/^\/(?:index\.html|manager(?:\.html)?|(?:merchant|admin|js|css)\/[\w/-]+\.(?:js|css|html|svg|png))$/.test(path)){res.writeHead(404);res.end();return;}
    if(path==='/manager')path+='.html';
    const data=await readFile(new URL('..'+path,import.meta.url));
    res.writeHead(200,{'Content-Type':mime[extname(path)],'Cache-Control':'no-store'});res.end(data);
  }catch(error){res.writeHead(error.code==='ENOENT'?404:400);res.end();}
});
server.listen(Number(process.env.PORT||4174),'127.0.0.1',()=>console.log('本地门店预览 http://127.0.0.1:'+server.address().port+'/merchant/'));
