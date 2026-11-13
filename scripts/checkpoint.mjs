import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),sync=args.includes('--sync'),noteAt=args.indexOf('--note');
if(args.some((a,i)=>a!=='--sync'&&a!=='--note'&&!(noteAt>=0&&i===noteAt+1)))throw Error('Usage: node scripts/checkpoint.mjs [--sync] [--note "message"]');
const note=noteAt>=0?args[noteAt+1]:'';
if(noteAt>=0&&(!note||note.startsWith('--')))throw Error('--note requires a message.');
function run(command,args,{optional=false,capture=false}={}){
 const result=spawnSync(command,args,{cwd:root,encoding:'utf8',stdio:capture?'pipe':'inherit',windowsHide:true});
 if(result.error||result.status!==0){if(optional)return null;throw Error(result.error?.message||`${command} ${args[0]} failed (${result.status}). Local files have been kept.`);}
 return capture?result.stdout.trim():true;
}
try{
 run(process.execPath,['build.mjs']);
 run(process.execPath,['verify.mjs']);
 if(!fs.existsSync(path.join(root,'.git')))run('git',['init','-b','main']);
 const dirty=run('git',['status','--porcelain'],{capture:true});
 if(dirty||note){
  const log=path.join(root,'WORKLOG.md');
  if(!fs.existsSync(log))fs.writeFileSync(log,'# Local checkpoint log\n\nTimes are UTC. Detailed project context is in HANDOFF.md.\n');
  fs.appendFileSync(log,`\n- ${new Date().toISOString()} — ${note?note.replace(/[\r\n]+/g,' '):'Local checkpoint; build and verification passed.'}\n`);
  run('git',['add','--all']);
  const name=run('git',['config','user.name'],{optional:true,capture:true}),email=run('git',['config','user.email'],{optional:true,capture:true});
  const identity=[];if(!name)identity.push('-c','user.name=Local checkpoint');if(!email)identity.push('-c','user.email=local-checkpoint@localhost');
  run('git',[...identity,'commit','-m',note||'Save local project checkpoint']);
 }
 const head=run('git',['rev-parse','--short=12','HEAD'],{capture:true});
 const timestamp=run('git',['show','-s','--format=%cI','HEAD'],{capture:true}).replace(/[^0-9]/g,'').slice(0,14);
 const backupDir=path.join(root,'_backups');fs.mkdirSync(backupDir,{recursive:true});
 const zip=path.join(backupDir,`vfx-texture-lab-${timestamp}-${head}.zip`);
 if(!fs.existsSync(zip))run('git',['archive','--format=zip','--output='+zip,'HEAD']);
 console.log(`Local checkpoint: ${head}\nPortable ZIP: ${zip}`);
 if(sync){
  const remote=run('git',['remote','get-url','origin'],{optional:true,capture:true});
  if(!remote)throw Error('No origin remote. Local commit and ZIP are saved. Configure the approved remote before syncing.');
  run('git',['push','-u','origin','HEAD']);
  console.log('Remote sync complete.');
 }
}catch(error){console.error(error.message);process.exitCode=1;}
