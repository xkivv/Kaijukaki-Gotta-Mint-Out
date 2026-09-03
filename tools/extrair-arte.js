/* Gera desktop/app/art/*.avif a partir das folhas em base64 de src/18a-sheets.js.
   A build de desktop le a arte de arquivo em vez de base64 (HTML de 1,8 MB em
   vez de 15 MB). Os arquivos sao os MESMOS bytes que ja estao no base64 — por
   isso eles nao vem no pacote: seriam 11 MB de duplicata.
   Rode uma vez, antes de `cd desktop && npm start`:
       node tools/extrair-arte.js                                             */
const fs=require('fs'), path=require('path');
const src=path.resolve(__dirname,'../src/18a-sheets.js');
const out=path.resolve(__dirname,'../desktop/app/art');
const txt=fs.readFileSync(src,'utf8');
/* KK_SHEETS e um array de strings base64 puras (sem o prefixo data:). */
const bloco=txt.slice(txt.indexOf('KK_SHEETS=['));
const achados=[...bloco.matchAll(/"([A-Za-z0-9+/=]{200,})"/g)];
if(!achados.length){console.error('Nenhuma folha encontrada em',src);process.exit(1);}
fs.mkdirSync(out,{recursive:true});
achados.forEach((m,i)=>{
  const f=path.join(out,i+'.avif');
  fs.writeFileSync(f,Buffer.from(m[1],'base64'));
});
const total=achados.reduce((a,m)=>a+Buffer.from(m[1],'base64').length,0);
console.log('gravadas '+achados.length+' folhas em '+out+
            '  ('+Math.round(total/1024/1024)+' MB)');
