const fs=require("fs");
const cp=require("child_process");
const HEAD=cp.execSync("git show HEAD:apps/web/src/components/templates/StudioLayout.tsx",{cwd:process.cwd(),maxBuffer:1<<26}).toString().split(/\r?\n/);
const trim=s=>s.trim();
const W=s=>/[A-Za-z0-9_]/.test(s);
function uses(t,n){let i=0;while((i=t.indexOf(n,i))!==-1){const b=i>0?t[i-1]:" ",a=i+n.length<t.length?t[i+n.length]:" ";if(!W(b)&&!W(a))return true;i+=n.length;}return false;}
const A=HEAD;
function findIdx(pred,from=0){for(let i=from;i<A.length;i++)if(pred(A[i],i))return i;return -1;}

// members = union of hook return blocks
function retMembers(file){const s=fs.readFileSync("studio/editor/"+file,"utf8");const m=s.match(/return \{([\s\S]*?)\n  \};/);return m[1].split(/[,\n]/).map(x=>x.trim()).filter(x=>/^[A-Za-z0-9_]+$/.test(x));}
let members=[];
for(const f of ["useStudioEditorState.ts","useStudioActions.ts","useStudioGestures.ts","useStudioPointerMotion.ts","useStudioMenuKeyboard.ts"]) members=members.concat(retMembers(f));
members=[...new Set(members)];

// import registry
const reg={};
const addv=(ns,spec)=>ns.forEach(n=>reg[n]={spec,kind:"val"});
const addt=(ns,spec)=>ns.forEach(n=>reg[n]={spec,kind:"type"});
reg["Link"]={spec:"next/link",kind:"default"};
addv(["toast"],"sonner");
addv(["StudioTutorial"],"@/components/templates/StudioTutorial");
addv(["StudioMarketplace"],"@/components/templates/StudioMarketplace");
addv(["ConfirmDialog"],"@/components/ui/ConfirmDialog");
addv(["PreviewStage","GroupBar","PropertiesPanel","StylePanel","LayersPanel","PartsPanel","AssetsPanel","RulesPanel"],"../panels");
addv(["PresenceAvatar","ShareDialog","GuideDialog"],"../dialogs");
addv(["MM_TO_PX","CANVAS_W_MM","CANVAS_H_MM","GRID_MM","safeColor","safeNum","isCircleType","isSilhouetteType","isChromeless","PAGE_MIN","PAGE_MAX","PAGE_SIZE_PRESETS","RULE_TRIGGERS","RULE_TARGETS","RULE_ACTIONS","RULE_TEMPLATES","ruleActionDef","buildRuleDescription","SCENARIO_DIFFICULTY","EMPTY_GUIDE","TYPE_DEFAULTS","makeComp","INITIAL","normalizeComponents","COMP_ICONS","TOOLS","ShapeInner","SilhouetteShape","CompView","Preview2D","Preview3D","ContextMenu"],"../core");
addt(["CompType","CanvasComp","StudioPage","RuleTrigger","RuleActionType","RuleTarget","RuleParams","GameRule","ScenarioDifficulty","GameScenario","GameGuide","ToolId","ResizeHandle","MenuItem"],"../core");

function importsFor(body){
  const byspec={};
  for(const n of Object.keys(reg)){ if(!uses(body,n))continue; const {spec,kind}=reg[n]; (byspec[spec]=byspec[spec]||{val:[],type:[],def:null}); if(kind==="default")byspec[spec].def=n; else byspec[spec][kind].push(n); }
  const out=[];
  for(const spec of Object.keys(byspec)){const {val,type,def}=byspec[spec];if(def)out.push("import "+def+" from \""+spec+"\";");if(val.length)out.push("import {\n"+val.map(s=>"  "+s+",").join("\n")+"\n} from \""+spec+"\";");if(type.length)out.push("import type {\n"+type.map(s=>"  "+s+",").join("\n")+"\n} from \""+spec+"\";");}
  return out.join("\n\n");
}
function mkComp(name,jsxLines,frag){
  const body=jsxLines.join("\n");
  const used=members.filter(m=>uses(body,m));
  const imp=importsFor(body);
  const destr=used.length?"  const {\n"+used.map(n=>"    "+n+",").join("\n")+"\n  } = ed;\n\n":"";
  const inner=frag?("    <>\n"+body+"\n    </>"):body;
  return "\"use client\";\n\n"+imp+"\n\nimport type { StudioEditor } from \"./useStudioEditor\";\n\nexport function "+name+"({ ed }: { ed: StudioEditor }) {\n"+destr+"  return (\n"+inner+"\n  );\n}\n";
}

const miIf=findIdx(l=>trim(l)==="if (isMobile && !inPreview) {");
const miRet=findIdx(l=>l==="    return (",miIf);
const miEnd=findIdx(l=>l==="    );",miRet);
const mobileJSX=A.slice(miRet+1,miEnd);

const pvIf=findIdx(l=>trim(l)==="if (inPreview) {");
const pvRet=findIdx(l=>l==="    return (",pvIf);
const pvEnd=findIdx(l=>l==="    );",pvRet);
const previewJSX=A.slice(pvRet+1,pvEnd);

const edRet=findIdx(l=>l==="  return (",pvEnd);
const edEnd=findIdx(l=>l==="  );",edRet+1);

const tbi=findIdx(l=>trim(l)==="{/* Toolbar */}",edRet);
const di=findIdx(l=>trim(l)==="{shareOpen && (",edRet);
const pi=findIdx(l=>trim(l).startsWith("{/* Pages bar"),edRet);
const bi=findIdx(l=>trim(l)==="{/* Body */}",edRet);
const rootClose=edEnd-1;

const rootOpen=A.slice(edRet+1,tbi);
const toolbar=A.slice(tbi,di);
const dialogs=A.slice(di,pi);
const pagesbar=A.slice(pi,bi);
const body=A.slice(bi,rootClose);
console.log("slices: rootOpen",rootOpen.length,"toolbar",toolbar.length,"dialogs",dialogs.length,"pagesbar",pagesbar.length,"body",body.length);

fs.writeFileSync("studio/editor/MobileNotice.tsx",mkComp("MobileNotice",mobileJSX,false));
fs.writeFileSync("studio/editor/PreviewScreen.tsx",mkComp("PreviewScreen",previewJSX,false));
fs.writeFileSync("studio/editor/EditorToolbar.tsx",mkComp("EditorToolbar",toolbar,true));
fs.writeFileSync("studio/editor/EditorPagesBar.tsx",mkComp("EditorPagesBar",pagesbar,true));
fs.writeFileSync("studio/editor/EditorBody.tsx",mkComp("EditorBody",body,true));

{
  const dialogsBody=dialogs.join("\n");
  const used=members.filter(m=>uses(dialogsBody,m));
  const imp=importsFor(dialogsBody);
  const destr=used.length?"  const {\n"+used.map(n=>"    "+n+",").join("\n")+"\n  } = ed;\n\n":"";
  const viewInner=rootOpen.join("\n")+"\n      <EditorToolbar ed={ed} />\n\n"+dialogs.join("\n")+"\n\n      <EditorPagesBar ed={ed} />\n\n      <EditorBody ed={ed} />\n"+A[rootClose];
  const head="\"use client\";\n\n"+imp+"\n\nimport type { StudioEditor } from \"./useStudioEditor\";\nimport { EditorToolbar } from \"./EditorToolbar\";\nimport { EditorPagesBar } from \"./EditorPagesBar\";\nimport { EditorBody } from \"./EditorBody\";\n\n";
  fs.writeFileSync("studio/editor/EditorView.tsx",head+"export function EditorView({ ed }: { ed: StudioEditor }) {\n"+destr+"  return (\n"+viewInner+"\n  );\n}\n");
}

let ed=fs.readFileSync("studio/editor/useStudioEditor.ts","utf8");
if(!ed.includes("export type StudioEditor")) { ed+="\nexport type StudioEditor = ReturnType<typeof useStudioEditor>;\n"; fs.writeFileSync("studio/editor/useStudioEditor.ts",ed); }

const layout="\"use client\";\n\nimport { useStudioEditor } from \"./studio/editor/useStudioEditor\";\nimport { MobileNotice } from \"./studio/editor/MobileNotice\";\nimport { PreviewScreen } from \"./studio/editor/PreviewScreen\";\nimport { EditorView } from \"./studio/editor/EditorView\";\n\nexport type {\n  CanvasComp,\n  GameRule,\n  GameGuide,\n} from \"./studio/core\";\n\ninterface StudioLayoutProps {\n  gameId: string;\n}\n\nexport function StudioLayout({ gameId }: StudioLayoutProps) {\n  const ed = useStudioEditor(gameId);\n\n  if (ed.isMobile && !ed.inPreview) return <MobileNotice ed={ed} />;\n  if (ed.inPreview) return <PreviewScreen ed={ed} />;\n  return <EditorView ed={ed} />;\n}\n";
fs.writeFileSync("StudioLayout.tsx",layout);

for(const f of ["MobileNotice","PreviewScreen","EditorToolbar","EditorPagesBar","EditorBody","EditorView"])
  console.log(f, fs.readFileSync("studio/editor/"+f+".tsx","utf8").split("\n").length);
