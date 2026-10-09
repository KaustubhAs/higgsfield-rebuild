import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024});
const files=git('ls-files','-z').split('\0').filter(Boolean);
const workingFiles=[...new Set([...files,...git('ls-files','--others','--exclude-standard','-z').split('\0').filter(Boolean)])];
const forbidden=/(^|\/)(?:\.dev\.vars(?:\..*)?|\.env(?:\..*)?|credentials(?:\..*)?\.json|service[-_]account.*\.json|api[-_]credentials.*|secrets(?:\.json)?|auth\.json|.*\.(?:pem|key|p12|pfx))$|(^|\/)(?:node_modules|out|\.next|\.wrangler|test-results|playwright-report|\.aws)\//i;
const patterns=[
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[A-Z0-9]{16})\b/,
  /\bBearer\s+[A-Za-z0-9_\-]{30,}/,
  /(?:CLOUDFLARE_API_TOKEN|api[_-]?key|api[_-]?token|client_secret)["'`]?\s*[:=]\s*["'`][A-Za-z0-9_\-]{30,}["'`]/i,
  /(?:CLOUDFLARE_ACCOUNT_ID)["'`]?\s*[:=]\s*["'`]?[a-f0-9]{32}\b/i,
];
let failed=false;let scanned=0;
function inspect(text,location){if(text.includes('\0'))return;scanned++;if(patterns.some(p=>p.test(text))){console.error(`Potential credential detected in ${location}; value suppressed. Review locally, never paste it into logs.`);failed=true;}}
for(const file of workingFiles){
  if(forbidden.test(file)&&file!=='.env.example'){console.error(`Forbidden tracked credential/artifact path: ${file}`);failed=true;continue;}
  try{inspect(readFileSync(file,'utf8'),file);}catch{}
}
// Scan every reachable historical text blob, including capture history, without
// printing source lines or matching values. No private untracked env files read.
const objects=git('rev-list','--objects','--all').split('\n').filter(Boolean);
for(const entry of objects){const space=entry.indexOf(' ');if(space<0)continue;const hash=entry.slice(0,space),file=entry.slice(space+1);if(!/\.(md|[cm]?js|json|ya?ml|toml|txt|env|py|css|html)$|(?:^|\/)\.env|\.dev\.vars/.test(file))continue;
  if(git('cat-file','-t',hash).trim()!=='blob')continue;
  inspect(git('cat-file','blob',hash),`history ${hash.slice(0,8)} (${file})`);
}
const evidence=files.filter(f=>/^\.agent-logs\/.*\.md$/.test(f));
if(!evidence.length||!git('log','--format=%h','--','.agent-logs').trim()){console.error('Capture evidence is missing from tracked history.');failed=true;}
try{execFileSync('git',['check-ignore','--no-index','.agent-logs/evidence-check.md'],{stdio:'ignore'});console.error('Agent logs must not be ignored.');failed=true;}catch{}
console.log(`Security heuristic scan: ${scanned} text versions checked; ${evidence.length} capture files tracked. No values printed. This is not proof that all possible secrets are absent.`);
if(failed)process.exitCode=1;
