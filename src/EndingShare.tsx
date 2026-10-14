import {useEffect,useState} from 'react';
import {Download,Share2,RefreshCw} from 'lucide-react';
import type {Game} from './types';
import {countries,races} from './data/world';
import {shareMemories} from './shareMemories';
import {portraitUrl} from './data/portraits';

// Render real ending data locally; no upload, screenshot service or game-state mutation.
export async function makeEndingImage(g:Game):Promise<Blob>{
  await document.fonts.ready;
  const portrait=new Image();
  portrait.src=portraitUrl(g.race,g.sex);
  await portrait.decode();
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=3000;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
  const font=(size:number,bold=false)=>{ctx.font=`${bold?'700':'400'} ${size}px system-ui, sans-serif`};
  let y=80;
  const text=(value:string,size=28,color='#e8e1d0',width=920)=>{
    font(size);ctx.fillStyle=color;
    let line='';
    for(const char of Array.from(value)){
      if(char==='\n'||ctx.measureText(line+char).width>width){ctx.fillText(line,80,y);y+=size*1.55;line=char==='\n'?'':char}else line+=char;
    }
    if(line){ctx.fillText(line,80,y);y+=size*1.55}
  };
  ctx.fillStyle='#142830';ctx.fillRect(0,0,1080,3000);
  text('AETHERIA  /  에테리아',27,'#d7b875');y+=26;
  ctx.save();ctx.beginPath();ctx.arc(540,y+130,130,0,Math.PI*2);ctx.clip();ctx.drawImage(portrait,410,y,260,260);ctx.restore();y+=300;
  ctx.textAlign='center';font(50,true);ctx.fillStyle='#fff1d0';ctx.fillText(g.name,540,y);y+=55;
  font(24);ctx.fillStyle='#c4c9c5';ctx.fillText(`${races[g.race].name} · ${g.sex} · ${g.birthYear}–${g.year}년 · 향년 ${g.age}세`,540,y);y+=42;
  font(19);ctx.fillText('종족·성별 대표 초상',540,y);y+=70;ctx.textAlign='left';
  text(g.ending||'한 생을 온전히 걸은 사람',40,'#e9cb88');y+=12;
  text(`“${g.epitaph||'그는 살았고, 그 하루들은 한 권의 이야기가 되었다.'}”`,29);y+=30;
  text(`${countries[g.birthCountry].short}에서 태어나 ${g.turns}번의 계절을 선택하고 ${g.npcs.length}명의 주요 인연을 만났습니다. 마지막 거처는 ${g.region}, 신분은 ${countries[g.country].titles[g.rank]}이었습니다.`,27);y+=25;
  text(`마지막 직업  ${g.retired?'은퇴 · ':''}${g.job}`,28,'#e9cb88');
  text(`재산  ${g.state.재산.toLocaleString()} G   ·   명성  ${g.state.명성}   ·   부채  ${g.debt.toLocaleString()} G`,26);
  text(`사망 원인  ${g.cause}`,26);y+=35;
  text('기억할 장면',30,'#e9cb88');y+=10;
  const moments=shareMemories(g);
  if(!moments.length)text('거창한 사건 없이도, 살아 낸 하루들이 한 생의 이야기가 되었습니다.',26);
  for(const entry of moments){text(`${entry.age}세 · ${entry.title}`,27,'#e9cb88');text(entry.text,24);y+=18}
  y+=20;text('당신은 다음 생에 어떤 이야기를 남길까요?',25,'#e9cb88');
  text(window.location.origin,21,'#b5bfbb');y+=30;
  const output=document.createElement('canvas');output.width=1080;output.height=Math.ceil(y);
  const out=output.getContext('2d');if(!out)throw new Error('Canvas unavailable');
  out.drawImage(canvas,0,0);out.strokeStyle='#9b8051';out.lineWidth=2;out.strokeRect(28,28,1024,y-56);
  return new Promise((resolve,reject)=>output.toBlob(b=>b?resolve(b):reject(new Error('PNG encoding failed')),'image/png'));
}

export function EndingShare({g}:{g:Game}){
  const [asset,setAsset]=useState<{file:File;url:string}|null>(null);
  const [message,setMessage]=useState('');const [error,setError]=useState(false);
  const [retry,setRetry]=useState(0);const [preview,setPreview]=useState(false);const [sharing,setSharing]=useState(false);
  useEffect(()=>{let disposed=false,url='';setAsset(null);setError(false);setMessage('');
    makeEndingImage(g).then(blob=>{if(disposed)return;url=URL.createObjectURL(blob);setAsset({file:new File([blob],`에테리아_${g.name.replace(/[^\p{L}\p{N}_-]/gu,'')}_${g.age}세.png`,{type:'image/png'}),url})}).catch(()=>{if(!disposed){setError(true);setMessage('이미지를 만들지 못했습니다. 다시 시도해 주세요.')}});
    return()=>{disposed=true;if(url)URL.revokeObjectURL(url)};
  },[g,retry]);
  const canShare=!!asset&&typeof navigator.canShare==='function'&&navigator.canShare({files:[asset.file]});
  async function share(){if(!asset||!canShare)return;setSharing(true);setMessage('');
    try{await navigator.share({files:[asset.file],title:`에테리아 · ${g.name}의 일대기`,text:`${g.age}년의 생애 — ${g.ending}`});setMessage('공유 메뉴로 전달했습니다.')}
    catch(e){if(e instanceof Error&&e.name==='AbortError')setMessage('공유를 취소했습니다.');else setMessage('공유하지 못했습니다. PNG를 저장한 뒤 SNS에 첨부해 주세요.')}
    finally{setSharing(false)}
  }
  return <section className="ending-share" aria-label="일대기 이미지 저장 및 공유"><h3>한 생의 이야기를 간직하세요</h3><p>초상화와 생애 요약, 주요 장면을 한 장의 이미지로 저장합니다.</p><div className="share-actions">
    {asset?<><a className="gold-button" href={asset.url} download={asset.file.name}><Download size={17}/> PNG 저장</a><button className="outline-button" disabled={!canShare||sharing} onClick={share}><Share2 size={17}/> {sharing?'공유 중…':'SNS 공유'}</button><button className="text-button" onClick={()=>setPreview(!preview)} aria-expanded={preview}>{preview?'미리보기 닫기':'이미지 미리보기'}</button></>:error?<button onClick={()=>setRetry(retry+1)}><RefreshCw size={16}/> 다시 만들기</button>:<span role="status">일대기 이미지 만드는 중…</span>}
    </div>{asset&&!canShare&&<p className="share-help">이 브라우저는 이미지 공유 메뉴를 지원하지 않습니다. PNG를 저장한 뒤 원하는 SNS에 첨부해 주세요.</p>}<p role="status" aria-live="polite">{message}</p>{preview&&asset&&<img className="ending-share-preview" src={asset.url} alt={`${g.name}의 일대기 공유 이미지`}/>}</section>
}
