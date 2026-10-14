import { spawnSync } from 'node:child_process';

export function inspectFfmpeg({ env = process.env, timeoutMs = 10000 } = {}) {
 const command=env.AGENT_DRAW_FFMPEG!==undefined?env.AGENT_DRAW_FFMPEG:'ffmpeg';
 let result;try{result=spawnSync(command,['-version'],{env,encoding:'utf8',timeout:timeoutMs,killSignal:'SIGKILL',maxBuffer:1048576});}catch(error){result={error};}
 const output=(result.stdout||'').trim(),match=/^ffmpeg version (\S+)/.exec(output);
 const status=result.error?.code==='ENOENT'?'missing':result.error||result.status!==0?'probe-failed':!match?'unrecognized-version':'ready';
 return {ok:status==='ready',command,status,version:match?.[1]||null,explicitOverride:env.AGENT_DRAW_FFMPEG!==undefined,optional:true,installUrl:'https://ffmpeg.org/download.html',advice:status==='ready'?'Available for optional GIF and MP4 encoding.':env.AGENT_DRAW_FFMPEG!==undefined?'The explicit AGENT_DRAW_FFMPEG selection did not pass its probe. Check that path and its executable permissions first; another existing installation may already be available. Do not silently ignore the selection. Ask before changing it. Frames-only export remains available. No automatic installation was attempted.':'Frames-only export needs no FFmpeg. Install FFmpeg from its official download page or your distribution package manager; no automatic installation was attempted. An explicit AGENT_DRAW_FFMPEG selection is authoritative and will not be silently replaced.',error:result.error?.message||null};
}

export function encodeAnimation({command,stage,width,height,fps,frames,loop,gif,mp4,background,deadline,env}) {
 const input=`${stage}/frames/frame-%04d.png`,outputs=[];
 const run=(args,format)=>{
  const remaining=deadline-Date.now();if(remaining<=0)throw new Error('Animation export timed out');
  const result=spawnSync(command,['-hide_banner','-loglevel','error','-nostdin',...args],{env,encoding:'utf8',timeout:remaining,killSignal:'SIGKILL',maxBuffer:4*1024*1024});
  if(result.error||result.status!==0)throw new Error(`FFmpeg ${format} encoding failed${format==='MP4'?' (requires a build with the libx264 encoder)':''}: ${result.error?.message||`exit ${result.status}`}\n${(result.stderr||'').slice(-3000)}`);
 };
 const common=['-framerate',String(fps),'-start_number','0','-i',input];
 if(gif){
  run([...common,'-filter_complex_threads','1','-filter_complex','[0:v]split[a][b];[a]palettegen=reserve_transparent=1[p];[b][p]paletteuse=alpha_threshold=128','-frames:v',String(frames),'-loop',loop?'0':'-1',`${stage}/animation.gif`],'GIF');
  outputs.push('animation.gif');
 }
 if(mp4){
  run([...common,'-f','lavfi','-i',`color=c=0x${background.slice(1)}:s=${width}x${height}:r=${fps}`,'-filter_complex_threads','1','-filter_complex','[1:v][0:v]overlay=shortest=1:format=auto,format=yuv420p[v]','-map','[v]','-frames:v',String(frames),'-an','-c:v','libx264','-threads','1','-movflags','+faststart',`${stage}/animation.mp4`],'MP4');
  outputs.push('animation.mp4');
 }
 return outputs;
}
