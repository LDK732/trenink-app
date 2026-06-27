import React from "react";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://flfhriwvuyuunmbnmitv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZmhyaXd2dXl1dW5tYm5taXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDAwMjEsImV4cCI6MjA5NDE3NjAyMX0.iJExs9TdARClQL9oorge8C6hQ0UMjD4gRUE_7nGo8tw"
);


const T = {
  bg:         "#111111",
  bgCard:     "#1c1c1c",
  bgCard2:    "#242424",
  bgRow:      "#181818",
  accent:     "#2E9FAF",
  accentBtn:  "#184b5e",
  accentDim:  "#1e7a88",
  white:      "#EEEEEE",
  muted:      "#888888",
  borderDim:  "rgba(255,255,255,0.07)",
  borderGlow: "rgba(46,159,175,0.3)",
  blockBorder:"#00ced1",
  shadow:     "0 6px 24px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.4)",
  shadowSm:   "0 3px 12px rgba(0,0,0,0.5)",
  innerGlow:  "inset 0 1px 0 rgba(255,255,255,0.05)",
  danger:     "#e05555",
};

const PARTIE = {
  prsa:    { color:"#0099FF", label:"Hrudník" },
  zada:    { color:"#FF0000", label:"Záda"    },
  nohy:    { color:"#00CC00", label:"Nohy"    },
  ramena:  { color:"#00FFFF", label:"Ramena"  },
  biceps:  { color:"#FF00FF", label:"Biceps"  },
  triceps: { color:"#CC9900", label:"Triceps" },
  core:    { color:"#FFFF00", label:"Břicho"  },
};

// ─── SEED DATA ──────────────────────────────────────────────────────────────
const SEED_TEMPLATES = [];

const SEED_EXERCISES = [];

// ─── SEED GROUPS ─────────────────────────────────────────────────────────────
const SEED_GROUPS = [];

const SEED_CLIENTS = [];

const WEEKS = ["1. týden","2. týden","3. týden","4. týden","5. týden","6. týden"];

// ─── REST TIMER ──────────────────────────────────────────────────────────────
function RestTimer({ seconds }) {
  const [remaining, setRemaining] = useState(null);
  const intervalRef = useRef(null);

  function handleClick() {
    if (remaining !== null) { clearInterval(intervalRef.current); setRemaining(null); return; }
    setRemaining(seconds);
  }

  useEffect(() => {
    if (remaining === null || remaining === 0) {
      clearInterval(intervalRef.current);
      if (remaining === 0) setTimeout(() => setRemaining(null), 600);
      return;
    }
    intervalRef.current = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, [remaining]);

  const mins = Math.floor((remaining ?? seconds) / 60);
  const secs = String((remaining ?? seconds) % 60).padStart(2, "0");

  return (
    <button onClick={handleClick} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, padding:0, fontFamily:"inherit" }}>
      <span style={{ color:T.accent, fontSize:11 }}>▶</span>
      <span style={{ color:T.accent, fontSize:13, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", letterSpacing:0.5, minWidth:36 }}>{mins}:{secs}</span>
    </button>
  );
}

// ─── HELPERS ────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant="primary", small, full, style={} }) => {
  const base = {
    primary:   { background:T.accentBtn,      color:"#fff",   border:"none"                     },
    secondary: { background:"transparent", color:T.accent, border:`1.5px solid ${T.accent}`  },
    ghost:     { background:T.bgCard2,     color:T.muted,  border:`1px solid ${T.borderDim}` },
    danger:    { background:"transparent", color:T.danger, border:`1px solid ${T.danger}55`  },
  };
  return (
    <button onClick={onClick} style={{ ...(base[variant]||base.primary), borderRadius:9, cursor:"pointer", fontWeight:700, fontSize:small?11:13, padding:small?"6px 12px":"10px 18px", width:full?"100%":undefined, fontFamily:"inherit", ...style }}>{children}</button>
  );
};

function PageHeader({ label, title, action }) {
  return (
    <div style={{ padding:"20px 18px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
      <div>
        <div style={{ color:T.accent, fontSize:9, letterSpacing:2.5, textTransform:"uppercase", marginBottom:5, fontWeight:700, opacity:0.8 }}>{label}</div>
        <div style={{ color:T.white, fontWeight:700, fontSize:20, letterSpacing:0, lineHeight:1.2, fontFamily:"Rajdhani, sans-serif", fontWeight: 700, textTransform: "uppercase", }}>{title}</div>
      </div>
      {action}
    </div>
  );
}

function Card({ children, style={}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:`linear-gradient(180deg, #202020 0%, #191919 100%)`,
      borderRadius:13,
      border:`1px solid rgba(255,255,255,0.08)`,
      boxShadow:`0 8px 28px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.05) inset`,
      cursor:onClick?"pointer":undefined, overflow:"hidden", ...style
    }}>{children}</div>
  );
}

// ─── GROUP PICKER MODAL ──────────────────────────────────────────────────────
function GroupPickerModal({ groupId, groupName, exercises, groups, onSwapEx, onClose }) {
  const [detailEx, setDetailEx] = useState(null);
  const grpExercises = exercises.filter(e => e.groupId === groupId);

  if (detailEx) {
    const p = PARTIE[detailEx.partie]||{color:T.accent};
    const isYT = detailEx.mediaUrl?.includes("youtube");
    const isImg = detailEx.mediaUrl && !isYT;
    return (
      <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:600,display:"flex",alignItems:"flex-end" }}>
        <div style={{ background:T.bgCard,borderRadius:"16px 16px 0 0",width:"100%",maxHeight:"80vh",display:"flex",flexDirection:"column" }}>
          <div style={{ background:T.bgCard2,padding:"12px 14px 10px",borderBottom:`3px solid ${p.color}`,borderRadius:"16px 16px 0 0",display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
            <button onClick={()=>setDetailEx(null)} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:7,color:T.accent,fontSize:12,cursor:"pointer",padding:"4px 9px",fontWeight:700,fontFamily:"inherit",flexShrink:0 }}>← Zpět</button>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ color:p.color,fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase" }}>{PARTIE[detailEx.partie]?.label}</div>
              <div style={{ color:T.white,fontWeight:800,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{detailEx.name}</div>
            </div>
            {onSwapEx&&(
              <button onClick={()=>{ onSwapEx(detailEx); onClose(); }}
                style={{ background:T.accentBtn,border:"none",borderRadius:7,color:"#fff",fontSize:11,cursor:"pointer",padding:"5px 11px",fontWeight:700,fontFamily:"inherit",flexShrink:0 }}>
                ↔ Vyměnit
              </button>
            )}
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:7,color:T.muted,fontSize:15,cursor:"pointer",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>✕</button>
          </div>
          <div style={{ overflowY:"auto",padding:"12px 16px 28px" }}>
            <div style={{ background:T.bg,borderRadius:9,border:`1px solid ${T.borderDim}`,overflow:"hidden",marginBottom:12,minHeight:110,display:"flex",alignItems:"center",justifyContent:"center" }}>
              {isYT ? <iframe src={detailEx.mediaUrl.replace("watch?v=","embed/").replace("youtu.be/","www.youtube.com/embed/")} style={{ width:"100%",height:180,border:"none" }} allowFullScreen title="video"/>
               : isImg ? <img src={detailEx.mediaUrl} alt={detailEx.name} style={{ width:"100%",maxHeight:180,objectFit:"cover" }}/>
               : <div style={{ textAlign:"center" }}><div style={{ fontSize:30 }}>💪</div><div style={{ color:T.muted,fontSize:11,marginTop:4 }}>Foto / video nebylo přidáno</div></div>}
            </div>
            {detailEx.desc&&<div style={{ color:T.muted,fontSize:13,lineHeight:1.6,marginBottom:12 }}>{detailEx.desc}</div>}
            <div style={{ color:T.muted,fontSize:12 }}>Vybavení: <span style={{ color:T.accent,fontWeight:600 }}>{detailEx.equipment}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:600,display:"flex",alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard,borderRadius:"16px 16px 0 0",width:"100%",maxHeight:"70vh",display:"flex",flexDirection:"column" }}>
        <div style={{ padding:"14px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.borderDim}`,flexShrink:0 }}>
          <div>
            <div style={{ color:T.muted,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase" }}>Skupina</div>
            <div style={{ color:T.white,fontWeight:800,fontSize:15 }}>📂 {groupName}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:7,color:T.muted,fontSize:15,cursor:"pointer",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>✕</button>
        </div>
        <div style={{ overflowY:"auto",padding:"10px 12px 28px" }}>
          {grpExercises.length===0&&<div style={{ color:T.muted,fontSize:13,textAlign:"center",padding:"20px 0" }}>Ve skupině zatím nejsou žádné cviky.</div>}
          {grpExercises.map(ex=>{
            const p=PARTIE[ex.partie]||{color:T.accent};
            return (
              <div key={ex.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:9,marginBottom:6,background:T.bg,border:`1px solid ${T.borderDim}` }}>
                <span style={{ width:4,height:36,borderRadius:2,background:p.color,flexShrink:0,display:"inline-block" }}/>
                <div style={{ flex:1,cursor:"pointer" }} onClick={()=>setDetailEx(ex)}>
                  <div style={{ color:T.white,fontSize:13,fontWeight:600 }}>{ex.name}</div>
                  <div style={{ color:T.muted,fontSize:10,marginTop:1 }}>{ex.equipment}</div>
                </div>
                <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                  {onSwapEx&&<button onClick={()=>{ onSwapEx(ex); onClose(); }} style={{ background:T.accentBtn+"22",border:`1px solid ${T.accent}44`,borderRadius:6,color:T.accent,fontSize:10,fontWeight:700,cursor:"pointer",padding:"3px 8px",fontFamily:"inherit" }}>Vyměnit</button>}
                  <button onClick={()=>setDetailEx(ex)} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:5,color:T.muted,fontSize:11,cursor:"pointer",padding:"3px 6px" }}>📖</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── NOTE BUBBLE ─────────────────────────────────────────────────────────────
function NoteBubble({ note, onSave, onClose }) {
  const [val, setVal] = useState(note||"");
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:700,display:"flex",alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard,borderRadius:"14px 14px 0 0",width:"100%",padding:"16px 16px 28px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
          <span style={{ color:T.white,fontWeight:700,fontSize:14 }}>📝 Poznámka</span>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:7,color:T.muted,fontSize:14,cursor:"pointer",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>
        <textarea value={val} onChange={e=>setVal(e.target.value)} rows={3}
          placeholder="Např. sedátko 5, opěrka 3, závaží 2. sloupec..."
          style={{ width:"100%",boxSizing:"border-box",background:T.bg,border:`1px solid ${T.borderDim}`,borderRadius:9,color:T.white,fontSize:13,padding:"10px 12px",outline:"none",resize:"none",fontFamily:"inherit" }}/>
        <div style={{ display:"flex",gap:8,marginTop:10 }}>
          <Btn small variant="ghost" style={{ flex:1 }} onClick={onClose}>Zrušit</Btn>
          <Btn small style={{ flex:1 }} onClick={()=>{ onSave(val); onClose(); }}>Uložit</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── EXERCISE NAME CELL ──────────────────────────────────────────────────────
function ExNameCell({ ex, onOpenDetail, exercises, groups, note, onSaveNote, onSwapEx }) {
  const p = PARTIE[ex.partie] || { color:T.accent };
  const timerRef  = useRef(null);
  const [pressing, setPressing] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [showNote,  setShowNote]  = useState(false);

  const fullEx  = exercises?.find(e=>e.id===ex.refId||e.name===ex.name);
  const groupId = ex.refType==="group" ? ex.refId : (fullEx?.groupId||ex.groupId||null);
  const group   = groups?.find(g=>g.id===groupId);
  const isGroup = ex.refType==="group";

  function startPress() {
    setPressing(true);
    timerRef.current = setTimeout(() => {
      setPressing(false);
      if (groupId) setShowGroup(true);
      else if (!isGroup) onOpenDetail(ex);
    }, 600);
  }
  function cancelPress() { setPressing(false); clearTimeout(timerRef.current); }

  return (
    <>
      {showGroup && groupId && (
        <GroupPickerModal groupId={groupId} groupName={group?.label||ex.name} exercises={exercises||[]} groups={groups||[]} onSwapEx={onSwapEx||null} onClose={()=>setShowGroup(false)}/>
      )}
      {showNote && <NoteBubble note={note} onSave={onSaveNote||(() =>{})} onClose={()=>setShowNote(false)}/>}
      <td onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress} onTouchStart={startPress} onTouchEnd={cancelPress}
        style={{ padding:0, minWidth:175, cursor:"pointer", userSelect:"none", background:T.bgRow }}>
        <div style={{ border:`1.5px solid ${p.color}`, borderRadius:5, margin:"4px 6px", padding:"4px 6px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:4, background:pressing?p.color+"18":"rgba(0,0,0,0.2)", transition:"background 0.15s", boxShadow:`0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 ${p.color}18` }}>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:4 }}>
              {isGroup&&<span style={{ fontSize:9,flexShrink:0 }}>📂</span>}
              <span style={{ color:T.white, fontSize:12.5, fontWeight:600, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ex.name}</span>
            </div>
            {note&&<div style={{ color:T.accent,fontSize:9,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{note}</div>}
          </div>
          <div style={{ display:"flex",gap:3,flexShrink:0 }}>
            <button onClick={e=>{ e.stopPropagation(); setShowNote(true); }} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:4,color:note?T.accent:T.muted,fontSize:10,cursor:"pointer",padding:"2px 4px",lineHeight:1 }} title="Poznámka">📝</button>
            {!isGroup&&<button onClick={e=>{ e.stopPropagation(); onOpenDetail(ex); }} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:4,color:T.muted,fontSize:10,cursor:"pointer",padding:"2px 4px",lineHeight:1,fontWeight:700 }} title="Detail cviku">📖</button>}
          </div>
        </div>
      </td>
    </>
  );
}

// ─── TABLE ───────────────────────────────────────────────────────────────────
const thStyle = { padding:"7px 8px", color:T.muted, fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", textAlign:"center", borderBottom:`1px solid rgba(255,255,255,0.07)`, background:`#1e1e1e` };
const cellStyle = { background:`#161616`, borderBottom:`1px solid rgba(255,255,255,0.04)`, padding:"0 6px", textAlign:"center" };

function THead({ isSilove }) {
  return (
    <thead><tr>
      <th style={{ ...thStyle, textAlign:"left", paddingLeft:12 }}>Cvik</th>
      <th style={{ ...thStyle, width:72 }}>Váha</th>
      {isSilove ? (
        <>
          <th style={{ ...thStyle, width:100 }}>Opakování</th>
          <th style={{ ...thStyle, width:72 }}>Cíl</th>
        </>
      ) : (
        <>
          <th style={{ ...thStyle, width:44 }}>Série</th>
          <th style={{ ...thStyle, width:100 }}>Opakování</th>
        </>
      )}
    </tr></thead>
  );
}

function WeightInput({ value, onChange }) {
  return (
    <td style={cellStyle}>
      <input value={value} onChange={onChange} style={{ width:58, background:"transparent", border:`1px solid ${T.borderDim}`, borderRadius:6, color:T.white, fontSize:13, fontWeight:700, textAlign:"center", padding:"5px 3px", outline:"none", fontFamily:"'JetBrains Mono',monospace", margin:"4px 0" }}/>
    </td>
  );
}

// ─── DUAL EXERCISE CELL ──────────────────────────────────────────────────────
function DualExCell({ ex, onOpenDetail, exercises, groups, note, noteB, onSaveNote, onSaveNoteB, onSwapEx }) {
  const [showNoteA, setShowNoteA] = useState(false);
  const [showNoteB, setShowNoteB] = useState(false);
  const hasB = !!ex.nameB;
  const pA = PARTIE[ex.partie]||{color:T.accent};

  if (!hasB) return (
    <ExNameCell ex={ex} onOpenDetail={onOpenDetail} exercises={exercises} groups={groups} note={note} onSaveNote={onSaveNote} onSwapEx={onSwapEx}/>
  );

  const exB = { name:ex.nameB, partie:ex.partieB||ex.partie, refType:ex.refTypeB, refId:ex.refIdB };
  return (
    <td style={{ padding:0, minWidth:175, background:T.bgRow }}>
      {showNoteA&&<NoteBubble note={note} onSave={v=>{onSaveNote&&onSaveNote(v);}} onClose={()=>setShowNoteA(false)}/>}
      {showNoteB&&<NoteBubble note={noteB} onSave={v=>{onSaveNoteB&&onSaveNoteB(v);}} onClose={()=>setShowNoteB(false)}/>}
      <div style={{ border:`1.5px solid ${pA.color}`, borderRadius:5, margin:"4px 6px", padding:"4px 6px" }}>
        {/* Cvik A */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:4 }}>
          <span style={{ color:T.white,fontSize:12,fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
            {ex.refType==="group"&&<span style={{ fontSize:9,marginRight:3 }}>📂</span>}{ex.name}
          </span>
          <div style={{ display:"flex",gap:2,flexShrink:0 }}>
            <button onClick={e=>{e.stopPropagation();setShowNoteA(true);}} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:4,color:note?T.accent:T.muted,fontSize:9,cursor:"pointer",padding:"1px 3px" }}>📝</button>
            {ex.refType!=="group"&&<button onClick={e=>{e.stopPropagation();onOpenDetail(ex);}} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:4,color:T.muted,fontSize:9,cursor:"pointer",padding:"1px 3px" }}>📖</button>}
          </div>
        </div>
        {note&&<div style={{ color:T.accent,fontSize:9,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{note}</div>}
        {/* Divider */}
        <div style={{ display:"flex",alignItems:"center",gap:6,margin:"3px 0" }}>
          <div style={{ flex:1,height:1,background:T.borderDim }}/><span style={{ color:T.muted,fontSize:9,fontWeight:700 }}>nebo</span><div style={{ flex:1,height:1,background:T.borderDim }}/>
        </div>
        {/* Cvik B */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:4 }}>
          <span style={{ color:T.white,fontSize:12,fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
            {ex.refTypeB==="group"&&<span style={{ fontSize:9,marginRight:3 }}>📂</span>}{ex.nameB}
          </span>
          <div style={{ display:"flex",gap:2,flexShrink:0 }}>
            <button onClick={e=>{e.stopPropagation();setShowNoteB(true);}} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:4,color:noteB?T.accent:T.muted,fontSize:9,cursor:"pointer",padding:"1px 3px" }}>📝</button>
            {ex.refTypeB!=="group"&&<button onClick={e=>{e.stopPropagation();onOpenDetail(exB);}} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:4,color:T.muted,fontSize:9,cursor:"pointer",padding:"1px 3px" }}>📖</button>}
          </div>
        </div>
        {noteB&&<div style={{ color:T.accent,fontSize:9,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{noteB}</div>}
      </div>
    </td>
  );
}

function SiloveRow({ ex, weekIdx, wd={}, onChange, onOpenDetail, exercises, groups, onSwapEx }) {
  const weight = wd.weight ?? ex.vaha;
  const reps = wd.reps ?? null;

  // Vypočítej předvyplněná opakování pro daný týden
  function getPlaceholderReps() {
    const baseReps = (ex.rep || "").split(",").map(r => parseInt(r.trim())).filter(n => !isNaN(n));
    if (baseReps.length === 0) return ex.rep || "";
    if (weekIdx === 0) return ex.rep || "";
    // Varianta B: začíná na více sériích (3,3,3,3,3) — každý týden -1 série až na 3, pak +1 opakování
    const baseSerie = baseReps.length; // počet sérií = počet čísel v rep
    if (baseSerie > 3) {
      const targetSerie = Math.max(3, baseSerie - weekIdx);
      const baseRep = baseReps[0];
      const addedReps = Math.max(0, weekIdx - (baseSerie - 3));
      return Array(targetSerie).fill(baseRep + addedReps).join(",");
    }
    // Varianta A: standardní +1/týden
    return baseReps.map(r => r + weekIdx).join(",");
  }

  const placeholderReps = getPlaceholderReps();
  const isWeek0 = weekIdx === 0;

  return (
    <tr>
      <DualExCell ex={ex} onOpenDetail={onOpenDetail} exercises={exercises} groups={groups}
        note={wd.note} noteB={wd.noteB}
        onSaveNote={v=>onChange(ex.id,"note",v,weekIdx)}
        onSaveNoteB={v=>onChange(ex.id,"noteB",v,weekIdx)}
        onSwapEx={onSwapEx}/>
      <WeightInput value={weight} onChange={e=>onChange(ex.id,"weight",e.target.value,weekIdx)}/>
      <td style={cellStyle}>
        {isWeek0 ? (
          // První týden — tyrkysová, needitovatelné
          <div style={{ width:88, fontSize:12, fontWeight:700, textAlign:"center", padding:"5px 3px",
            color:T.accent, fontFamily:"'JetBrains Mono',monospace", margin:"4px 0" }}>
            {ex.rep}
          </div>
        ) : (
          <input value={reps ?? ""} onChange={e=>onChange(ex.id,"reps",e.target.value,weekIdx)}
            placeholder={placeholderReps}
            style={{ width:88, background:"transparent",
              border:`1px solid ${reps ? T.accent+"66" : T.borderDim}`,
              borderRadius:6, color: reps ? T.accent : "#444",
              fontSize:12, fontWeight:600, textAlign:"center", padding:"5px 3px",
              outline:"none", fontFamily:"'JetBrains Mono',monospace", margin:"4px 0" }}/>
        )}
      </td>
      <td style={{ ...cellStyle, color: ex.cil ? "#184b5e" : "#333", fontSize:11 }}>
        {ex.cil || ""}
      </td>
    </tr>
  );
}

function HypertrofieRow({ ex, weekIdx, wd={}, onChange, onOpenDetail, exercises, groups, onSwapEx }) {
  const weight = wd.weight ?? ex.vaha;
  return (
    <tr>
      <DualExCell ex={ex} onOpenDetail={onOpenDetail} exercises={exercises} groups={groups}
        note={wd.note} noteB={wd.noteB}
        onSaveNote={v=>onChange(ex.id,"note",v,weekIdx)}
        onSaveNoteB={v=>onChange(ex.id,"noteB",v,weekIdx)}
        onSwapEx={onSwapEx}/>
      <WeightInput value={weight} onChange={e=>onChange(ex.id,"weight",e.target.value,weekIdx)}/>
      <td style={{ ...cellStyle, color:T.muted, fontSize:11 }}>{ex.serie}</td>
      <td style={{ ...cellStyle, color:T.muted, fontSize:11 }}>{ex.rep}</td>
    </tr>
  );
}

// ─── SECTION ROW ─────────────────────────────────────────────────────────────
function SectionRow({ label, timerSeconds }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px 5px", background:`linear-gradient(90deg, rgba(46,159,175,0.08) 0%, rgba(26,26,26,0.9) 100%)`, borderBottom:`1px solid rgba(46,159,175,0.1)` }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ width:7, height:7, borderRadius:2, background:T.accentBtn, display:"inline-block", flexShrink:0, boxShadow:`0 0 6px ${T.accent}88` }}/>
        <span style={{ color:T.accent, fontSize:10, fontWeight:800, letterSpacing:2, textTransform:"uppercase" }}>{label}</span>
      </div>
      <RestTimer seconds={timerSeconds}/>
    </div>
  );
}

// ─── TRAINING BLOCK ──────────────────────────────────────────────────────────
function TrainingBlock({ block, weekIdx, data, onChange, onOpenDetail, exercises, groups, blockIndex, onSwapEx, initialOpen, onToggle }) {
  const [open, setOpen] = useState(initialOpen);
  const hasSilove = (block.silove||[]).length > 0;
  const hasHyper  = (block.hypertrofie||[]).length > 0;
  return (
    <div style={{ border:`1.5px solid ${T.blockBorder}`, borderRadius:13, marginBottom:14, overflow:"hidden", boxShadow:`0 0 18px rgba(24,75,94,0.18), 0 6px 24px rgba(0,0,0,0.6)` }}>
      <div onClick={() => { setOpen(o => { const next = !o; onToggle(next); return next; }); }} style={{ padding:"11px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", background:`#1a1a1a`, borderBottom:open?`1px solid rgba(255,255,255,0.06)`:"none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <span style={{ width:30, height:30, background:T.accentBtn, color:"#fff", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14, flexShrink:0 }}>{blockIndex + 1}</span>
          <div>
            <div style={{ color:T.white, fontWeight:700, fontSize:14 }}>{block.label}</div>
            <div style={{ color:T.muted, fontSize:11, marginTop:1 }}>{block.day}</div>
          </div>
        </div>
        <span style={{ color:T.muted, fontSize:12, transform:open?"rotate(180deg)":"none", transition:"0.2s" }}>▼</span>
      </div>
      {open && (
        <div style={{ overflowX:"auto" }}>
          {hasSilove && <>
            <SectionRow label="Silové cviky" timerSeconds={180}/>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:420 }}><THead isSilove={true}/><tbody>
              {block.silove.map(ex => <SiloveRow key={ex.id} ex={ex} weekIdx={weekIdx} wd={data[ex.id]} onChange={onChange} onOpenDetail={onOpenDetail} exercises={exercises} groups={groups} onSwapEx={onSwapEx ? (newEx)=>onSwapEx(block.id,"silove",ex.id,newEx) : null}/>)}
            </tbody></table>
            {hasHyper && <div style={{ height:1, background:`linear-gradient(90deg,transparent,${T.accent}44,transparent)`, margin:"4px 12px" }}/>}
          </>}
          {hasHyper && <>
            <SectionRow label="Hypertrofie" timerSeconds={90}/>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:420 }}><THead isSilove={false}/><tbody>
              {block.hypertrofie.map(ex => <HypertrofieRow key={ex.id} ex={ex} weekIdx={weekIdx} wd={data[ex.id]} onChange={onChange} onOpenDetail={onOpenDetail} exercises={exercises} groups={groups} onSwapEx={onSwapEx ? (newEx)=>onSwapEx(block.id,"hypertrofie",ex.id,newEx) : null}/>)}
            </tbody></table>
          </>}
          <div style={{ height:8 }}/>
        </div>
      )}
    </div>
  );
}

// ─── EXERCISE DETAIL MODAL ───────────────────────────────────────────────────
function ExDetailModal({ ex, exercises, onClose }) {
  const full = exercises.find(e => e.name.toLowerCase()===ex.name.toLowerCase() || e.name.toLowerCase().includes(ex.name.toLowerCase().split(" ")[0]));
  const p = PARTIE[ex.partie] || { color:T.accent };
  const isYT = full?.mediaUrl && full.mediaUrl.includes("youtube");
  const isImg = full?.mediaUrl && !isYT;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:500, display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard, borderRadius:"16px 16px 0 0", width:"100%", maxHeight:"78vh", overflowY:"auto" }}>
        <div style={{ background:T.bgCard2, padding:"18px 20px 14px", borderBottom:`3px solid ${p.color}`, borderRadius:"16px 16px 0 0", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"rgba(255,255,255,0.08)", border:"none", borderRadius:7, color:T.muted, fontSize:15, cursor:"pointer", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>✕</button>
          <div style={{ color:p.color, fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>{PARTIE[ex.partie]?.label||ex.partie}</div>
          <div style={{ color:T.white, fontWeight:800, fontSize:19 }}>{ex.name}</div>
        </div>
        <div style={{ padding:"16px 20px 28px" }}>
          <div style={{ minHeight:130, background:T.bg, borderRadius:10, border:`1px solid ${T.borderDim}`, overflow:"hidden", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {isYT ? <iframe src={full.mediaUrl.replace("watch?v=","embed/").replace("youtu.be/","www.youtube.com/embed/")} style={{ width:"100%",height:200,border:"none" }} allowFullScreen title="video"/>
             : isImg ? <img src={full.mediaUrl} alt={ex.name} style={{ width:"100%",maxHeight:200,objectFit:"cover" }}/>
             : <div style={{ textAlign:"center" }}><div style={{ fontSize:32 }}>💪</div><div style={{ color:T.muted, fontSize:11, marginTop:5 }}>Foto / video nebylo přidáno</div></div>}
          </div>
          {full ? <>
            <div style={{ color:T.muted, fontSize:13, lineHeight:1.65, marginBottom:14 }}>{full.desc}</div>
            <div style={{ color:T.muted, fontSize:12 }}>Vybavení: <span style={{ color:T.accent, fontWeight:600 }}>{full.equipment}</span></div>
          </> : <div style={{ color:T.muted, fontSize:13, textAlign:"center", padding:"16px 0" }}>Popis zatím není v zásobníku.</div>}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: AKTUÁLNÍ TRÉNINK ─────────────────────────────────────────────────
function WorkoutScreen({ activeInstance, onActivate, library, setLibrary, exercises, groups, exData, setExData, setSuggestedPlans }) {
  const [weekIdx, setWeekIdx]          = useState(0);
  const [completedWeeks, setCompleted] = useState([]);
  const [detailEx, setDetailEx]        = useState(null);

  useEffect(() => {
    async function loadProgress() {
      if (!activeInstance?.progressId) return;
      const { data } = await supabase.from('user_progress')
        .select('completed_weeks, ex_data')
        .eq('id', activeInstance.progressId)
        .single();
      if (data?.completed_weeks) {
        setCompleted(data.completed_weeks);
        // Najdi první neoznačený týden
        const tmpl = library.find(t => t.id === activeInstance.templateId);
        const totalWeeks = tmpl?.weeks || 6;
        const allWeeks = Array.from({ length: totalWeeks }, (_, i) => i);
        const firstUncompleted = allWeeks.find(w => !data.completed_weeks.includes(w));
        // Pokud jsou všechny označené, zůstaň na posledním
        setWeekIdx(firstUncompleted !== undefined ? firstUncompleted : totalWeeks - 1);
      }
      if (data?.ex_data && Object.keys(data.ex_data).length > 0) setExData(data.ex_data);
      // Aplikuj uložené výměny cviků
      if (data?.ex_data) {
      const swaps = Object.entries(data.ex_data).filter(([k]) => k.startsWith('swap_'));
      if (swaps.length > 0) {
      setLibrary(prev => prev.map(tmpl => {
      if (tmpl.id !== activeInstance.templateId) return tmpl;
      return {
        ...tmpl,
        blocks: tmpl.blocks.map(block => ({
          ...block,
          silove: (block.silove || []).map(ex => {
            const swap = data.ex_data[`swap_${block.id}_silove_${ex.id}`];
            return swap ? { ...ex, ...swap } : ex;
          }),
          hypertrofie: (block.hypertrofie || []).map(ex => {
            const swap = data.ex_data[`swap_${block.id}_hypertrofie_${ex.id}`];
            return swap ? { ...ex, ...swap } : ex;
          }),
        }))
      };
    }));
  }
}
    }
    loadProgress();
  }, [activeInstance?.progressId]);

function handleChange(exId, field, val, wIdx) {
  setExData(prev => {
    const u = {...prev};
    if (field==="weight") {
      for(let w=wIdx;w<6;w++) u[`${w}_${exId}`]={...(u[`${w}_${exId}`]||{}),weight:val};
    } else if (field==="note") {
      for(let w=0;w<6;w++) u[`${w}_${exId}`]={...(u[`${w}_${exId}`]||{}),note:val};
    } else if (field==="noteB") {
      for(let w=0;w<6;w++) u[`${w}_${exId}`]={...(u[`${w}_${exId}`]||{}),noteB:val};
    } else if (field==="blockOpen") {
      u[`block_open_${exId}`] = val;
    } else {
      u[`${wIdx}_${exId}`]={...(u[`${wIdx}_${exId}`]||{}),reps:val};
    }
    if (activeInstance?.progressId) {
      supabase.from('user_progress').update({ ex_data: u }).eq('id', activeInstance.progressId)
        .then(({ error }) => console.log("exData save:", error, "progressId:", activeInstance.progressId));
    }
    return u;
  });
}

  // Vymění cvik v tréninkovém bloku (klient si může vybrat jiný ze skupiny)
  function handleSwap(blockId, section, oldExId, newEx) {
    // Ulož výměnu do exData
    const swapKey = `swap_${blockId}_${section}_${oldExId}`;
    setExData(prev => {
      const u = { ...prev, [swapKey]: { name: newEx.name, partie: newEx.partie, refType: "exercise", refId: newEx.id } };
  // Smaž poznámky pro starý cvik ve všech týdnech
    for (let w = 0; w < 6; w++) {
    if (u[`${w}_${oldExId}`]) {
    u[`${w}_${oldExId}`] = { ...u[`${w}_${oldExId}`], note: undefined, noteB: undefined };
  }
}
      if (activeInstance?.progressId) {
        supabase.from('user_progress').update({ ex_data: u }).eq('id', activeInstance.progressId)
          .then(({ error }) => console.log("swap save:", error));
      }
      return u;
    });
    // Aktualizuj lokální library
    setLibrary(prev => prev.map(tmpl => {
      if (tmpl.id !== activeInstance.templateId) return tmpl;
      return {
        ...tmpl,
        blocks: tmpl.blocks.map(block => {
          if (block.id !== blockId) return block;
          return {
            ...block,
            [section]: block[section].map(ex => {
              if (ex.id !== oldExId) return ex;
              return { ...ex, name: newEx.name, partie: newEx.partie, refType: "exercise", refId: newEx.id };
            })
          };
        })
      };
    }));
  }

  if (!activeInstance) return (
    <div style={{ padding:"22px 18px", paddingBottom:90 }}>
      <PageHeader label="Trénink" title="Aktuální trénink"/>
      <div style={{ marginTop:48, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:14 }}>🏋️</div>
        <div style={{ color:T.white, fontSize:15, marginBottom:6 }}>Nemáš žádný aktivní trénink</div>
        <div style={{ color:T.muted, fontSize:12, marginBottom:24 }}>Přejdi do Plánů a vyber si trénink</div>
        <Btn onClick={() => onActivate("goto-library")} variant="secondary">Přejít do Plánů</Btn>
      </div>
    </div>
  );

  const tmpl = library.find(t=>t.id===activeInstance.templateId)||library[0];
  if (!tmpl) return null;
  const currentData = Object.fromEntries(Object.entries(exData).filter(([k])=>k.startsWith(`${weekIdx}_`)).map(([k,v])=>[k.replace(`${weekIdx}_`,""),v]));

  return (
    <div style={{ paddingBottom:90 }}>
      {detailEx && <ExDetailModal ex={detailEx} exercises={exercises} onClose={()=>setDetailEx(null)}/>}
      <div style={{ padding:"20px 18px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ color:T.accent, fontSize:9, letterSpacing:2.5, textTransform:"uppercase", marginBottom:5, fontWeight:700, opacity:0.8 }}>Aktivní trénink</div>
          <div style={{ color:T.white, fontWeight:700, fontSize:20, lineHeight:1.2, maxWidth:220 }}>{tmpl.name}</div>
        </div>
        <button onClick={async () => {
        const newCompleted = completedWeeks.includes(weekIdx)
        ? completedWeeks.filter(w=>w!==weekIdx)
        : [...completedWeeks, weekIdx];
        setCompleted(newCompleted);
        if (activeInstance?.progressId) {
        await supabase.from('user_progress').update({ completed_weeks: newCompleted }).eq('id', activeInstance.progressId);
        }
        if (newCompleted.length >= tmpl.weeks) {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from('plan_assignments')
            .update({ completed: true })
            .eq('plan_id', tmpl.id)
            .eq('client_id', user.id);
             setSuggestedPlans(prev => ({
            ...prev,
            assignedPlanIds: (prev.assignedPlanIds || []).filter(id => id !== tmpl.id)
          }));
        }
        }} style={{ background:completedWeeks.includes(weekIdx)?T.accentBtn:"transparent", border:`1.5px solid ${T.accent}`, color:completedWeeks.includes(weekIdx)?"#fff":T.accent, borderRadius:9, padding:"7px 13px", fontWeight:700, fontSize:12, cursor:"pointer", flexShrink:0, marginLeft:10, fontFamily:"inherit" }}>{completedWeeks.includes(weekIdx)?"✓ Splněno":"Označit týden"}</button>
      </div>
      <div style={{ display:"flex", gap:5, padding:"14px 18px 12px", overflowX:"auto" }}>
        {WEEKS.slice(0,tmpl.weeks).map((w,i) => {
          const done=completedWeeks.includes(i), active=weekIdx===i;
          return <button key={i} onClick={()=>setWeekIdx(i)} style={{ background:active?T.accentBtn:done?"rgba(46,159,175,0.12)":T.bgCard, color:active?"#fff":done?T.accent:T.muted, border:`1px solid ${active?T.accent:done?T.accent+"55":T.borderDim}`, borderRadius:8, padding:"5px 12px", fontSize:10, fontWeight:700, whiteSpace:"nowrap", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontFamily:"inherit" }}>
            {done&&!active&&<span style={{fontSize:9}}>✓</span>}{w}
          </button>;
        })}
      </div>
      <div style={{ padding:"0 12px" }}>
      {tmpl.blocks.map((block, bi) => <TrainingBlock key={block.id} block={block} blockIndex={bi} weekIdx={weekIdx} data={currentData} onChange={handleChange} onOpenDetail={setDetailEx} exercises={exercises} groups={groups} onSwapEx={handleSwap} initialOpen={!exData._initialized 
      ? exData[`block_open_${block.id}`] !== false 
      : false} onToggle={(isOpen) => handleChange(`block_open_${block.id}`, "blockOpen", isOpen, weekIdx)}/>)}
      </div>
      <div style={{ padding:"6px 18px 0", color:T.muted, fontSize:10, textAlign:"center" }}>💡 📖 detail · 📝 poznámka · Podržením názvu = cviky skupiny</div>
    </div>
  );
}

// ─── SCREEN: CVIKY ───────────────────────────────────────────────────────────
function ExercisesScreen({ exercises, setExercises, isTrainer, groups, setGroups }) {
  const [search, setSearch]       = useState("");
  const [partieFilter, setPartie] = useState(null);
  const [groupFilters, setGF]     = useState({});
  const [selected, setSelected]   = useState(null);
  const [editEx, setEditEx]       = useState(null);
  const [adding, setAdding]       = useState(false);
  const [managingGroups, setMG]   = useState(null);
  const [newGroupLabel, setNGL]   = useState("");

  const EMPTY_FORM = { name:"", partie:"prsa", groupId:"", equipment:"", desc:"", mediaUrl:"" };
  const [form, setForm] = useState(EMPTY_FORM);

  const partiesVisible = partieFilter ? [partieFilter] : Object.keys(PARTIE);

  function setGroupFilter(partieKey, groupId) {
    setGF(prev => ({ ...prev, [partieKey]: groupId === prev[partieKey] ? null : groupId }));
  }

  async function saveExercise() {
    if (!form.name.trim()) return;
    if (editEx) {
      const { error } = await supabase.from('exercises').update({
        name: form.name, partie: form.partie, group_id: form.groupId,
        equipment: form.equipment, description: form.desc, media_url: form.mediaUrl
      }).eq('id', editEx.id);
      console.log("UPDATE result:", error);
      setExercises(prev => prev.map(e => e.id === editEx.id ? {
        ...e,
        name: form.name,
        partie: form.partie,
        group_id: form.groupId,
        groupId: form.groupId,
        equipment: form.equipment,
        description: form.desc,
        desc: form.desc,
        media_url: form.mediaUrl,
        mediaUrl: form.mediaUrl
      } : e));
      setEditEx(null);
    } else {
      const newEx = { id:"e"+Date.now(), created_by: (await supabase.auth.getUser()).data.user.id,
        name: form.name, partie: form.partie, group_id: form.groupId,
        equipment: form.equipment, description: form.desc, media_url: form.mediaUrl };
      await supabase.from('exercises').insert([newEx]);
      setExercises(prev => [...prev, { ...newEx, groupId: form.groupId, desc: form.desc, mediaUrl: form.mediaUrl }]);
      setAdding(false);
    }
    setForm(EMPTY_FORM);
  }

  async function deleteExercise(id) { 
    await supabase.from('exercises').delete().eq('id', id);
    setExercises(prev => prev.filter(e => e.id !== id)); 
    setSelected(null); 
  }
  function addGroup(partieKey) { if (!newGroupLabel.trim()) return; setGroups(prev => [...prev, { id:"g"+Date.now(), partie:partieKey, label:newGroupLabel.trim() }]); setNGL(""); }
  function deleteGroup(groupId) { setGroups(prev => prev.filter(g => g.id !== groupId)); }

  if (adding || editEx) {
    const isEdit = !!editEx;
    const p = PARTIE[form.partie] || { color:T.accent };
    const availGroups = groups.filter(g => g.partie === form.partie);
    return (
      <div style={{ paddingBottom:90 }}>
        <div style={{ padding:"18px 18px 0", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>{ setAdding(false); setEditEx(null); setForm(EMPTY_FORM); }} style={{ background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>← Zpět</button>
        </div>
        <div style={{ padding:"14px 18px 0", color:T.white, fontWeight:800, fontSize:18, marginBottom:4 }}>{isEdit ? "Upravit cvik" : "Nový cvik"}</div>
        <div style={{ padding:"10px 18px 0" }}>
          <FieldLabel>Název cviku</FieldLabel>
          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="např. Biceps zdvihy JC v sedě" style={inputStyle}/>
          <FieldLabel>Partie</FieldLabel>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
            {Object.entries(PARTIE).map(([key,pp]) => (
              <button key={key} onClick={()=>setForm(f=>({...f,partie:key,groupId:""}))} style={{ display:"flex", alignItems:"center", gap:5, background:form.partie===key?pp.color+"33":T.bgCard, border:`1.5px solid ${form.partie===key?pp.color:T.borderDim}`, borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                <span style={{ width:7,height:7,borderRadius:2,background:pp.color,display:"inline-block" }}/>
                <span style={{ color:form.partie===key?pp.color:T.muted }}>{pp.label}</span>
              </button>
            ))}
          </div>
          <FieldLabel>Skupina (silová křivka)</FieldLabel>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
            {availGroups.length===0&&<div style={{ color:T.muted, fontSize:11 }}>Pro tuto partii zatím nejsou skupiny.</div>}
            {availGroups.map(g => (
              <button key={g.id} onClick={()=>setForm(f=>({...f,groupId:g.id}))} style={{ background:form.groupId===g.id?p.color+"22":T.bgCard, border:`1.5px solid ${form.groupId===g.id?p.color:T.borderDim}`, borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", color:form.groupId===g.id?p.color:T.muted }}>{g.label}</button>
            ))}
          </div>
          <FieldLabel>Vybavení</FieldLabel>
          <input value={form.equipment} onChange={e=>setForm(f=>({...f,equipment:e.target.value}))} placeholder="např. Osa / Stroj" style={inputStyle}/>
          <FieldLabel>Popis / technika</FieldLabel>
          <textarea value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} rows={3} placeholder="Popis provedení cviku..." style={{ ...inputStyle, resize:"vertical" }}/>
          <FieldLabel>Foto / Video URL</FieldLabel>
          <input value={form.mediaUrl} onChange={e=>setForm(f=>({...f,mediaUrl:e.target.value}))} placeholder="https://youtube.com/..." style={inputStyle}/>
          <div style={{ display:"flex", gap:8, marginTop:6 }}>
            {isEdit&&<Btn variant="danger" style={{ flex:1 }} onClick={()=>{ deleteExercise(editEx.id); setEditEx(null); setForm(EMPTY_FORM); }}>Smazat cvik</Btn>}
            <Btn full={!isEdit} style={{ flex:isEdit?1:undefined }} onClick={saveExercise}>{isEdit?"Uložit změny":"Uložit cvik"}</Btn>
          </div>
        </div>
      </div>
    );
  }

  if (managingGroups) {
    const p = PARTIE[managingGroups];
    const gList = groups.filter(g => g.partie === managingGroups);
    return (
      <div style={{ paddingBottom:90 }}>
        <div style={{ padding:"18px 18px 0" }}>
          <button onClick={()=>{ setMG(null); setNGL(""); }} style={{ background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>← Zpět</button>
        </div>
        <div style={{ padding:"10px 18px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18 }}>
            <span style={{ width:10,height:10,borderRadius:3,background:p.color,display:"inline-block" }}/>
            <div style={{ color:T.white, fontWeight:800, fontSize:17 }}>Skupiny – {p.label}</div>
          </div>
          {gList.map(g => (
            <div key={g.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:T.bgCard,border:`1px solid ${T.borderDim}`,borderRadius:9,padding:"11px 14px",marginBottom:8 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <span style={{ width:7,height:7,borderRadius:2,background:p.color,display:"inline-block" }}/>
                <span style={{ color:T.white,fontSize:13,fontWeight:600 }}>{g.label}</span>
              </div>
              <button onClick={()=>deleteGroup(g.id)} style={{ background:"none",border:"none",color:T.danger,cursor:"pointer",fontSize:16,lineHeight:1,fontFamily:"inherit" }}>×</button>
            </div>
          ))}
          {gList.length===0&&<div style={{ color:T.muted,fontSize:12,marginBottom:12 }}>Zatím žádné skupiny.</div>}
          <div style={{ display:"flex",gap:8,marginTop:8 }}>
            <input value={newGroupLabel} onChange={e=>setNGL(e.target.value)} placeholder="Název nové skupiny..." onKeyDown={e=>e.key==="Enter"&&addGroup(managingGroups)} style={{ ...inputStyle, flex:1, margin:0 }}/>
            <Btn onClick={()=>addGroup(managingGroups)}>Přidat</Btn>
          </div>
        </div>
      </div>
    );
  }

  if (selected) {
    const p = PARTIE[selected.partie]||{color:T.accent};
    const group = groups.find(g=>g.id===selected.groupId);
    const isYT = selected.mediaUrl && selected.mediaUrl.includes("youtube");
    const isImg = selected.mediaUrl && !isYT;
    return (
      <div style={{ paddingBottom:90 }}>
        <div style={{ padding:"18px 18px 0", display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <button onClick={()=>setSelected(null)} style={{ background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>← Zpět</button>
          {isTrainer && <button onClick={()=>{ setEditEx(selected); setForm({name:selected.name,partie:selected.partie,groupId:selected.groupId||"",equipment:selected.equipment,desc:selected.desc,mediaUrl:selected.mediaUrl||""}); }} style={{ background:T.bgCard2,border:`1px solid ${T.borderDim}`,color:T.muted,borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>✏️ Upravit</button>}
        </div>
        <Card style={{ margin:"12px 18px" }}>
          <div style={{ background:T.bgCard2,padding:"18px",borderBottom:`3px solid ${p.color}`,borderRadius:"12px 12px 0 0" }}>
            <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
              <span style={{ color:p.color,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase" }}>{PARTIE[selected.partie]?.label}</span>
              {group&&<><span style={{ color:T.muted,fontSize:10 }}>·</span><span style={{ color:T.muted,fontSize:10,fontWeight:600 }}>{group.label}</span></>}
            </div>
            <div style={{ color:T.white,fontWeight:800,fontSize:19 }}>{selected.name}</div>
          </div>
          <div style={{ background:T.bg,borderBottom:`1px solid ${T.borderDim}`,overflow:"hidden",minHeight:140,display:"flex",alignItems:"center",justifyContent:"center" }}>
            {isYT ? <iframe src={selected.mediaUrl.replace("watch?v=","embed/").replace("youtu.be/","www.youtube.com/embed/")} style={{ width:"100%",height:200,border:"none" }} allowFullScreen title="video"/>
             : isImg ? <img src={selected.mediaUrl} alt={selected.name} style={{ width:"100%",maxHeight:200,objectFit:"cover" }}/>
             : <div style={{ textAlign:"center",padding:"28px 0" }}><div style={{ fontSize:36 }}>💪</div><div style={{ color:T.muted,fontSize:11,marginTop:6 }}>Foto / video nebylo přidáno</div></div>}
          </div>
          <div style={{ padding:"16px" }}>
            {selected.desc&&<div style={{ color:T.muted,fontSize:13,lineHeight:1.65,marginBottom:14 }}>{selected.desc}</div>}
            <div style={{ color:T.muted,fontSize:12 }}>Vybavení: <span style={{ color:T.accent,fontWeight:600 }}>{selected.equipment}</span></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom:90 }}>
      <PageHeader label="Databáze" title="Zásobník cviků" action={isTrainer && <Btn small onClick={()=>{ setAdding(true); setForm(EMPTY_FORM); }}>+ Přidat cvik</Btn>}/>
      <div style={{ padding:"14px 18px 10px" }}>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.muted,pointerEvents:"none" }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Hledat cvik..." style={{ width:"100%",boxSizing:"border-box",background:T.bgCard,border:`1px solid ${T.borderDim}`,borderRadius:10,color:T.white,fontSize:13,padding:"10px 14px 10px 36px",outline:"none",fontFamily:"inherit" }}/>
        </div>
      </div>
      <div style={{ display:"flex", gap:6, padding:"0 18px 14px", overflowX:"auto" }}>
        <ChipBtn active={partieFilter===null} color={T.accent} onClick={()=>setPartie(null)}>Vše</ChipBtn>
        {Object.entries(PARTIE).map(([key,p]) => <ChipBtn key={key} active={partieFilter===key} color={p.color} dot onClick={()=>setPartie(partieFilter===key?null:key)}>{p.label}</ChipBtn>)}
      </div>
      <div style={{ padding:"0 12px" }}>
        {partiesVisible.map(partieKey => {
          const p = PARTIE[partieKey];
          const partieExercises = exercises.filter(e => e.partie===partieKey && (!search || e.name.toLowerCase().includes(search.toLowerCase())));
          if (partieExercises.length===0 && search) return null;
          const partieGroups = groups.filter(g => g.partie === partieKey);
          const activeGroup = groupFilters[partieKey] || null;
          const visibleExercises = activeGroup ? partieExercises.filter(e => e.groupId === activeGroup) : partieExercises;
          return (
            <div key={partieKey} style={{ marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ width:3,height:18,borderRadius:2,background:p.color,display:"inline-block" }}/>
                  <span style={{ color:p.color,fontWeight:800,fontSize:13,letterSpacing:0.5,textTransform:"uppercase" }}>{p.label}</span>
                  <span style={{ color:T.muted,fontSize:10 }}>{partieExercises.length} cviků</span>
                </div>
                {isTrainer && <button onClick={()=>setMG(partieKey)} style={{ background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"inherit",display:"flex",alignItems:"center",gap:4 }}><span style={{ fontSize:12 }}>⚙️</span> Skupiny</button>}
              </div>
              {partieGroups.length>0&&(
                <div style={{ display:"flex",gap:5,marginBottom:10,overflowX:"auto",paddingBottom:2 }}>
                  <ChipBtn small active={!activeGroup} color={p.color} onClick={()=>setGroupFilter(partieKey,null)}>Vše</ChipBtn>
                  {partieGroups.map(g => <ChipBtn small key={g.id} active={activeGroup===g.id} color={p.color} onClick={()=>setGroupFilter(partieKey,g.id)}>{g.label}</ChipBtn>)}
                </div>
              )}
              <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                {visibleExercises.length===0&&<div style={{ color:T.muted,fontSize:12,padding:"10px 4px" }}>Žádné cviky v této skupině.</div>}
                {visibleExercises.map(ex => {
                  const grp = groups.find(g=>g.id===ex.groupId);
                  return (
                    <Card key={ex.id} onClick={()=>setSelected(ex)} style={{ display:"flex",alignItems:"stretch",gap:0 }}>
                      <div style={{ width:4,background:p.color,flexShrink:0,borderRadius:"12px 0 0 12px" }}/>
                      <div style={{ padding:"11px 13px",flex:1 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                          <div style={{ color:T.white,fontWeight:700,fontSize:14 }}>{ex.name}</div>
                          {grp&&<span style={{ color:p.color,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,border:`1px solid ${p.color}33`,background:p.color+"12",flexShrink:0,marginLeft:6 }}>{grp.label}</span>}
                        </div>
                        <div style={{ color:T.muted,fontSize:11,marginTop:2 }}>{ex.equipment}</div>
                        {ex.mediaUrl&&<div style={{ marginTop:5 }}><span style={{ color:T.accent,fontSize:10,fontWeight:700 }}>▶ Media</span></div>}
                      </div>
                    </Card>
                  );
                })}
              </div>
              {isTrainer&&<button onClick={()=>{ setAdding(true); setForm({...EMPTY_FORM,partie:partieKey}); }} style={{ width:"100%",marginTop:6,background:"transparent",border:`1.5px dashed ${p.color}33`,color:p.color,borderRadius:9,padding:"9px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:0.7 }}>+ Přidat cvik do {p.label}</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
const inputStyle = { width:"100%", boxSizing:"border-box", background:T.bgCard, border:`1px solid ${T.borderDim}`, borderRadius:9, color:T.white, fontSize:13, padding:"10px 12px", outline:"none", fontFamily:"inherit", marginBottom:14, display:"block" };
function FieldLabel({ children }) { return <div style={{ color:T.muted,fontSize:10,fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1 }}>{children}</div>; }
function ChipBtn({ children, active, color, dot, small, onClick }) {
  return (
    <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:dot?5:0, background:active?color+"28":T.bgCard, border:`1px solid ${active?color:T.borderDim}`, borderRadius:20, padding:small?"3px 9px":"4px 12px", fontSize:small?9:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit", flexShrink:0, color:active?color:T.muted }}>
      {dot&&<span style={{ width:6,height:6,borderRadius:2,background:color,display:"inline-block" }}/>}
      {children}
    </button>
  );
}

// ─── EXERCISE PICKER PANEL ───────────────────────────────────────────────────
function ExPickerPanel({ exercises, groups, onPick, onClose }) {
  const [partieF, setPartieF] = useState(null);
  const [search, setSearch]   = useState("");
  const filteredEx = exercises.filter(e => (!partieF||e.partie===partieF) && (!search||e.name.toLowerCase().includes(search.toLowerCase())));
  const filteredGr = groups.filter(g => (!partieF||g.partie===partieF) && (!search||g.label.toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:600,display:"flex",alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard,borderRadius:"16px 16px 0 0",width:"100%",maxHeight:"80vh",display:"flex",flexDirection:"column" }}>
        <div style={{ padding:"14px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.borderDim}`,flexShrink:0 }}>
          <div style={{ color:T.white,fontWeight:800,fontSize:15 }}>Vybrat cvik nebo skupinu</div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:7,color:T.muted,fontSize:15,cursor:"pointer",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>✕</button>
        </div>
        <div style={{ padding:"10px 14px 6px",flexShrink:0 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Hledat..." style={{ width:"100%",boxSizing:"border-box",background:T.bg,border:`1px solid ${T.borderDim}`,borderRadius:9,color:T.white,fontSize:13,padding:"8px 12px",outline:"none",fontFamily:"inherit" }}/>
        </div>
        <div style={{ display:"flex",gap:5,padding:"4px 14px 8px",overflowX:"auto",flexShrink:0 }}>
          <ChipBtn active={!partieF} color={T.accent} onClick={()=>setPartieF(null)}>Vše</ChipBtn>
          {Object.entries(PARTIE).map(([k,p])=><ChipBtn key={k} active={partieF===k} color={p.color} dot onClick={()=>setPartieF(partieF===k?null:k)}>{p.label}</ChipBtn>)}
        </div>
        <div style={{ overflowY:"auto",padding:"0 10px 24px" }}>
          {filteredEx.length>0&&<>
            <div style={{ color:T.muted,fontSize:9,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",padding:"6px 4px 4px" }}>Cviky</div>
            {filteredEx.map(ex=>{ const p=PARTIE[ex.partie]||{color:T.accent}; const grp=groups.find(g=>g.id===ex.groupId); return (
              <div key={ex.id} onClick={()=>onPick({type:"exercise",id:ex.id,name:ex.name,partie:ex.partie,groupId:ex.groupId})}
                style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 10px",borderRadius:9,cursor:"pointer",marginBottom:4,background:T.bg,border:`1px solid ${T.borderDim}` }}>
                <span style={{ width:4,height:36,borderRadius:2,background:p.color,flexShrink:0,display:"inline-block" }}/>
                <div style={{ flex:1 }}>
                  <div style={{ color:T.white,fontSize:13,fontWeight:600 }}>{ex.name}</div>
                  <div style={{ color:T.muted,fontSize:10,marginTop:1 }}>{p.label}{grp?` · ${grp.label}`:""}{ex.equipment?` · ${ex.equipment}`:""}</div>
                </div>
              </div>
            );})}
          </>}
          {filteredGr.length>0&&<>
            <div style={{ color:T.muted,fontSize:9,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",padding:"8px 4px 4px" }}>Skupiny cviků</div>
            {filteredGr.map(g=>{ const p=PARTIE[g.partie]||{color:T.accent}; const count=exercises.filter(e=>e.groupId===g.id).length; return (
              <div key={g.id} onClick={()=>onPick({type:"group",id:g.id,name:g.label,partie:g.partie})}
                style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 10px",borderRadius:9,cursor:"pointer",marginBottom:4,background:T.bg,border:`1px solid ${T.borderDim}` }}>
                <span style={{ width:8,height:8,borderRadius:2,background:p.color,flexShrink:0,display:"inline-block" }}/>
                <div style={{ flex:1 }}>
                  <div style={{ color:T.white,fontSize:13,fontWeight:600 }}>{g.label}</div>
                  <div style={{ color:T.muted,fontSize:10,marginTop:1 }}>{p.label} · {count} cviků ve skupině</div>
                </div>
                <span style={{ color:T.muted,fontSize:10 }}>📂</span>
              </div>
            );})}
          </>}
          {filteredEx.length===0&&filteredGr.length===0&&<div style={{ textAlign:"center",padding:"24px 0",color:T.muted,fontSize:13 }}>Nic nenalezeno.</div>}
        </div>
      </div>
    </div>
  );
}

// ─── PLAN EDITOR ─────────────────────────────────────────────────────────────
function PlanEditor({ plan, setPlan, exercises, groups, onBack }) {
  const [picker, setPicker] = useState(null);

  function handlePick(item) {
    const { blockId, section, rowIdx, slot } = picker;
    setPlan(prev => {
      const p = JSON.parse(JSON.stringify(prev));
      const row = p.blocks.find(b=>b.id===blockId)[section][rowIdx];
      if (slot==="B") { row.nameB=item.name; row.partieB=item.partie; row.refTypeB=item.type; row.refIdB=item.id; }
      else { row.id=item.id+"_"+Date.now(); row.name=item.name; row.partie=item.partie; row.refType=item.type; row.refId=item.id; }
      return p;
    });
    setPicker(null);
  }

  const SECTION_LABELS = { silove:"Silové cviky", hypertrofie:"Hypertrofie" };
  const SECTION_TIMERS = { silove:"3:00", hypertrofie:"1:30" };

  return (
    <div style={{ paddingBottom:90 }}>
      {picker && <ExPickerPanel exercises={exercises} groups={groups} onPick={handlePick} onClose={()=>setPicker(null)}/>}
      <div style={{ padding:"18px 18px 0",display:"flex",alignItems:"center",gap:10 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>← Zpět</button>
        <div style={{ color:T.muted,fontSize:11 }}>Editace plánu</div>
      </div>
      <div style={{ padding:"10px 18px 4px" }}>
        <div style={{ color:T.white,fontWeight:800,fontSize:17 }}>{plan.name}</div>
        <div style={{ color:T.muted,fontSize:11,marginTop:2 }}>{plan.weeks} týdnů · {plan.blocks.length}× týdně</div>
      </div>
      <div style={{ padding:"10px 12px 0" }}>
        {plan.blocks.map((block,bi) => {
          const sections = block.type==="silovy"?["silove"]:block.type==="hypertrofie"?["hypertrofie"]:["silove","hypertrofie"];
          return (
            <div key={block.id} style={{ border:`1.5px solid ${T.blockBorder}`,borderRadius:13,marginBottom:14,overflow:"hidden" }}>
              <div style={{ padding:"11px 16px",background:T.bgCard,borderBottom:`1px solid ${T.borderDim}`,display:"flex",alignItems:"center",gap:11 }}>
                <span style={{ width:30,height:30,background:T.accentBtn,color:"#fff",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,flexShrink:0 }}>{bi+1}</span>
                <div><div style={{ color:T.white,fontWeight:700,fontSize:14 }}>{block.label}</div><div style={{ color:T.muted,fontSize:11 }}>{block.day}</div></div>
              </div>
              {sections.map(sec => (
                <div key={sec}>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px 4px",background:T.bgCard }}>
                    <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                      <span style={{ width:7,height:7,borderRadius:2,background:T.accentBtn,display:"inline-block" }}/>
                      <span style={{ color:T.accent,fontSize:10,fontWeight:800,letterSpacing:2,textTransform:"uppercase" }}>{SECTION_LABELS[sec]}</span>
                    </div>
                    <span style={{ color:T.accent,fontSize:11,fontWeight:700 }}>⏱ {SECTION_TIMERS[sec]}</span>
                  </div>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%",borderCollapse:"collapse",minWidth:360 }}>
                      <thead><tr>
                        <th style={{ ...thStyle,textAlign:"left",paddingLeft:12 }}>Cvik / Skupina</th>
                        {sec==="silove" ? <th style={{ ...thStyle,width:90 }}>Opak.</th> : <><th style={{ ...thStyle,width:44 }}>Série</th><th style={{ ...thStyle,width:90 }}>Opak.</th></>}
                      <th style={{ ...thStyle,width:70 }}>{sec==="silove"?"Cíl":"Váha"}</th>
                      </tr></thead>
                      <tbody>
                        {block[sec].map((row,ri)=>{
                          const pA=PARTIE[row.partie]||{color:T.borderDim};
                          const pB=PARTIE[row.partieB]||{color:T.borderDim};
                          const hasB=!!row.nameB;
                          return (
                            <tr key={ri}>
                              <td style={{ background:T.bgRow,padding:"4px 6px",minWidth:160 }}>
                                <div onClick={()=>setPicker({blockId:block.id,section:sec,rowIdx:ri,slot:"A"})}
                                  style={{ border:`1.5px solid ${!row.name?T.borderDim:pA.color}`,borderRadius:5,margin:"2px 2px",padding:"5px 8px",cursor:"pointer",background:!row.name?"transparent":pA.color+"10",display:"flex",alignItems:"center",gap:5 }}>
                                  {row.refType==="group"&&<span style={{ fontSize:10 }}>📂</span>}
                                  <span style={{ color:!row.name?T.muted:T.white,fontSize:12,fontWeight:!row.name?400:600,flex:1 }}>{!row.name?"Klikni pro výběr...":row.name}</span>
                                </div>
                                {hasB?(
                                  <div style={{ display:"flex",alignItems:"center",gap:4,marginTop:2 }}>
                                    <div style={{ fontSize:9,color:T.muted,fontWeight:700,paddingLeft:4 }}>nebo</div>
                                    <div onClick={()=>setPicker({blockId:block.id,section:sec,rowIdx:ri,slot:"B"})}
                                      style={{ flex:1,border:`1.5px solid ${pB.color}`,borderRadius:5,padding:"4px 8px",cursor:"pointer",background:pB.color+"10",display:"flex",alignItems:"center",gap:5 }}>
                                      {row.refTypeB==="group"&&<span style={{ fontSize:10 }}>📂</span>}
                                      <span style={{ color:T.white,fontSize:11,fontWeight:600,flex:1 }}>{row.nameB}</span>
                                      <button onClick={e=>{e.stopPropagation();setPlan(prev=>{const p2=JSON.parse(JSON.stringify(prev));const r=p2.blocks.find(b=>b.id===block.id)[sec][ri];delete r.nameB;delete r.partieB;delete r.refTypeB;delete r.refIdB;return p2;});}} style={{ background:"none",border:"none",color:T.danger,cursor:"pointer",fontSize:12,lineHeight:1 }}>×</button>
                                    </div>
                                  </div>
                                ):row.name?(<button onClick={()=>setPicker({blockId:block.id,section:sec,rowIdx:ri,slot:"B"})} style={{ width:"100%",background:"transparent",border:`1px dashed ${T.borderDim}`,color:T.muted,borderRadius:5,padding:"3px 6px",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:2,textAlign:"left" }}>+ přidat druhý cvik</button>):null}
                              </td>
                              {sec==="silove" ? null : <td style={cellStyle}><input defaultValue={row.serie||""} placeholder="3x" style={{ width:36,background:"transparent",border:`1px solid ${T.borderDim}`,borderRadius:5,color:T.white,fontSize:12,textAlign:"center",padding:"4px 2px",outline:"none",fontFamily:"inherit" }} onChange={e=>{setPlan(prev=>{const p2=JSON.parse(JSON.stringify(prev));p2.blocks.find(b=>b.id===block.id)[sec][ri].serie=e.target.value;return p2;})}}/></td>}
                           <td style={cellStyle}><input defaultValue={row.rep||""} placeholder={sec==="silove"?"5,5,5":"8-12"} style={{ width:76,background:"transparent",border:`1px solid ${T.borderDim}`,borderRadius:5,color:T.white,fontSize:12,textAlign:"center",padding:"4px 2px",outline:"none",fontFamily:"'JetBrains Mono',monospace" }} onChange={e=>{setPlan(prev=>{const p2=JSON.parse(JSON.stringify(prev));p2.blocks.find(b=>b.id===block.id)[sec][ri].rep=e.target.value;return p2;})}}/></td>
                           <td style={cellStyle}><input defaultValue={sec==="silove"?(row.cil||""):(row.vaha||"")} placeholder={sec==="silove"?"10,10,10":"—"} style={{ width:56,background:"transparent",border:`1px solid ${T.borderDim}`,borderRadius:5,color:T.white,fontSize:12,textAlign:"center",padding:"4px 2px",outline:"none",fontFamily:"'JetBrains Mono',monospace" }} onChange={e=>{setPlan(prev=>{const p2=JSON.parse(JSON.stringify(prev));const field=sec==="silove"?"cil":"vaha";p2.blocks.find(b=>b.id===block.id)[sec][ri][field]=e.target.value;return p2;})}}/></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <div style={{ height:6 }}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PLAN WIZARD ─────────────────────────────────────────────────────────────
const DAYS = ["Pondělí","Úterý","Středa","Čtvrtek","Pátek","Sobota","Neděle"];
const BLOCK_TYPES = [
  { id:"kombinace", label:"Kombinace", desc:"Silové + Hypertrofie" },
  { id:"silovy", label:"Silový", desc:"Pouze silové cviky" },
  { id:"hypertrofie", label:"Hypertrofie", desc:"Pouze hypertrofie" },
];

function PlanWizard({ onSave, onCancel }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [weeks, setWeeks] = useState(6);
  const [locked, setLocked] = useState(false);
  const [blocks, setBlocks] = useState([{ tmpId:"b0", label:"Trénink 1", day:"Pondělí", type:"kombinace", siloveCount:3, hypertrofieCount:6 }]);

  function addBlock() { setBlocks(prev => [...prev, { tmpId:"b"+Date.now(), label:`Trénink ${prev.length+1}`, day:DAYS[prev.length]||"Pondělí", type:"kombinace", siloveCount:3, hypertrofieCount:6 }]); }
  function updateBlock(idx, key, val) { setBlocks(prev => prev.map((b,i)=>i===idx?{...b,[key]:val}:b)); }
  function removeBlock(idx) { setBlocks(prev => prev.filter((_,i)=>i!==idx)); }

  function buildPlan() {
    const emptyEx = () => ({ id:"", name:"", partie:"", serie:"", rep:"", vaha:"", refType:null, refId:null });
    return {
      id:"t"+Date.now(), name, desc, weeks, difficulty:"Středně pokročilý", locked,
      blocks: blocks.map((b,i) => ({
        id:"b"+Date.now()+i, label:b.label, day:b.day, type:b.type,
        silove: Array.from({length:b.type==="hypertrofie"?0:b.siloveCount}, emptyEx),
        hypertrofie: Array.from({length:b.type==="silovy"?0:b.hypertrofieCount}, emptyEx),
      }))
    };
  }

  if (step===1) return (
    <div style={{ paddingBottom:90 }}>
      <div style={{ padding:"18px 18px 0",display:"flex",alignItems:"center",gap:10 }}>
        <button onClick={onCancel} style={{ background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>← Zpět</button>
        <div style={{ color:T.muted,fontSize:11 }}>Krok 1 / 2</div>
      </div>
      <div style={{ padding:"10px 18px 0",color:T.white,fontWeight:800,fontSize:18,marginBottom:4 }}>Nový tréninkový plán</div>
      <div style={{ padding:"6px 18px 0" }}>
        <FieldLabel>Název plánu</FieldLabel>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="např. Síla & Hypertrofie A" style={inputStyle}/>
        <FieldLabel>Popis</FieldLabel>
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Krátký popis programu..." style={{ ...inputStyle, resize:"vertical" }}/>
        <FieldLabel>Délka plánu (týdny)</FieldLabel>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:16 }}>
          {[4,6,8,10,12].map(w=><button key={w} onClick={()=>setWeeks(w)} style={{ background:weeks===w?T.accent+"28":T.bgCard, border:`1.5px solid ${weeks===w?T.accent:T.borderDim}`, borderRadius:9, padding:"7px 16px", fontSize:13, fontWeight:700, color:weeks===w?T.accent:T.muted, cursor:"pointer", fontFamily:"inherit" }}>{w} týdnů</button>)}
        </div>
        <FieldLabel>Přístup ke plánu</FieldLabel>
        <div style={{ display:"flex",gap:8,marginBottom:20 }}>
          <button onClick={()=>setLocked(false)} style={{ flex:1,background:!locked?T.accent+"22":T.bgCard, border:`1.5px solid ${!locked?T.accent:T.borderDim}`, borderRadius:10, padding:"12px 10px", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
            <div style={{ fontSize:16,marginBottom:4 }}>🔓</div>
            <div style={{ color:!locked?T.accent:T.white,fontWeight:700,fontSize:12,marginBottom:2 }}>Volný přístup</div>
            <div style={{ color:T.muted,fontSize:10,lineHeight:1.4 }}>Plán si může uložit každý klient</div>
          </button>
          <button onClick={()=>setLocked(true)} style={{ flex:1,background:locked?T.accent+"22":T.bgCard, border:`1.5px solid ${locked?T.accent:T.borderDim}`, borderRadius:10, padding:"12px 10px", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
            <div style={{ fontSize:16,marginBottom:4 }}>🔒</div>
            <div style={{ color:locked?T.accent:T.white,fontWeight:700,fontSize:12,marginBottom:2 }}>Zamčený plán</div>
            <div style={{ color:T.muted,fontSize:10,lineHeight:1.4 }}>Plán mohou použít pouze přidělení klienti</div>
          </button>
        </div>
        <Btn full onClick={()=>{ if(!name.trim())return; setStep(2); }}>Pokračovat →</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom:90 }}>
      <div style={{ padding:"18px 18px 0",display:"flex",alignItems:"center",gap:10 }}>
        <button onClick={()=>setStep(1)} style={{ background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>← Zpět</button>
        <div style={{ color:T.muted,fontSize:11 }}>Krok 2 / 2 · Definice bloků</div>
      </div>
      <div style={{ padding:"10px 18px 4px",color:T.white,fontWeight:800,fontSize:16 }}>{name}</div>
      <div style={{ padding:"4px 12px 0" }}>
        {blocks.map((b,idx)=>(
          <Card key={b.tmpId} style={{ padding:"14px",marginBottom:12 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
              <div style={{ width:28,height:28,background:T.accentBtn,color:"#fff",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0 }}>{idx+1}</div>
              {blocks.length>1&&<button onClick={()=>removeBlock(idx)} style={{ background:"none",border:"none",color:T.danger,cursor:"pointer",fontSize:18,lineHeight:1,fontFamily:"inherit" }}>×</button>}
            </div>
            <FieldLabel>Název bloku</FieldLabel>
            <input value={b.label} onChange={e=>updateBlock(idx,"label",e.target.value)} style={{ ...inputStyle, marginBottom:10 }}/>
            <FieldLabel>Den</FieldLabel>
            <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:12 }}>
              {DAYS.map(d=><button key={d} onClick={()=>updateBlock(idx,"day",d)} style={{ background:b.day===d?T.accent+"22":T.bg, border:`1px solid ${b.day===d?T.accent:T.borderDim}`, borderRadius:7, padding:"4px 10px", fontSize:10, fontWeight:700, color:b.day===d?T.accent:T.muted, cursor:"pointer", fontFamily:"inherit" }}>{d.slice(0,2)}</button>)}
            </div>
            <FieldLabel>Typ tréninku</FieldLabel>
            <div style={{ display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" }}>
              {BLOCK_TYPES.map(bt=><button key={bt.id} onClick={()=>updateBlock(idx,"type",bt.id)} style={{ background:b.type===bt.id?T.accent+"22":T.bg, border:`1.5px solid ${b.type===bt.id?T.accent:T.borderDim}`, borderRadius:9, padding:"7px 12px", fontSize:11, fontWeight:700, color:b.type===bt.id?T.accent:T.muted, cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}><div>{bt.label}</div><div style={{ fontSize:9,fontWeight:400,opacity:0.7,marginTop:1 }}>{bt.desc}</div></button>)}
            </div>
            {b.type!=="hypertrofie"&&(
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                <span style={{ color:T.muted,fontSize:12 }}>Silové cviky</span>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <button onClick={()=>updateBlock(idx,"siloveCount",Math.max(1,b.siloveCount-1))} style={{ width:26,height:26,background:T.bgCard2,border:`1px solid ${T.borderDim}`,borderRadius:6,color:T.white,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit" }}>−</button>
                  <span style={{ color:T.white,fontWeight:700,minWidth:16,textAlign:"center" }}>{b.siloveCount}</span>
                  <button onClick={()=>updateBlock(idx,"siloveCount",Math.min(8,b.siloveCount+1))} style={{ width:26,height:26,background:T.bgCard2,border:`1px solid ${T.borderDim}`,borderRadius:6,color:T.white,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit" }}>+</button>
                </div>
              </div>
            )}
            {b.type!=="silovy"&&(
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <span style={{ color:T.muted,fontSize:12 }}>Hypertrofie cviky</span>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <button onClick={()=>updateBlock(idx,"hypertrofieCount",Math.max(1,b.hypertrofieCount-1))} style={{ width:26,height:26,background:T.bgCard2,border:`1px solid ${T.borderDim}`,borderRadius:6,color:T.white,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit" }}>−</button>
                  <span style={{ color:T.white,fontWeight:700,minWidth:16,textAlign:"center" }}>{b.hypertrofieCount}</span>
                  <button onClick={()=>updateBlock(idx,"hypertrofieCount",Math.min(12,b.hypertrofieCount+1))} style={{ width:26,height:26,background:T.bgCard2,border:`1px solid ${T.borderDim}`,borderRadius:6,color:T.white,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit" }}>+</button>
                </div>
              </div>
            )}
          </Card>
        ))}
       <button onClick={addBlock} style={{ width:"100%",background:"transparent",border:`1.5px dashed ${T.accent}44`,color:T.accent,borderRadius:10,padding:"11px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:14 }}>+ Přidat další trénink</button>
        <Btn full onClick={()=>onSave(buildPlan())}>Vytvořit plán →</Btn>
      </div>
    </div>
  );
}

// ─── SCREEN: PLÁNY ───────────────────────────────────────────────────────────
function LibraryScreen({ library, setLibrary, activeInstance, onActivate, isTrainer, exercises, groups, suggestedPlans }) {
  const [selected,   setSelected]   = useState(null);
  const [editing,    setEditing]    = useState(null);
  const [wizard,     setWizard]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [planFilter, setPlanFilter] = useState(null); // null | "kombinace" | "silovy" | "hypertrofie"

  // Filter library by block type
  const assignedPlanIds = suggestedPlans?.assignedPlanIds || [];
  const filteredLibrary = planFilter
      ? library.filter(tmpl => {
          if (planFilter==="assigned") return assignedPlanIds.includes(tmpl.id);
          const types = (tmpl.blocks||[]).map(b=>b.type).filter(Boolean);
          if (planFilter==="kombinace") return types.includes("kombinace") || (types.includes("silovy")&&types.includes("hypertrofie"));
          return types.includes(planFilter);
        })
      : library;

    async function handleDelete(id) {
      await supabase.from('plans').delete().eq('id', id);
      setLibrary(prev=>prev.filter(t=>t.id!==id)); setSelected(null); setEditing(null); setConfirmDel(null);
    }
  function handleDuplicate(tmpl) { setLibrary(prev=>[...prev,{...JSON.parse(JSON.stringify(tmpl)),id:"t"+Date.now(),name:tmpl.name+" (kopie)"}]); }
  async function handleWizardSave(newPlan) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('plans').insert([{
      id: newPlan.id,
      name: newPlan.name,
      description: newPlan.desc,
      weeks: newPlan.weeks,
      locked: newPlan.locked || false,
      blocks: newPlan.blocks,
      created_by: user.id
    }]);
    setLibrary(prev => [...prev, newPlan]);
    setWizard(false);
    setEditing(newPlan);
  }
  async function savePlan(updatedPlan) {
  await supabase.from('plans').update({
    name: updatedPlan.name,
    description: updatedPlan.desc,
    weeks: updatedPlan.weeks,
    locked: updatedPlan.locked || false,
    blocks: updatedPlan.blocks,
  }).eq('id', updatedPlan.id);
  setLibrary(prev=>prev.map(t=>t.id===updatedPlan.id?updatedPlan:t));
  setEditing(updatedPlan);
}

  if (wizard && isTrainer) return <PlanWizard onSave={handleWizardSave} onCancel={()=>setWizard(false)}/>;

  if (editing) return (
    <PlanEditor plan={editing} setPlan={(updFn)=>{ setEditing(prev=>{ const next=typeof updFn==="function"?updFn(prev):updFn; savePlan(next); return next; }); }} exercises={exercises} groups={groups} onBack={()=>{ setEditing(null); setSelected(null); }}/>
  );

  if (selected) {
    const tmpl=library.find(t=>t.id===selected);
    if(!tmpl){setSelected(null);return null;}
    const isActive=activeInstance?.templateId===tmpl.id;
    return (
      <div style={{ paddingBottom:90 }}>
        <div style={{ padding:"18px 18px 0",display:"flex",justifyContent:"space-between" }}>
          <button onClick={()=>{ setSelected(null); setConfirmDel(null); }} style={{ background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>← Zpět</button>
          {isTrainer&&<div style={{ display:"flex",gap:8 }}>
          <Btn small variant="ghost" onClick={()=>setEditing(tmpl)}>✏️ Upravit</Btn>
          <Btn small variant="ghost" onClick={()=>handleDuplicate(tmpl)}>Duplikovat</Btn>
          <Btn small variant="ghost" onClick={async ()=>{
          const newLocked = !tmpl.locked;
          await supabase.from('plans').update({ locked: newLocked }).eq('id', tmpl.id);
          setLibrary(prev=>prev.map(t=>t.id===tmpl.id?{...t,locked:newLocked}:t));
          }}>{tmpl.locked ? "🔓 Odemknout" : "🔒 Zamknout"}</Btn>
          <Btn small variant="danger" onClick={()=>setConfirmDel(tmpl.id)}>Smazat</Btn>
          </div>}
        </div>
        {confirmDel===tmpl.id&&(
          <div style={{ margin:"10px 18px 0",background:"#3a1a1a",border:`1px solid ${T.danger}44`,borderRadius:10,padding:"12px 14px" }}>
            <div style={{ color:T.white,fontSize:13,fontWeight:600,marginBottom:10 }}>Opravdu smazat plán „{tmpl.name}"?</div>
            <div style={{ display:"flex",gap:8 }}>
              <Btn small variant="ghost" style={{ flex:1 }} onClick={()=>setConfirmDel(null)}>Zrušit</Btn>
              <Btn small variant="danger" style={{ flex:1 }} onClick={()=>handleDelete(tmpl.id)}>Ano, smazat</Btn>
            </div>
          </div>
        )}
        <div style={{ padding:"14px 18px" }}>
          <Card style={{ padding:"18px",marginBottom:12 }}>
            <div style={{ color:T.white,fontWeight:800,fontSize:17,marginBottom:6 }}>{tmpl.name}</div>
            <div style={{ color:T.muted,fontSize:13,lineHeight:1.5,marginBottom:12 }}>{tmpl.desc}</div>
            <div style={{ display:"flex",gap:20,flexWrap:"wrap",alignItems:"center" }}>
              <div><div style={{ color:T.accent,fontWeight:800,fontSize:18 }}>{tmpl.weeks}</div><div style={{ color:T.muted,fontSize:10 }}>týdnů</div></div>
              <div><div style={{ color:T.accent,fontWeight:800,fontSize:18 }}>{tmpl.blocks.length}</div><div style={{ color:T.muted,fontSize:10 }}>tréninků/týden</div></div>
              {tmpl.locked
                ? <span style={{ background:"rgba(255,255,255,0.06)",color:T.muted,fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:20,border:`1px solid rgba(255,255,255,0.12)`,display:"flex",alignItems:"center",gap:4 }}>🔒 Zamčený – jen přidělení klienti</span>
                : <span style={{ background:"rgba(46,159,175,0.1)",color:T.accent,fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:20,border:`1px solid ${T.accent}33`,display:"flex",alignItems:"center",gap:4 }}>🔓 Volný přístup</span>
              }
            </div>
          </Card>
          {tmpl.blocks.map((block,bi)=>{
            const allEx=[...(block.silove||[]),...(block.hypertrofie||[])].filter(e=>e.name);
            return (
              <Card key={block.id} style={{ padding:"14px",marginBottom:10 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                  <span style={{ width:28,height:28,background:T.accent,color:"#fff",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13 }}>{bi+1}</span>
                  <div><div style={{ color:T.white,fontWeight:700,fontSize:14 }}>{block.label}</div><div style={{ color:T.muted,fontSize:11 }}>{block.day}</div></div>
                </div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                  {allEx.slice(0,6).map((ex,i)=>{ const p=PARTIE[ex.partie]||{color:T.accent}; return <span key={i} style={{ background:p.color+"18",color:p.color,border:`1px solid ${p.color}44`,fontSize:10,fontWeight:600,padding:"3px 8px",borderRadius:6 }}>{ex.refType==="group"?"📂 ":""}{ex.name}</span>; })}
                  {allEx.length>6&&<span style={{ color:T.muted,fontSize:10,padding:"3px 4px" }}>+{allEx.length-6} dalších</span>}
                  {allEx.length===0&&<span style={{ color:T.muted,fontSize:11 }}>Zatím bez cviků</span>}
                </div>
              </Card>
            );
          })}
          {isActive
            ?<div style={{ background:"rgba(46,159,175,0.1)",border:`1px solid ${T.accent}44`,borderRadius:10,padding:"11px 16px",textAlign:"center",color:T.accent,fontSize:13,fontWeight:700 }}>✓ Tento plán je aktuálně aktivní</div>
            : tmpl.locked && !isTrainer && !(suggestedPlans?.assignedPlanIds||[]).includes(tmpl.id)
            ? <div style={{ background:"rgba(255,255,255,0.04)",border:`1px solid rgba(255,255,255,0.1)`,borderRadius:10,padding:"11px 16px",textAlign:"center",color:T.muted,fontSize:13,fontWeight:600 }}>🔒 Tento plán je zamčený – vyžaduje přidělení od trenéra</div>
            : <Btn full onClick={()=>{onActivate(tmpl.id);setSelected(null);}}>Aktivovat plán →</Btn>
          }
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom:90 }}>
      <PageHeader label="Tréninkové plány" title="Plány" action={isTrainer&&<Btn small onClick={()=>setWizard(true)}>+ Nový plán</Btn>}/>
      {/* Type filter chips */}
      <div style={{ display:"flex",gap:6,padding:"14px 18px 6px",overflowX:"auto" }}>
      {[{id:null,label:"Vše"},{id:"kombinace",label:"Kombinovaný"},{id:"silovy",label:"Silový"},{id:"hypertrofie",label:"Hypertrofie"},{id:"assigned",label:"Přiřazené"}].map(f=>{
  const isAssigned = f.id === "assigned";
  const hasNew = isAssigned && (suggestedPlans?.newAssignedPlanIds||[]).length > 0;
  const active = planFilter===f.id;
  return (
    <button key={String(f.id)} onClick={()=>setPlanFilter(f.id)} style={{
      background:active?T.accent+"28":T.bgCard2, border:`1.5px solid ${active?T.accent:hasNew?"#FF9500":T.borderDim}`,
      borderRadius:20, padding:"5px 13px", fontSize:10, fontWeight:700, cursor:"pointer",
      whiteSpace:"nowrap", fontFamily:"inherit", color:active?T.accent:hasNew?"#FF9500":T.muted, flexShrink:0,
      boxShadow:active?`0 0 12px ${T.accent}44`:hasNew?`0 0 8px rgba(255,149,0,0.4)`:"none",
      position:"relative",
    }}>
      {f.label}
      {hasNew&&!active&&<span style={{ position:"absolute",top:-4,right:-4,width:8,height:8,borderRadius:"50%",background:"#FF9500",border:`1.5px solid ${T.bg}` }}/>}
    </button>
  );
})}
      </div>
      <div style={{ padding:"8px 12px 0",display:"flex",flexDirection:"column",gap:10 }}>
        {filteredLibrary.map(tmpl=>{
          const isActive=activeInstance?.templateId===tmpl.id;
          const types = [...new Set((tmpl.blocks||[]).map(b=>b.type).filter(Boolean))];
          const typeLabel = types.includes("kombinace")||types.length>1?"Kombinovaný":types.includes("silovy")?"Silový":types.includes("hypertrofie")?"Hypertrofie":"";
          const typeColor = typeLabel==="Silový"?"#FF9500":typeLabel==="Hypertrofie"?"#00CC00":T.accent;
          return (
            <Card key={tmpl.id} style={{ padding:"16px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                <div style={{ flex:1,marginRight:10 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap" }}>
                    <div style={{ color:T.white,fontWeight:700,fontSize:14 }}>{tmpl.name}</div>
                    {isActive&&<span style={{ background:"rgba(46,159,175,0.15)",color:T.accent,fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:20,border:`1px solid ${T.accent}44` }}>AKTIVNÍ</span>}
                    {typeLabel&&<span style={{ background:typeColor+"18",color:typeColor,fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,border:`1px solid ${typeColor}44` }}>{typeLabel}</span>}
                    {tmpl.locked&&<span style={{ background:"rgba(255,255,255,0.06)",color:T.muted,fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,border:`1px solid rgba(255,255,255,0.12)` }}>🔒 Zamčený</span>}
                  </div>
                  <div style={{ color:T.muted,fontSize:12,lineHeight:1.4 }}>{tmpl.desc}</div>
                </div>
              </div>
              <div style={{ display:"flex",gap:14,marginBottom:12 }}>
                <span style={{ color:T.muted,fontSize:11 }}>📅 {tmpl.weeks} týdnů</span>
                <span style={{ color:T.muted,fontSize:11 }}>🏋️ {tmpl.blocks.length}× týdně</span>
              </div>
              <div style={{ display:"flex",gap:8 }}>
                <Btn small variant="secondary" style={{ flex:1 }} onClick={()=>setSelected(tmpl.id)}>Zobrazit</Btn>
                {isTrainer&&<Btn small variant="ghost" onClick={()=>setEditing(library.find(t=>t.id===tmpl.id))}>✏️ Upravit</Btn>}
              </div>
            </Card>
          );
        })}
        {filteredLibrary.length===0&&(
          <div style={{ textAlign:"center",padding:"40px 0" }}>
            <div style={{ fontSize:40,marginBottom:12 }}>📋</div>
            <div style={{ color:T.white,fontSize:14,marginBottom:6 }}>{planFilter?"Žádné plány tohoto typu":"Žádné plány"}</div>
            {!planFilter&&<><div style={{ color:T.muted,fontSize:12,marginBottom:20 }}>Vytvoř svůj první tréninkový plán</div>{isTrainer&&<Btn onClick={()=>setWizard(true)}>+ Vytvořit plán</Btn>}</>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: KLIENTI ─────────────────────────────────────────────────────────
function ClientsScreen({ library, suggestedPlans, setSuggestedPlans }) {
  const [clients, setClients] = useState([]);
  const [assigningClient, setAssigningClient] = useState(null);
  const [viewingClient,   setViewingClient]   = useState(null);
  const [confirmRemove,   setConfirmRemove]   = useState(null);

  // Načti klienty ze Supabase
  const [assignmentCounts, setAssignmentCounts] = useState({});
  const [assignmentPlanIds, setAssignmentPlanIds] = useState({});
  const [showAssignedPlans, setShowAssignedPlans] = useState(null);

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase.rpc("get_clients");
      if (data) setClients(data);
      const { data: assignments } = await supabase.from('plan_assignments').select('client_id, plan_id');
      if (assignments) {
      const counts = {};
      const planIds = {};
      assignments.forEach(a => {
      counts[a.client_id] = (counts[a.client_id] || 0) + 1;
      planIds[a.client_id] = [...(planIds[a.client_id] || []), a.plan_id];
  });
  setAssignmentCounts(counts);
  setAssignmentPlanIds(planIds);
}
    }
    loadClients();
  }, []);

  // Počet nových klientů tento měsíc
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const newThisMonth = clients.filter(c => {
    const d = new Date(c.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  async function handleAssign(client, tmpl) {
    const { error } = await supabase.from('plan_assignments').insert([{
      plan_id: tmpl.id,
      client_id: client.id,
      assigned_by: (await supabase.auth.getUser()).data.user.id,
    }]);
    if (!error) {
      setAssignmentCounts(prev => ({ ...prev, [client.id]: (prev[client.id] || 0) + 1 }));
      setAssignmentPlanIds(prev => ({ ...prev, [client.id]: [...(prev[client.id] || []), tmpl.id] }));
    }
  }

  // ── Assign plan modal ──
  if (assigningClient) {
    return (
      <div style={{ paddingBottom:90 }}>
        <div style={{ padding:"18px 18px 0",display:"flex",alignItems:"center",gap:10 }}>
          <button onClick={()=>setAssigningClient(null)} style={{ background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>← Zpět</button>
          <div style={{ color:T.muted,fontSize:11 }}>Přiřadit plán</div>
        </div>
        <div style={{ padding:"10px 18px 4px" }}>
          <div style={{ color:T.accent,fontSize:9,letterSpacing:2.5,textTransform:"uppercase",fontWeight:700,opacity:0.8,marginBottom:4 }}>Klient</div>
          <div style={{ color:T.white,fontWeight:700,fontSize:18,marginBottom:4 }}>{assigningClient.jmeno}</div>
          <div style={{ color:T.muted,fontSize:12,marginBottom:16 }}>Vyber plán k přiřazení</div>
        </div>
        <div style={{ padding:"0 12px",display:"flex",flexDirection:"column",gap:10 }}>
          {library.map(tmpl=>{
            const alreadyAssigned = (assignmentPlanIds[assigningClient.id]||[]).includes(tmpl.id);
            const types = [...new Set((tmpl.blocks||[]).map(b=>b.type).filter(Boolean))];
            const typeLabel = types.includes("kombinace")||types.length>1?"Kombinovaný":types.includes("silovy")?"Silový":types.includes("hypertrofie")?"Hypertrofie":"";
            const typeColor = typeLabel==="Silový"?"#FF9500":typeLabel==="Hypertrofie"?"#00CC00":T.accent;
            return (
              <Card key={tmpl.id} style={{ padding:"14px",opacity:alreadyAssigned?0.5:1 }}>
                <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8 }}>
                  <div style={{ flex:1,marginRight:10 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap" }}>
                      <div style={{ color:T.white,fontWeight:700,fontSize:14 }}>{tmpl.name}</div>
                      {typeLabel&&<span style={{ background:typeColor+"18",color:typeColor,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,border:`1px solid ${typeColor}44` }}>{typeLabel}</span>}
                    </div>
                    <div style={{ color:T.muted,fontSize:11 }}>📅 {tmpl.weeks} týdnů · 🏋️ {tmpl.blocks.length}× týdně</div>
                  </div>
                </div>
                {alreadyAssigned
                ? <Btn full variant="danger" onClick={async ()=>{
                await supabase.from('plan_assignments').delete()
                .eq('plan_id', tmpl.id)
                .eq('client_id', assigningClient.id);
                const { data: assignments } = await supabase.from('plan_assignments').select('client_id, plan_id');
                if (assignments) {
                const counts = {};
                const planIds = {};
                assignments.forEach(a => {
                counts[a.client_id] = (counts[a.client_id] || 0) + 1;
                planIds[a.client_id] = [...(planIds[a.client_id] || []), a.plan_id];
                });
                setAssignmentCounts(counts);
                setAssignmentPlanIds(planIds);
                }
                }}>Odebrat tento plán</Btn>
                : <Btn full onClick={()=>handleAssign(assigningClient,tmpl)}>Přiřadit tento plán →</Btn>}
              </Card>
            );
          })}
          {library.length===0&&<div style={{ color:T.muted,fontSize:13,textAlign:"center",padding:"20px 0" }}>Žádné plány k dispozici.</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom:90 }}>
      <PageHeader label="Správa" title="Klienti"/>
      {/* Stats */}
      <div style={{ display:"flex",gap:8,padding:"14px 18px 4px" }}>
        {[
          {label:"Celkem",val:clients.length},
          {label:"Aktivní",val:clients.length},
          {label:"Noví tento měsíc",val:newThisMonth}
        ].map((s,i)=>(
          <div key={i} style={{ flex:1,background:`linear-gradient(180deg,#2a2a2a,#232323)`,borderRadius:10,padding:"10px",border:`1px solid rgba(255,255,255,0.08)`,textAlign:"center",boxShadow:T.shadowSm }}>
            <div style={{ color:T.accent,fontWeight:800,fontSize:18 }}>{s.val}</div>
            <div style={{ color:T.muted,fontSize:9,marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* Client list */}
      <div style={{ padding:"10px 12px 0",display:"flex",flexDirection:"column",gap:10 }}>
        {clients.length===0&&<div style={{ color:T.muted,fontSize:13,textAlign:"center",padding:"20px 0" }}>Zatím žádní klienti.</div>}
        {clients.map(c=>{
          const initials = (c.jmeno||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
          const clientSuggested = (suggestedPlans["c_self"]||[]).filter(p=>p.forClient===c.jmeno).length;
          return (
            <Card key={c.id} style={{ padding:"16px" }}>
              <div style={{ display:"flex",gap:12,alignItems:"center" }}>
                <div style={{ width:44,height:44,borderRadius:11,flexShrink:0,background:`linear-gradient(135deg,${T.accent}44,${T.bgCard2})`,border:`1.5px solid ${T.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",color:T.accent,fontWeight:800,fontSize:14 }}>{initials}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div style={{ color:T.white,fontWeight:700,fontSize:15 }}>{c.jmeno}</div>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    {assignmentCounts[c.id] > 0 && <span onClick={()=>setShowAssignedPlans(showAssignedPlans===c.id?null:c.id)} style={{ background:"rgba(255,149,0,0.15)",color:"#FF9500",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,border:"1px solid rgba(255,149,0,0.3)",cursor:"pointer" }}>📋 Přiřazen plán</span>}
                    <span style={{ background:"rgba(46,159,175,0.15)",color:T.accent,fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20 }}>Aktivní</span>
                   </div>{showAssignedPlans===c.id && (
                   <div style={{ marginTop:8, padding:"8px 12px", background:"rgba(255,149,0,0.08)", borderRadius:8, border:"1px solid rgba(255,149,0,0.2)" }}>
                   <div style={{ color:"#FF9500", fontSize:10, fontWeight:700, marginBottom:4 }}>Přiřazené plány:</div>
                  {(assignmentPlanIds[c.id]||[]).map(pid => {
                  const plan = library.find(t=>t.id===pid);
                  return plan ? <div key={pid} style={{ color:T.white, fontSize:12, padding:"2px 0" }}>• {plan.name}</div> : null;
                  })}
                 </div>
                  )}
                  </div>
                  <div style={{ color:T.muted,fontSize:11,marginTop:2 }}>{c.email}</div>
                  {clientSuggested>0&&<div style={{ color:"#FF9500",fontSize:10,marginTop:2,fontWeight:600 }}>📋 {clientSuggested} navrhovaný plán{clientSuggested>1?"y":""}</div>}
                </div>
              </div>
              <div style={{ display:"flex",gap:8,marginTop:12 }}>
                <Btn small variant="secondary" style={{ flex:1 }} onClick={()=>setViewingClient(c)}>Zobrazit profil</Btn>
                <Btn small variant="ghost" style={{ flex:1 }} onClick={()=>setAssigningClient(c)}>Přiřadit plán</Btn>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Client modal */}
      {viewingClient&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",alignItems:"flex-end" }} onClick={()=>{ setViewingClient(null); setConfirmRemove(null); }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:`linear-gradient(180deg,#272727,#212121)`,borderRadius:"16px 16px 0 0",width:"100%",maxHeight:"75vh",overflowY:"auto" }}>
            <div style={{ padding:"14px 18px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid rgba(255,255,255,0.08)` }}>
              <div>
                <div style={{ color:T.muted,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase" }}>Profil klienta</div>
                <div style={{ color:T.white,fontWeight:700,fontSize:17 }}>{viewingClient.jmeno}</div>
              </div>
              <button onClick={()=>{ setViewingClient(null); setConfirmRemove(null); }} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:7,color:T.muted,fontSize:15,cursor:"pointer",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
            </div>
            <div style={{ padding:"14px 18px 28px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                <span style={{ color:T.muted,fontSize:12 }}>Email:</span>
                <span style={{ color:T.white,fontSize:12,fontWeight:600 }}>{viewingClient.email}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                <span style={{ color:T.muted,fontSize:12 }}>Pohlaví:</span>
                <span style={{ color:T.white,fontSize:12,fontWeight:600 }}>{viewingClient.pohlavi||"—"}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                <span style={{ color:T.muted,fontSize:12 }}>Věk:</span>
                <span style={{ color:T.white,fontSize:12,fontWeight:600 }}>{viewingClient.vek||"—"} let</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                <span style={{ color:T.muted,fontSize:12 }}>Výška:</span>
                <span style={{ color:T.white,fontSize:12,fontWeight:600 }}>{viewingClient.vyska||"—"} cm</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:16 }}>
                <span style={{ color:T.muted,fontSize:12 }}>Váha:</span>
                <span style={{ color:T.white,fontSize:12,fontWeight:600 }}>{viewingClient.vaha||"—"} kg</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── INBODY-STYLE CHART ──────────────────────────────────────────────────────
function InbodyChart({ records, metrics }) {
  if (records.length < 2) return (
    <div style={{ background:T.bg,borderRadius:10,border:`1px solid ${T.borderDim}`,padding:"28px 0",textAlign:"center",marginBottom:14 }}>
      <div style={{ fontSize:26,marginBottom:6 }}>📈</div>
      <div style={{ color:T.muted,fontSize:12 }}>Přidej alespoň 2 záznamy pro zobrazení grafu</div>
    </div>
  );

  const LABEL_W = 90;
  const ROW_H   = 58;
  const PAD_R   = 14;
  const DATE_H  = 28;
  const DOT_R   = 3.5;

  const parseDate = s => {
    const p = s.replace(/\s/g,"").split(".");
    return new Date(parseInt(p[2]||"2026"), parseInt(p[1]||"1")-1, parseInt(p[0]||"1"));
  };
  const sorted = [...records].sort((a,b)=>parseDate(a.date)-parseDate(b.date));
  const n = sorted.length;
  const dateLabels = sorted.map(r => {
    const p = r.date.replace(/\s/g,"").split(".");
    return `${p[0]}.${p[1]}.`;
  });

  const COL_W = Math.max(36, Math.min(58, 300 / Math.max(n-1,1)));
  const chartW = LABEL_W + COL_W * (n-1) + PAD_R;
  const activeMetrics = metrics.filter(m => sorted.some(r=>r[m.key]!==""));
  const totalH = activeMetrics.length * ROW_H + DATE_H;

  const metricData = activeMetrics.map(m => {
    const vals = sorted.map(r => parseFloat(r[m.key]||""));
    const valid = vals.filter(v=>!isNaN(v));
    if (valid.length < 1) return null;
    const minV = Math.min(...valid);
    const maxV = Math.max(...valid);
    const rangeV = (maxV - minV) || 1;
    const pad = rangeV * 0.15;
    return { ...m, vals, minV:minV-pad, maxV:maxV+pad, rangeV:rangeV+2*pad };
  }).filter(Boolean);

  return (
    <div style={{ marginBottom:14,background:T.bg,borderRadius:10,border:`1px solid ${T.borderDim}`,overflow:"hidden" }}>
      <div style={{ overflowX:"auto" }}>
        <svg viewBox={`0 0 ${chartW} ${totalH}`} style={{ width:"100%",minWidth:Math.min(chartW,320),display:"block" }}>
          {metricData.map((m, mi) => {
            const rowY = mi * ROW_H;
            const scaleY = v => rowY + 6 + (ROW_H - 12) * (1 - (v - m.minV) / m.rangeV);
            const scaleX = i => LABEL_W + i * COL_W;
            const pts = m.vals.map((v,i) => ({ x:scaleX(i), y:isNaN(v)?null:scaleY(v), v }));
            const validPts = pts.filter(p=>p.y!==null);
            let pathD = "";
            validPts.forEach((p,i) => { pathD += `${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)} `; });

            return (
              <g key={m.key}>
                <rect x={0} y={rowY} width={chartW} height={ROW_H} fill={mi%2===0?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.18)"}/>
                <rect x={0} y={rowY} width={LABEL_W} height={ROW_H} fill="rgba(0,0,0,0.28)"/>
                <line x1={LABEL_W} y1={rowY} x2={LABEL_W} y2={rowY+ROW_H} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                <text x={8} y={rowY+18} fill={m.color} fontSize="9.5" fontWeight="700">{m.label}</text>
                <text x={8} y={rowY+30} fill="rgba(255,255,255,0.35)" fontSize="8">({m.unit})</text>
                {sorted.map((_,i)=>(
                  <line key={i} x1={scaleX(i)} y1={rowY} x2={scaleX(i)} y2={rowY+ROW_H} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                ))}
                {pathD && <path d={pathD} fill="none" stroke={m.color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>}
                {pts.map((p,i) => p.y===null ? null : (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={DOT_R} fill={m.color} stroke={T.bg} strokeWidth="1.5"/>
                    <text x={p.x} y={Math.max(rowY+12, Math.min(p.y-5, rowY+ROW_H-10))} textAnchor="middle" fill={m.color} fontSize="8" fontWeight="700">{p.v.toFixed(1)}</text>
                  </g>
                ))}
                <line x1={0} y1={rowY+ROW_H} x2={chartW} y2={rowY+ROW_H} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
              </g>
            );
          })}
          <g>
            <rect x={0} y={metricData.length*ROW_H} width={chartW} height={DATE_H} fill="rgba(0,0,0,0.35)"/>
            <rect x={0} y={metricData.length*ROW_H} width={LABEL_W} height={DATE_H} fill="rgba(0,0,0,0.45)"/>
            <text x={8} y={metricData.length*ROW_H+17} fill="rgba(255,255,255,0.3)" fontSize="8">Datum</text>
            {dateLabels.map((lbl,i)=>(
              <text key={i} x={LABEL_W + i*COL_W} y={metricData.length*ROW_H+18} textAnchor="middle" fill={T.muted} fontSize="8.5" fontWeight="600">{lbl}</text>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

// ─── REUSABLE RECORD SECTION ──────────────────────────────────────────────────
function RecordSection({ records, setRecords, metrics, addFields, emptyForm }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState(emptyForm);
  const [deletingId, setDel]= useState(null);

  const parseDate = s => {
    const p = s.replace(/\s/g,"").split(".");
    return new Date(parseInt(p[2]||"2026"), parseInt(p[1]||"1")-1, parseInt(p[0]||"1"));
  };
  const sorted = [...records].sort((a,b)=>parseDate(a.date)-parseDate(b.date));
  const last = sorted[sorted.length-1];

  return (
    <div style={{ padding:"0 18px" }}>
      {last && (
        <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" }}>
          {metrics.filter(m=>last[m.key]).map(m=>(
            <div key={m.key} style={{ flex:"1 1 40%",background:T.bgCard,borderRadius:10,padding:"10px 12px",border:`1px solid ${m.color}33` }}>
              <div style={{ color:m.color,fontWeight:800,fontSize:17 }}>{last[m.key]} <span style={{ fontSize:10,fontWeight:600 }}>{m.unit}</span></div>
              <div style={{ color:T.muted,fontSize:10,marginTop:2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}
      <InbodyChart records={sorted} metrics={metrics}/>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
        <div style={{ color:T.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1 }}>Záznamy</div>
        <span style={{ color:T.muted,fontSize:10 }}>{records.length} záznamů</span>
      </div>
      {adding ? (
        <Card style={{ padding:"16px",marginBottom:12 }}>
          <div style={{ color:T.white,fontWeight:700,fontSize:14,marginBottom:12 }}>Nový záznam</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
            {addFields.map(([lbl,key,ph])=>(
              <div key={key} style={{ gridColumn:key==="date"?"span 2":"auto" }}>
                <div style={{ color:T.muted,fontSize:9,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:1 }}>{lbl}</div>
                <input value={form[key]||""} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} placeholder={ph}
                  style={{ width:"100%",boxSizing:"border-box",background:T.bg,border:`1px solid ${T.borderDim}`,borderRadius:8,color:T.white,fontSize:13,padding:"8px 10px",outline:"none",fontFamily:"inherit" }}/>
              </div>
            ))}
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <Btn small variant="ghost" style={{ flex:1 }} onClick={()=>{setAdding(false);setForm(emptyForm);}}>Zrušit</Btn>
            <Btn small style={{ flex:1 }} onClick={()=>{ if(!form.date)return; setRecords(prev=>[...prev,{id:"r"+Date.now(),...form}]); setAdding(false); setForm(emptyForm); }}>Uložit</Btn>
          </div>
        </Card>
      ):(
        <button onClick={()=>setAdding(true)} style={{ width:"100%",marginBottom:12,background:"transparent",border:`1.5px dashed ${T.accent}55`,color:T.accent,borderRadius:10,padding:"11px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>+ Přidat záznam</button>
      )}
      {/* Table-style records list */}
      {sorted.length > 0 && (
        <div style={{ marginBottom:12,background:"rgba(0,0,0,0.3)",borderRadius:10,border:`1px solid ${T.borderDim}`,overflow:"hidden",boxShadow:T.shadowSm }}>
          {/* Header row */}
          <div style={{ display:"flex",background:"rgba(0,0,0,0.35)",borderBottom:`1px solid ${T.borderDim}`,padding:"7px 10px" }}>
            <div style={{ width:88,color:"rgba(255,255,255,0.35)",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,flexShrink:0 }}>Datum</div>
            {metrics.map(m=>(
              <div key={m.key} style={{ flex:1,color:m.color,fontSize:9,fontWeight:700,textAlign:"right",textTransform:"uppercase",letterSpacing:0.8,paddingRight:6 }}>
                {m.label}
              </div>
            ))}
            <div style={{ width:20 }}/>
          </div>
          {/* Data rows newest first */}
          {[...sorted].reverse().map((r,ri)=>(
            <div key={r.id} style={{ display:"flex",alignItems:"center",padding:"8px 10px",borderBottom:ri<sorted.length-1?`1px solid rgba(255,255,255,0.04)`:"none",background:ri%2===0?"transparent":"rgba(255,255,255,0.015)" }}>
              {deletingId===r.id ? (
                <div style={{ flex:1,display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ color:T.muted,fontSize:11,flex:1 }}>Smazat záznam?</span>
                  <button onClick={()=>setDel(null)} style={{ background:T.bgCard2,border:`1px solid ${T.borderDim}`,borderRadius:6,color:T.muted,fontSize:10,cursor:"pointer",padding:"3px 8px",fontFamily:"inherit" }}>Zrušit</button>
                  <button onClick={()=>{setRecords(prev=>prev.filter(x=>x.id!==r.id));setDel(null);}} style={{ background:T.danger+"22",border:`1px solid ${T.danger}55`,borderRadius:6,color:T.danger,fontSize:10,cursor:"pointer",padding:"3px 8px",fontFamily:"inherit" }}>Smazat</button>
                </div>
              ):(
                <>
                  <div style={{ width:88,color:T.muted,fontSize:10,fontWeight:600,flexShrink:0 }}>{r.date}</div>
                  {metrics.map(m=>(
                    <div key={m.key} style={{ flex:1,textAlign:"right",paddingRight:6 }}>
                      {r[m.key] ? <span style={{ color:m.color,fontWeight:700,fontSize:13 }}>{r[m.key]} <span style={{ fontSize:9,fontWeight:500,opacity:0.7 }}>{m.unit}</span></span>
                        : <span style={{ color:"rgba(255,255,255,0.15)",fontSize:11 }}>–</span>}
                    </div>
                  ))}
                  <button onClick={()=>setDel(r.id)} style={{ width:20,background:"none",border:"none",color:"rgba(255,255,255,0.2)",cursor:"pointer",fontSize:13,lineHeight:1,padding:0,flexShrink:0 }}>×</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {records.length===0&&<div style={{ textAlign:"center",padding:"20px 0",color:T.muted,fontSize:13 }}>Zatím žádné záznamy.</div>}
    </div>
  );
}

// ─── SCREEN: PROFIL ──────────────────────────────────────────────────────────
function ProfileScreen({ history, onReactivate, suggestedPlans, setSuggestedPlans, library, userProfile, onUpdateProfile, onLogout }) {
  const [tab,setTab] = useState("telo");
  const [profil, setProfil]         = useState({ vyska: userProfile?.vyska||"", vek: userProfile?.vek||"", pohlavi: userProfile?.pohlavi||"" });
  const [editProfil, setEditProfil] = useState(false);
  const [profilForm, setProfilForm] = useState({ ...profil });
  const [prs,setPrs] = useState([]);
  const [addingPr,setAddingPr] = useState(false);
  const [newPr,setNewPr]       = useState({name:"",value:"",partie:undefined});

  const BODY_METRICS = [
    { key:"weight", label:"Hmotnost",       unit:"kg", color:"#2E9FAF" },
    { key:"muscle", label:"Svaly",          unit:"kg", color:"#00CC00" },
    { key:"fat",    label:"Tuk",            unit:"%",  color:"#FF6B6B" },
    { key:"vfat",   label:"Viscerální tuk", unit:"%",  color:"#FF9500" },
  ];
  const [bodyRecords, setBodyRecords] = useState([]);

  const MIRY_METRICS = [
    { key:"hrudnik", label:"Hrudník", unit:"cm", color:"#2E9FAF" },
    { key:"pas",     label:"Pas",     unit:"cm", color:"#FF9500" },
    { key:"boky",    label:"Boky",    unit:"cm", color:"#FF6B6B" },
    { key:"paze",    label:"Paže",    unit:"cm", color:"#FF00FF" },
    { key:"stehno",  label:"Stehno",  unit:"cm", color:"#00CC00" },
    { key:"lytko",   label:"Lýtko",   unit:"cm", color:"#00CCFF" },
  ];
  const [miryRecords, setMiryRecords] = useState([]);

  const tabs = [
    {id:"telo",    label:"Tělo"},
    {id:"miry",    label:"Míry"},
    {id:"rekordy", label:"Rekordy"},
    {id:"plany",   label:"Plány"},
  ];

  return (
    <div style={{ paddingBottom:90 }}>
      <div style={{ padding:"20px 18px 14px" }}>
        {editProfil ? (
          <Card style={{ padding:"16px" }}>
            <div style={{ color:T.white,fontWeight:700,fontSize:14,marginBottom:12 }}>Upravit profil</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12 }}>
              {[["Výška (cm)","vyska"],["Věk","vek"],["Pohlaví","pohlavi"]].map(([lbl,key])=>(
                <div key={key}>
                  <div style={{ color:T.muted,fontSize:9,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:1 }}>{lbl}</div>
                  <input value={profilForm[key]} onChange={e=>setProfilForm(p=>({...p,[key]:e.target.value}))}
                    style={{ width:"100%",boxSizing:"border-box",background:T.bg,border:`1px solid ${T.borderDim}`,borderRadius:7,color:T.white,fontSize:13,padding:"7px 8px",outline:"none",fontFamily:"inherit" }}/>
                </div>
              ))}
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <Btn small variant="ghost" style={{ flex:1 }} onClick={()=>{setEditProfil(false);setProfilForm({...profil});}}>Zrušit</Btn>
              <Btn small style={{ flex:1 }} onClick={()=>{
                setProfil({...profilForm});
                if(onUpdateProfile) onUpdateProfile(prev=>({...prev,...profilForm}));
                setEditProfil(false);
              }}>Uložit</Btn>
            </div>
          </Card>
        ):(
          <Card style={{ padding:"16px",display:"flex",gap:14,alignItems:"center" }}>
            <div style={{ width:52,height:52,borderRadius:13,flexShrink:0,background:`linear-gradient(135deg,${T.accentDim},${T.accentBtn})`,
            border: `1px solid ${T.accent}`,
            display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:20 }}>{(userProfile?.jmeno||'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", color:T.white,fontWeight:700,fontSize:20,lineHeight:1.2, textTransform: "uppercase", }}>{userProfile?.jmeno||"Profil"}</div>
              <div style={{ display:"flex",gap:10,marginTop:4,flexWrap:"wrap" }}>
                {profil.vyska&&<span style={{ color:T.muted,fontSize:11 }}>📏 {profil.vyska} cm</span>}
                {profil.vek&&<span style={{ color:T.muted,fontSize:11 }}>🎂 {profil.vek} let</span>}
                {profil.pohlavi&&<span style={{ color:T.muted,fontSize:11 }}>⚧ {profil.pohlavi}</span>}
              </div>
             
            </div>
            <button onClick={()=>{setEditProfil(true);setProfilForm({...profil});}}
              style={{ background:T.bgCard2,border:`1px solid ${T.borderDim}`,color:T.muted,borderRadius:8,padding:"5px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0 }}>✏️</button>
            <button onClick={onLogout}
              style={{ background:"transparent", border:`1px solid rgba(112,48,160,0.4)`, color:"#7030A0", borderRadius:8, padding:"5px 10px", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0, marginLeft:4 }}>Odhlásit
              </button>
          </Card>
        )}
      </div>

      <div style={{ display:"flex",padding:"0 18px 16px",gap:0 }}>
        {tabs.map((t,i)=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1, background:tab===t.id?T.accentBtn:T.bgCard, color:tab===t.id?"#fff":T.muted,
            border:`1px solid ${tab===t.id?T.accent:T.borderDim}`,
            padding:"9px 2px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            borderRadius: i===0?"8px 0 0 8px":i===tabs.length-1?"0 8px 8px 0":"0",
          }}>{t.label}</button>
        ))}
      </div>

      {tab==="telo"&&(
        <RecordSection records={bodyRecords} setRecords={setBodyRecords} metrics={BODY_METRICS}
          addFields={[["Datum","date","9. 4. 2026"],["Hmotnost (kg)","weight","85.6"],["Svaly (kg)","muscle","44.6"],["Tuk (%)","fat","9.0"],["Viscerální tuk (%)","vfat","7"]]}
          emptyForm={{date:"",weight:"",muscle:"",fat:"",vfat:""}}/>
      )}

      {tab==="miry"&&(
        <RecordSection records={miryRecords} setRecords={setMiryRecords} metrics={MIRY_METRICS}
          addFields={[["Datum","date","9. 4. 2026"],["Hrudník (cm)","hrudnik","102"],["Pas (cm)","pas","80"],["Boky (cm)","boky","97"],["Paže (cm)","paze","39"],["Stehno (cm)","stehno","57"],["Lýtko (cm)","lytko","39"]]}
          emptyForm={{date:"",hrudnik:"",pas:"",boky:"",paze:"",stehno:"",lytko:""}}/>
      )}

      {tab==="rekordy"&&(
        <div style={{ padding:"0 18px" }}>
          {prs.map((p,i)=>{
            const partieColor = p.partie ? (PARTIE[p.partie]?.color||T.accent) : T.accent;
            return (
            <Card key={i} style={{ padding:"13px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",borderLeft:`3px solid ${partieColor}` }}>
              <div>
                <div style={{ color:T.white,fontWeight:600,fontSize:14 }}>{p.name}</div>
                <div style={{ display:"flex",gap:8,marginTop:3,alignItems:"center" }}>
                  <div style={{ color:T.muted,fontSize:10 }}>{p.date}</div>
                  {p.partie&&<span style={{ color:partieColor,fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:20,border:`1px solid ${partieColor}44`,background:partieColor+"18" }}>{PARTIE[p.partie]?.label}</span>}
                </div>
              </div>
              <div style={{ background:partieColor+"18",border:`1px solid ${partieColor}44`,color:partieColor,fontWeight:800,fontSize:16,padding:"6px 14px",borderRadius:9,boxShadow:`0 0 12px ${partieColor}22` }}>{p.value} kg</div>
            </Card>
            );
          })}
          {addingPr?(
            <Card style={{ padding:"16px",marginTop:8 }}>
              <div style={{ color:T.white,fontWeight:700,fontSize:14,marginBottom:12 }}>Nový rekord</div>
              {[["Cvik","name"],["Váha (kg)","value"]].map(([lbl,key])=>(
                <div key={key} style={{ marginBottom:10 }}>
                  <div style={{ color:T.muted,fontSize:10,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:1 }}>{lbl}</div>
                  <input value={newPr[key]} onChange={e=>setNewPr(p=>({...p,[key]:e.target.value}))}
                    style={{ width:"100%",boxSizing:"border-box",background:T.bg,border:`1px solid ${T.borderDim}`,borderRadius:8,color:T.white,fontSize:13,padding:"9px 12px",outline:"none",fontFamily:"inherit" }}/>
                </div>
              ))}
              {/* Partie selector */}
              <div style={{ marginBottom:12 }}>
                <div style={{ color:T.muted,fontSize:10,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1 }}>Partie</div>
                <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                  {Object.entries(PARTIE).map(([k,p])=>(
                    <button key={k} onClick={()=>setNewPr(prev=>({...prev,partie:prev.partie===k?undefined:k}))}
                      style={{ display:"flex",alignItems:"center",gap:4,background:newPr.partie===k?p.color+"28":T.bgCard2,border:`1.5px solid ${newPr.partie===k?p.color:T.borderDim}`,borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:newPr.partie===k?p.color:T.muted }}>
                      <span style={{ width:6,height:6,borderRadius:2,background:p.color,display:"inline-block" }}/>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex",gap:8,marginTop:4 }}>
                <Btn small variant="ghost" style={{ flex:1 }} onClick={()=>setAddingPr(false)}>Zrušit</Btn>
                <Btn small style={{ flex:1 }} onClick={()=>{if(!newPr.name||!newPr.value)return;setPrs(prev=>[...prev,{...newPr,date:new Date().toLocaleDateString("cs-CZ")}]);setNewPr({name:"",value:""});setAddingPr(false);}}>Uložit</Btn>
              </div>
            </Card>
          ):(
            <button onClick={()=>setAddingPr(true)} style={{ width:"100%",marginTop:8,background:"transparent",border:`1.5px dashed ${T.accent}55`,color:T.accent,borderRadius:10,padding:"11px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>+ Přidat rekord</button>
          )}
        </div>
      )}

      {tab==="plany"&&(
        <div style={{ padding:"0 18px" }}>
          {/* Suggested / recommended plans from trainer */}
          {(suggestedPlans?.["c_self"]||[]).length>0&&(
            <div style={{ marginBottom:16 }}>
              <div style={{ color:T.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>📋 Navrhované trenérem</div>
              {(suggestedPlans["c_self"]||[]).map((sp,i)=>{
                const tmpl = library?.find(t=>t.id===sp.templateId);
                return (
                  <Card key={i} style={{ padding:"14px",marginBottom:10,border:`1px solid rgba(255,149,0,0.35)`,background:`linear-gradient(180deg,rgba(255,149,0,0.08),rgba(30,30,30,0.95))` }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                      <div>
                        <div style={{ color:"#FF9500",fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:3 }}>Doporučení od trenéra</div>
                        <div style={{ color:T.white,fontWeight:700,fontSize:14 }}>{sp.name}</div>
                        <div style={{ color:T.muted,fontSize:10,marginTop:2 }}>Navrženo: {sp.date}</div>
                      </div>
                      <button onClick={()=>setSuggestedPlans(prev=>({...prev,c_self:(prev.c_self||[]).filter((_,j)=>j!==i)}))} style={{ background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15 }}>×</button>
                    </div>
                    {tmpl
                      ? <Btn full onClick={()=>{ onReactivate(tmpl.id); setSuggestedPlans(prev=>({...prev,c_self:(prev.c_self||[]).filter((_,j)=>j!==i)})); }}>Aktivovat plán →</Btn>
                      : <div style={{ color:T.muted,fontSize:12,textAlign:"center" }}>Plán byl odstraněn</div>}
                  </Card>
                );
              })}
            </div>
          )}
          {/* Completed plans history */}
          {history.length>0&&<div style={{ color:T.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>Historie</div>}
          {history.map((h,i)=>(
            <Card key={i} style={{ padding:"16px",marginBottom:10 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                <div><div style={{ color:T.white,fontWeight:700,fontSize:14 }}>{h.name}</div><div style={{ color:T.muted,fontSize:11,marginTop:2 }}>{h.date}</div></div>
                <span style={{ background:T.bgCard2,color:T.muted,fontSize:10,padding:"2px 8px",borderRadius:20,border:`1px solid ${T.borderDim}` }}>Dokončeno</span>
              </div>
              <Btn small variant="secondary" full onClick={()=>onReactivate(h.templateId)}>Znovu aktivovat (nová instance)</Btn>
            </Card>
          ))}
          {history.length===0&&(suggestedPlans?.["c_self"]||[]).length===0&&<div style={{ textAlign:"center",padding:"20px 0",color:T.muted,fontSize:13 }}>Žádné plány.</div>}
        </div>
      )}
    </div>
  );
}


// ─── LOGO (real PNG) ─────────────────────────────────────────────────────────
function LogoMark({ size=120 }) {
  return (
    <img
      src="/logo.png"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
      alt="logo"
    />
  );
}

// ─── ONBOARDING SCREEN ───────────────────────────────────────────────────────
function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState("splash"); // splash | role | form | login
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({ jmeno:"", email:"", heslo:"", pohlavi:"", vek:"", vyska:"", vaha:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Splash auto-advance
  useEffect(() => {
    if (step==="splash") {
      const t = setTimeout(()=>setStep("role"), 999999);
      return ()=>clearTimeout(t);
    }
  }, [step]);

  const iS = {
    width:"100%", boxSizing:"border-box",
    background:"rgba(255,255,255,0.06)", border:`1px solid rgba(255,255,255,0.12)`,
    borderRadius:10, color:"#EEEEEE", fontSize:14, padding:"12px 14px",
    outline:"none", fontFamily:"inherit", marginBottom:14,
  };

  // ── SPLASH ──
  if (step === "splash") return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"Inter, sans-serif", padding:"40px 20px", textAlign:"center" }}>
      <div style={{ marginBottom:10 }}><LogoMark size={180}/></div>
      <img src="/title.png" alt="Změň své tělo" style={{ width:320, marginTop:0, marginBottom:10, display:"block" }}/>
      <p style={{ color:"#aaa", marginBottom:20, fontSize:14 }}>Vítej! Kdo jsi?</p>
      <div style={{ width:"100%", maxWidth:320 }}>
        <div onClick={()=>{ setRole("client"); setStep("form"); }} style={{ padding:"18px 20px", borderRadius:16, background:"rgba(24,75,94,0.25)", border:"1px solid rgba(46,159,175,0.50)", cursor:"pointer", marginBottom:12 }}>
          <div style={{ fontSize:22, marginBottom:6 }}>🏋️‍♂️</div>
          <div style={{ fontWeight:600, color:"#fff" }}>Jsem klient</div>
          <div style={{ fontSize:12, color:"#aaa" }}>Trénuji podle plánu od trenéra</div>
        </div>
        <div onClick={()=>{ setRole("trainer"); setStep("form"); }} style={{ marginBottom:12, padding:"18px 20px", borderRadius:16, background:"#111", border:"1px solid rgba(255,255,255,0.08)", cursor:"pointer" }}>
          <div style={{ fontSize:22, marginBottom:6 }}>💪</div>
          <div style={{ fontWeight:600, color:"#fff" }}>Jsem trenér</div>
          <div style={{ fontSize:12, color:"#aaa" }}>Vytvářím tréninky a spravuji klienty</div>
        </div>
        <div onClick={()=>setStep("login")} style={{ padding:"18px 20px", borderRadius:16, background:"#111", border:"1px solid rgba(255,255,255,0.08)", cursor:"pointer" }}>
          <div style={{ fontSize:22, marginBottom:6 }}>🔑</div>
          <div style={{ fontWeight:600, color:"#fff" }}>Už mám účet</div>
          <div style={{ fontSize:12, color:"#aaa" }}>Přihlásit se k existujícímu účtu</div>
        </div>
      </div>
    </div>
  );

  // ── PŘIHLÁŠENÍ ──
  if (step === "login") return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:"0 24px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
      <div style={{ marginBottom:24, textAlign:"center" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}><LogoMark size={90}/></div>
        <img src="/title.png" alt="Změň své tělo" style={{ width:250, marginBottom:20, display:"block", margin:"0 auto 20px" }}/>
        <div style={{ fontFamily:"Rajdhani, sans-serif", textTransform:"uppercase", color:"#EEEEEE", fontSize:17, fontWeight:700, marginBottom:4 }}>Přihlášení</div>
        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>Zadej email a heslo</div>
      </div>
      <div style={{ maxWidth:380, margin:"0 auto", width:"100%" }}>
        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Email</div>
        <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="tvuj@email.cz" style={iS}/>
        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Heslo</div>
        <input type="password" value={form.heslo} onChange={e=>setForm(p=>({...p,heslo:e.target.value}))} placeholder="••••••••" style={iS}/>
        {error&&<div style={{ color:"#e05555", fontSize:12, marginBottom:10, textAlign:"center" }}>{error}</div>}
        <button onClick={async ()=>{
          setError(""); setLoading(true);
          const { data, error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.heslo });
          if (err) { setError("Špatný email nebo heslo."); setLoading(false); return; }
          // Načti profil z databáze
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
          setLoading(false);
          if (profile) onComplete(profile);
          else setError("Profil nenalezen. Zkus se zaregistrovat.");
        }} style={{ width:"100%", marginTop:10, background:"#184b5e", border:`2px solid #2E9FAF`, borderRadius:12, color:"#fff", padding:"15px", fontWeight:900, fontSize:15, cursor:"pointer", fontFamily:"Rajdhani, sans-serif", textTransform:"uppercase", letterSpacing:0.5 }}>
          {loading ? "Přihlašuji..." : "Přihlásit se →"}
        </button>
        <button onClick={()=>setStep("splash")} style={{ width:"100%", marginTop:10, background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>← Zpět</button>
      </div>
    </div>
  );

  // ── REGISTRAČNÍ FORMULÁŘ ──
  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:"0 24px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
      <div style={{ marginBottom:24, textAlign:"center" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}><LogoMark size={90}/></div>
        <img src="/title.png" alt="Změň své tělo" style={{ width:250, marginBottom:20, display:"block", margin:"0 auto 20px" }}/>
        <div style={{ fontFamily:"Rajdhani, sans-serif", textTransform:"uppercase", color:"#EEEEEE", fontSize:17, fontWeight:700, marginBottom:4 }}>{role==="trainer"?"Profil trenéra":"Profil klienta"}</div>
        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>Vyplň základní údaje</div>
      </div>
      <div style={{ maxWidth:380, margin:"0 auto", width:"100%" }}>

        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Jméno a příjmení *</div>
        <input value={form.jmeno} onChange={e=>setForm(p=>({...p,jmeno:e.target.value}))} style={iS}/>

        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Email *</div>
        <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="tvuj@email.cz" style={iS}/>

        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Heslo *</div>
        <input type="password" value={form.heslo} onChange={e=>setForm(p=>({...p,heslo:e.target.value}))} placeholder="min. 6 znaků" style={iS}/>

        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Pohlaví</div>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          {["muž","žena"].map(g=>(
            <button key={g} onClick={()=>setForm(p=>({...p,pohlavi:g}))} style={{
              flex:1, background:form.pohlavi===g?"rgba(46,159,175,0.2)":"rgba(255,255,255,0.05)",
              border:`1.5px solid ${form.pohlavi===g?"#2E9FAF":"rgba(255,255,255,0.1)"}`,
              borderRadius:10, padding:"10px", color:form.pohlavi===g?"#2E9FAF":"rgba(255,255,255,0.5)",
              fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize",
            }}>{g==="muž"?"♂ Muž":"♀ Žena"}</button>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:4 }}>
          {[["Věk (let)","vek"],["Výška (cm)","vyska"],["Váha (kg)","vaha"]].map(([lbl,key])=>(
            <div key={key}>
              <div style={{ color:"rgba(255,255,255,0.5)", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:5 }}>{lbl}</div>
              <input value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}
                style={{ ...iS, marginBottom:0, textAlign:"center", padding:"12px 8px" }}/>
            </div>
          ))}
        </div>

        {error&&<div style={{ color:"#e05555", fontSize:12, marginTop:10, textAlign:"center" }}>{error}</div>}

        <button onClick={async ()=>{
          if (!form.jmeno.trim()) { setError("Zadej prosím jméno."); return; }
          if (!form.email.trim()) { setError("Zadej prosím email."); return; }
          if (form.heslo.length < 6) { setError("Heslo musí mít alespoň 6 znaků."); return; }
          setLoading(true); setError("");
          // Registrace v Supabase Auth
          const { data, error: err } = await supabase.auth.signUp({ email: form.email, password: form.heslo });
          if (err) { setError(err.message); setLoading(false); return; }
          // Uložení profilu do tabulky profiles
          const profile = { id: data.user.id, role, jmeno: form.jmeno, email: form.email, pohlavi: form.pohlavi, vek: form.vek, vyska: form.vyska, vaha: form.vaha };
          await supabase.from("profiles").insert(profile);
          setLoading(false);
          onComplete(profile);
        }} style={{
          width:"100%", marginTop:20, background:"#184b5e",
          border:`2px solid #2E9FAF`, borderRadius:12, color:"#fff",
          padding:"15px", fontWeight:900, fontSize:15, cursor:"pointer",
          fontFamily:"Rajdhani, sans-serif", textTransform:"uppercase",
          letterSpacing:0.5, boxShadow:"0 4px 20px rgba(46,159,175,0.4)",
        }}>{loading ? "Registruji..." : "Vstoupit do aplikace →"}</button>

        <button onClick={()=>setStep("splash")} style={{ width:"100%", marginTop:10, background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>← Zpět</button>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
const NAV_CLIENT  = [{id:"workout",label:"Trénink",icon:"🏋️‍♂️"},{id:"exercises",label:"Cviky",icon:"💪"},{id:"library",label:"Plány",icon:"📋"},{id:"profile",label:"Profil",icon:"👤"}];
const NAV_TRAINER = [{id:"workout",label:"Trénink",icon:"🏋️‍♂️"},{id:"exercises",label:"Cviky",icon:"💪"},{id:"library",label:"Plány",icon:"📋"},{id:"clients",label:"Klienti",icon:"👥"},{id:"profile",label:"Profil",icon:"👤"}];

const STORAGE_KEY = "treninkova-appka-data-v1";

export default function App() {
  const [userProfile, setUserProfile] = useState(null); // null = not logged in
  const [isTrainer,setIsTrainer]   = useState(true);
  const [screen,setScreen]         = useState("workout");
  const [library,setLibrary]       = useState(SEED_TEMPLATES);
  const [exercises,setExercises]   = useState(SEED_EXERCISES);
  const [groups,setGroups]         = useState(SEED_GROUPS);
  const [activeInstance,setActive] = useState(null);
  const [history,setHistory]       = useState([]);
  const [exData,setExData]         = useState({});
  const [suggestedPlans,setSuggestedPlans] = useState({});
  const [saveStatus,setSaveStatus] = useState("idle");
  const [loaded, setLoaded]        = useState(false);
  const saveTimerRef               = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
          if (profile) {
            setUserProfile(profile);
            setIsTrainer(profile.role === "trainer");
          }
        }
        const result = await window.storage?.get(STORAGE_KEY);
        const { data: exData2 } = await supabase.from('exercises').select('*');
        setExercises((exData2 || []).map(e => ({ ...e, desc: e.description, mediaUrl: e.media_url, groupId: e.group_id })));
        const { data: plansData } = await supabase.from('plans').select('*');
        if (plansData && plansData.length > 0) {
          setLibrary(plansData.map(p => ({ ...p, desc: p.description, blocks: p.blocks || [] })));
        }
        const { data: assignments } = await supabase.from('plan_assignments')
          .select('*')
          .eq('client_id', session?.user?.id)
          .eq('completed', false);
        const assignedPlanIds = (assignments || []).map(a => a.plan_id);
          const { data: progressList } = await supabase
            .from('user_progress')
            .select('plan_id')
            .eq('user_id', session?.user?.id)
            .eq('active', true);
          const activePlanIds = (progressList || []).map(p => p.plan_id);
          const newAssignedPlanIds = assignedPlanIds.filter(id => !activePlanIds.includes(id));
          setSuggestedPlans(prev => ({ ...prev, assignedPlanIds, newAssignedPlanIds }));
        if (session) {
          const { data: progressList } = await supabase.from('user_progress')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('active', true);
          const progress = progressList?.[0] || null;
          if (progress) {
            setActive({ templateId: progress.plan_id, startDate: progress.started_at, progressId: progress.id });
            setExData(progress.ex_data || {});
            console.log("ACTIVE NAČTENO:", progress.plan_id);
          }
        }
        if (result?.value) {
          const d = JSON.parse(result.value);
          if (d.groups)         setGroups(d.groups);
          if (d.history)        setHistory(d.history);
          if (d.suggestedPlans) setSuggestedPlans(prev => ({ ...d.suggestedPlans, assignedPlanIds: prev.assignedPlanIds, newAssignedPlanIds: prev.newAssignedPlanIds }));
          if (d.activeInstance) {} // záměrně ignorujeme - načítáme ze Supabase
        }
      } catch(e) { console.error("Load error:", e); }
      setLoaded(true);
    }
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        load();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── REALTIME: plan_assignments ──────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile) return;
  
    let channel = null;
  
    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id;
      if (!userId) return;
  
      channel = supabase
        .channel('plan-assignments-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'plan_assignments',
            filter: `client_id=eq.${userId}`,
          },
          async () => {
            const { data: assignments } = await supabase
              .from('plan_assignments')
              .select('*')
              .eq('client_id', userId)
              .eq('completed', false);
  
              const assignedPlanIds = (assignments || []).map(a => a.plan_id);
              setSuggestedPlans(prev => ({
                ...prev,
                assignedPlanIds,
                newAssignedPlanIds: assignedPlanIds
              }));
              
          }
        )
        .subscribe();
    });
  
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userProfile]);

  // ─── REALTIME: exercises & plans ─────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('exercises-and-plans-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exercises' },
      async () => {
        const { data } = await supabase.from('exercises').select('*');
        setExercises((data || []).map(e => ({ ...e, desc: e.description, mediaUrl: e.media_url, groupId: e.group_id })));
      }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' },
        async () => {
          const { data } = await supabase.from('plans').select('*');
          setLibrary(data?.map(p => ({ ...p, desc: p.description, blocks: p.blocks || [] })) || []);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");
    saveTimerRef.current = setTimeout(async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify({ userProfile, library, exercises, groups, history, exData, suggestedPlans }));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch(e) { setSaveStatus("error"); }
    }, 800);
  }, [userProfile, library, exercises, groups, activeInstance, history, exData, suggestedPlans, loaded]);

  async function handleActivate(templateId) {
    if (templateId==="goto-library") { setScreen("library"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (activeInstance) {
      const tmpl=library.find(t=>t.id===activeInstance.templateId);
      setHistory(prev=>[...prev,{templateId:activeInstance.templateId,name:tmpl?.name||"Trénink",date:activeInstance.startDate,weeks:6}]);
      if (activeInstance.progressId) {
        await supabase.from('user_progress').update({ active: false }).eq('id', activeInstance.progressId);
      }
    }
    const { data: newProgress } = await supabase.from('user_progress').insert([{
      user_id: user.id,
      plan_id: templateId,
      completed_weeks: [],
      ex_data: { _initialized: true },
      active: true,
    }]).select().single();
    setActive({ templateId, startDate: new Date().toLocaleDateString("cs-CZ"), progressId: newProgress?.id });
    setExData({ _initialized: true });
    setSuggestedPlans(prev => ({
      ...prev,
      newAssignedPlanIds: (prev.newAssignedPlanIds || []).filter(id => id !== templateId)
    }));
    setScreen("workout");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserProfile(null);
    setIsTrainer(true);
    setScreen("workout");
  }

  function handleOnboardingComplete(profile) {
    setUserProfile(profile);
    setIsTrainer(profile.role==="trainer");
    setScreen("profile");
  }

  // Loading splash
  if (!loaded) return (
    <div style={{ minHeight:"100vh",background:"#0a0a0a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <LogoMark size={80}/>
        <div style={{ color:"rgba(255,255,255,0.3)",fontSize:12,marginTop:16,letterSpacing:2 }}>NAČÍTÁM...</div>
      </div>
    </div>
  );

  // Onboarding – show if no user profile saved
  if (!userProfile) return (
    <div style={{ maxWidth:430,margin:"0 auto" }}>
      <OnboardingScreen onComplete={handleOnboardingComplete}/>
    </div>
  );

  const nav = isTrainer ? NAV_TRAINER : NAV_CLIENT;
  const saveIndicator = saveStatus==="saving"?{color:T.muted,text:"Ukládám..."} : saveStatus==="saved"?{color:T.accent,text:"✓ Uloženo"} : null;
  

  return (
    <div style={{ minHeight:"100vh",background:`#0d0d0d`,fontFamily:"'DM Sans','Segoe UI',sans-serif",color:T.white,maxWidth:430,margin:"0 auto",position:"relative" }}>
      {/* Save indicator – minimal, top right */}
      {saveIndicator&&(
        <div style={{ position:"fixed",top:12,right:14,zIndex:200,fontSize:9,fontWeight:700,color:saveIndicator.color }}>
          {saveIndicator.text}
        </div>
      )}
      <div style={{ minHeight:"calc(100vh - 72px)" }}>
        {screen==="workout" && <WorkoutScreen activeInstance={activeInstance} onActivate={handleActivate} library={library} setLibrary={setLibrary} exercises={exercises} groups={groups} exData={exData} setExData={setExData} setSuggestedPlans={setSuggestedPlans}/>}
        {screen==="exercises" && <ExercisesScreen exercises={exercises} setExercises={setExercises} isTrainer={isTrainer} groups={groups} setGroups={setGroups}/>}
        {screen==="library"   && <LibraryScreen library={library} setLibrary={setLibrary} activeInstance={activeInstance} onActivate={handleActivate} isTrainer={isTrainer} exercises={exercises} groups={groups} suggestedPlans={suggestedPlans}/>}
        {screen==="clients"   && isTrainer && <ClientsScreen library={library} suggestedPlans={suggestedPlans} setSuggestedPlans={setSuggestedPlans}/>}
        {screen==="profile"   && <ProfileScreen history={history} onReactivate={handleActivate} suggestedPlans={suggestedPlans} setSuggestedPlans={setSuggestedPlans} library={library} userProfile={userProfile} onUpdateProfile={setUserProfile} onLogout={handleLogout}/>}
      </div>
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:`#111111`,borderTop:`1px solid rgba(255,255,255,0.08)`,boxShadow:`0 -6px 24px rgba(0,0,0,0.8)`,display:"flex",justifyContent:"space-around",padding:"8px 0 20px",zIndex:100 }}>
        {nav.map(item=>(
          <button key={item.id} onClick={()=>setScreen(item.id)} style={{ background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",padding:"3px 10px",fontFamily:"inherit" }}>
            <span style={{ fontSize:nav.length>4?18:20 }}>{item.icon}</span>
            <span style={{ fontSize:nav.length>4?9:10,fontWeight:700,color:screen===item.id?T.accent:T.muted,transition:"color 0.2s" }}>{item.label}</span>
            {screen===item.id&&<span style={{ width:18,height:2,borderRadius:1,background:T.accentBtn,marginTop:-1 }}/>}
          </button>
        ))}
      </div>
    </div>
  );
}
