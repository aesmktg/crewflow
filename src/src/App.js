import React, { useState, useEffect, useRef, useContext } from 'react';
import { supabase } from './supabaseClient';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = ['Audio','Video','Lighting','Staging','Rigging','Power','Backline','Décor','Misc'];
const CatContext = React.createContext(DEFAULT_CATEGORIES);

const STATUS_CONFIG = {
  pending:  { label:'Pending',        color:'#F59E0B', bg:'rgba(245,158,11,0.12)'  },
  prepped:  { label:'Pulled/Prepped', color:'#3B82F6', bg:'rgba(59,130,246,0.12)'  },
  loaded:   { label:'Loaded',         color:'#10B981', bg:'rgba(16,185,129,0.12)'  },
  returned: { label:'Returned',       color:'#8B5CF6', bg:'rgba(139,92,246,0.12)'  },
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#040406;--sf:#09090C;--s2:#0F0F14;--s3:#14141A;
  --br:#1A1A22;--br2:#242430;
  --tx:#EDEDF0;--mu:#8A8A9A;--fa:#1E1E2A;
  --ac:#E8FF47;--ac2:rgba(232,255,71,0.13);
  --dn:#FF4040;--dn2:rgba(255,64,64,0.12);
  --wn:#F59E0B;--wn2:rgba(245,158,11,0.12);
  --ok:#10B981;--ok2:rgba(16,185,129,0.12);
  --bl:#3B82F6;--bl2:rgba(59,130,246,0.12);
  --pu:#8B5CF6;--pu2:rgba(139,92,246,0.12);
  --r:6px;--rl:10px;--rx:16px;
  --fh:'Barlow Condensed',sans-serif;--fb:'Barlow',sans-serif;
}
html,body,#root{height:100%;min-height:100vh;background:#040406;color:var(--tx);font-family:var(--fb)}
input,textarea,select,button{font-family:var(--fb)}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--br2);border-radius:2px}
.app{min-height:100vh;display:flex;flex-direction:column;max-width:680px;margin:0 auto;background:var(--bg)}
.hdr{background:var(--sf);border-bottom:1px solid var(--br);padding:0 14px;display:flex;align-items:center;justify-content:space-between;height:52px;position:sticky;top:0;z-index:100}
.brand{font-family:var(--fh);font-size:22px;font-weight:900;letter-spacing:2px;color:var(--ac);display:flex;align-items:center;gap:7px}
.bdot{width:7px;height:7px;background:var(--ac);border-radius:50%;animation:bpulse 2.5s infinite}
@keyframes bpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.6)}}
.hdr-r{display:flex;align-items:center;gap:8px}
.uchip{background:var(--s2);border:1px solid var(--br);border-radius:20px;padding:4px 10px 4px 5px;display:flex;align-items:center;gap:7px}
.uav{width:24px;height:24px;border-radius:50%;background:var(--ac);color:#000;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;font-family:var(--fh);flex-shrink:0}
.uname{font-size:12px;font-weight:600;color:var(--tx)}
.abadge{background:var(--ac);color:#000;font-size:8px;font-weight:900;letter-spacing:1.5px;padding:2px 6px;border-radius:3px;text-transform:uppercase}
.signout{background:none;border:1px solid var(--br);border-radius:var(--r);padding:5px 10px;color:var(--mu);font-size:11px;cursor:pointer}
.signout:active{color:var(--dn);border-color:var(--dn)}
.nav{background:var(--sf);border-bottom:1px solid var(--br);display:flex;overflow-x:auto;scrollbar-width:none;flex-shrink:0}
.nav::-webkit-scrollbar{display:none}
.ntab{flex-shrink:0;padding:11px 14px;font-family:var(--fh);font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--mu);border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;transition:.18s;white-space:nowrap}
.ntab.on{color:var(--ac);border-bottom-color:var(--ac)}
.main{flex:1;padding:14px;overflow-y:auto}
.spacer{height:80px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;border-radius:var(--r);font-weight:700;cursor:pointer;transition:.12s;white-space:nowrap;border:none}
.btn:active{opacity:.78}
.bprim{background:var(--ac);color:#000;padding:13px 20px;font-family:var(--fh);font-size:16px;letter-spacing:1px;text-transform:uppercase;width:100%}
.bghost{background:var(--s2);border:1px solid var(--br);color:var(--mu);padding:8px 13px;font-size:13px}
.bdng{background:var(--dn2);border:1px solid var(--dn);color:var(--dn);padding:8px 13px;font-size:13px}
.bacc{background:var(--ac2);border:1px solid var(--ac);color:var(--ac);padding:8px 13px;font-size:13px}
.bok{background:var(--ok2);border:1px solid var(--ok);color:var(--ok);padding:8px 13px;font-size:13px}
.bsm{padding:5px 10px;font-size:11px;font-weight:700;letter-spacing:.4px}
.field{margin-bottom:13px}
.flbl{font-size:10px;font-weight:700;letter-spacing:2px;color:var(--mu);text-transform:uppercase;display:block;margin-bottom:6px}
.fi,.fsel,.fta{width:100%;background:var(--s2);border:1px solid var(--br);border-radius:var(--r);padding:11px 13px;color:var(--tx);font-size:14px;outline:none;transition:border-color .18s;appearance:none}
.fi:focus,.fsel:focus,.fta:focus{border-color:var(--ac)}
.fta{resize:vertical;min-height:74px}
.frow{display:flex;gap:10px}
.frow .field{flex:1}
.login{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;background:#040406}
.l-eyebrow{font-family:var(--fh);font-size:11px;font-weight:700;letter-spacing:4px;color:var(--mu);text-transform:uppercase;margin-bottom:8px;text-align:center}
.l-title{font-family:var(--fh);font-size:54px;font-weight:900;line-height:.93;text-align:center;margin-bottom:6px}
.l-title em{color:var(--ac);font-style:normal;display:block}
.l-sub{font-size:13px;color:var(--mu);margin-bottom:28px;text-align:center}
.l-card{background:var(--sf);border:1px solid var(--br);border-radius:var(--rx);padding:22px;width:100%;max-width:340px}
.pdots{display:flex;gap:10px;margin-bottom:18px}
.pdot{flex:1;height:48px;background:var(--s2);border:1px solid var(--br);border-radius:var(--r);display:flex;align-items:center;justify-content:center;font-size:18px;transition:.14s}
.pdot.on{border-color:var(--ac);color:var(--ac)}
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pkey{background:var(--s2);border:1px solid var(--br);border-radius:var(--r);height:50px;font-family:var(--fh);font-size:22px;font-weight:700;color:var(--tx);cursor:pointer;transition:.1s;display:flex;align-items:center;justify-content:center}
.pkey:active{background:var(--ac2);border-color:var(--ac);color:var(--ac)}
.pkey.go{background:var(--ac);color:#000;border-color:var(--ac)}
.l-err{color:var(--dn);font-size:12px;text-align:center;margin-top:8px;min-height:16px}
.l-confirm{background:var(--s2);border:1px solid var(--wn);border-radius:var(--rl);padding:16px;margin-bottom:6px}
.lc-title{font-family:var(--fh);font-size:15px;font-weight:800;color:var(--wn);letter-spacing:1px;text-transform:uppercase;margin-bottom:5px}
.lc-body{font-size:13px;color:var(--tx);line-height:1.5;margin-bottom:14px}
.lc-btns{display:flex;gap:8px}
.lc-btns .btn{flex:1;padding:11px;font-size:14px;font-family:var(--fh);font-weight:800;letter-spacing:.8px;text-transform:uppercase}
.twrap{position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:999;pointer-events:none}
.toast{background:var(--sf);border:1px solid var(--br);border-radius:20px;padding:8px 16px;font-size:13px;font-weight:600;color:var(--tx);white-space:nowrap;animation:tin .22s ease;box-shadow:0 4px 20px rgba(0,0,0,.4)}
.toast.ok{border-color:var(--ok);color:var(--ok)}
.toast.err{border-color:var(--dn);color:var(--dn)}
@keyframes tin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.mback{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:400;display:flex;align-items:flex-end}
.mback.ctr{align-items:center;justify-content:center;padding:20px}
.modal{position:relative;background:var(--sf);border-top:1px solid var(--br);border-radius:var(--rx) var(--rx) 0 0;padding:20px;width:100%;max-height:88vh;overflow-y:auto}
.mback.ctr .modal{border-radius:var(--rx);border:1px solid var(--br);max-width:420px;max-height:90vh}
.mtitle{font-family:var(--fh);font-size:22px;font-weight:800;margin-bottom:18px}
.macts{display:flex;gap:10px;margin-top:20px}
.macts .btn{flex:1;padding:13px;font-family:var(--fh);font-size:15px;font-weight:800;letter-spacing:1px;text-transform:uppercase}
.mover{position:absolute;inset:0;cursor:default}
.cdlg{background:var(--s2);border:1px solid var(--wn);border-radius:var(--rl);padding:16px}
.cdlg.dng{border-color:var(--dn)}
.ct{font-family:var(--fh);font-size:16px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;color:var(--wn)}
.cdlg.dng .ct{color:var(--dn)}
.cb{font-size:13px;color:var(--mu);line-height:1.5;margin-bottom:13px}
.cbtns{display:flex;gap:8px}
.cbtns .btn{flex:1;padding:11px;font-size:12px;font-family:var(--fh);font-weight:800;letter-spacing:.5px;text-transform:uppercase}
.ecard{background:var(--sf);border:1px solid var(--br);border-radius:var(--rl);margin-bottom:10px;overflow:hidden;transition:.15s;cursor:pointer}
.ecard:active{transform:scale(.99);border-color:var(--ac)}
.ecard.arc{opacity:.52}
.ehd{padding:14px 14px 10px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.ename{font-family:var(--fh);font-size:25px;font-weight:900;line-height:1;color:var(--tx)}
.evenue{font-size:12px;color:var(--mu);margin-top:3px}
.pills{display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end}
.pill{font-size:9px;font-weight:800;letter-spacing:1.5px;padding:3px 8px;border-radius:20px;text-transform:uppercase;border:1px solid;white-space:nowrap}
.plive{color:var(--ok);border-color:rgba(16,185,129,.35);background:var(--ok2)}
.pdraft{color:var(--wn);border-color:rgba(245,158,11,.35);background:var(--wn2)}
.parc{color:var(--mu);border-color:var(--br);background:var(--s2)}
.emeta{padding:0 14px 10px;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.mchip{background:var(--s2);border-radius:var(--r);padding:7px 10px}
.mchip .ml{font-size:9px;font-weight:700;letter-spacing:2px;color:var(--mu);text-transform:uppercase}
.mchip .mv{font-size:12px;font-weight:600;color:var(--tx);margin-top:2px}
.eprog{padding:0 14px 14px}
.ptrack{background:var(--s2);border-radius:3px;height:5px;overflow:hidden}
.pfill{background:var(--ac);height:100%;border-radius:3px;transition:width .5s}
.plbls{display:flex;justify-content:space-between;margin-top:5px;font-size:10px;color:var(--mu)}
.backrow{display:flex;align-items:center;gap:7px;margin-bottom:14px;color:var(--mu);cursor:pointer;width:fit-content}
.backrow:active{color:var(--ac)}
.backrow svg{width:15px;height:15px}
.backrow span{font-size:13px;font-weight:600}
.dh{background:var(--sf);border:1px solid var(--br);border-radius:var(--rl);padding:16px;margin-bottom:11px}
.dh-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:11px}
.dname{font-family:var(--fh);font-size:30px;font-weight:900;line-height:1}
.dsub{font-size:12px;color:var(--mu);margin-top:3px}
.dgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.ichip{background:var(--s2);border:1px solid var(--br);border-radius:var(--r);padding:9px 11px}
.icl{font-size:9px;font-weight:700;letter-spacing:2px;color:var(--mu);text-transform:uppercase}
.icv{font-size:13px;font-weight:600;color:var(--tx);margin-top:2px;line-height:1.3}
.trchip{background:var(--s2);border:1px solid var(--br);border-radius:var(--r);padding:9px 11px;display:flex;align-items:center;cursor:pointer;transition:.15s;gap:8px;margin-top:7px}
.trchip:active{border-color:var(--ac)}
.brief{background:var(--s2);border-left:3px solid var(--ac);border-radius:0 var(--r) var(--r) 0;padding:12px 14px;margin-bottom:11px}
.brieft{font-size:9px;font-weight:800;letter-spacing:2px;color:var(--ac);text-transform:uppercase;margin-bottom:5px}
.briefb{font-size:14px;color:var(--tx);line-height:1.6;white-space:pre-wrap}
.pblock{background:var(--sf);border:1px solid var(--br);border-radius:var(--rl);padding:12px 14px;margin-bottom:11px}
.phd{display:flex;justify-content:space-between;margin-bottom:7px}
.phd span:first-child{font-size:10px;font-weight:700;letter-spacing:2px;color:var(--mu);text-transform:uppercase}
.phd span:last-child{font-size:14px;font-weight:800;color:var(--ac)}
.spills{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px}
.spill{font-size:9px;font-weight:700;padding:3px 8px;border-radius:20px;border:1px solid}
.shd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.slbl{font-family:var(--fh);font-size:14px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--mu)}
.catblk{margin-bottom:16px}
.catlbl{font-family:var(--fh);font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--fa);border-bottom:1px solid var(--br);padding-bottom:5px;margin-bottom:7px}
.irow{background:var(--sf);border:1px solid var(--br);border-radius:var(--r);padding:11px 12px;margin-bottom:5px;display:flex;align-items:center;gap:10px}
.ichk{width:26px;height:26px;border-radius:50%;border:2px solid var(--br2);background:var(--s2);flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.18s}
.ichk.prepped{border-color:var(--bl);background:var(--bl2)}
.ichk.loaded{border-color:var(--ok);background:var(--ok2)}
.ichk.returned{border-color:var(--pu);background:var(--pu2)}
.imain{flex:1;min-width:0}
.iname{font-size:14px;font-weight:600;color:var(--tx)}
.iqty{font-size:11px;color:var(--mu);margin-top:1px}
.iby{font-size:10px;color:var(--fa);margin-top:3px;font-style:italic}
.iright{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0}
.sbadge{font-size:8px;font-weight:800;letter-spacing:1px;padding:3px 8px;border-radius:20px;text-transform:uppercase;white-space:nowrap;border:1px solid}
.acwrap{position:relative}
.aclist{position:absolute;top:100%;left:0;right:0;background:var(--sf);border:1px solid var(--ac);border-top:none;border-radius:0 0 var(--r) var(--r);z-index:60;max-height:190px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.45)}
.acitem{padding:10px 13px;cursor:pointer;font-size:14px;color:var(--tx);border-bottom:1px solid var(--br);display:flex;align-items:center;justify-content:space-between}
.acitem:last-child{border-bottom:none}
.acitem:hover{background:var(--s2)}
.accat{font-size:10px;color:var(--mu);font-weight:600}
.sback{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:300}
.sheet{position:fixed;bottom:0;left:0;right:0;background:var(--sf);border-top:1px solid var(--br);border-radius:var(--rx) var(--rx) 0 0;padding:20px;z-index:301;max-width:680px;margin:0 auto;animation:sup .22s ease}
@keyframes sup{from{transform:translateY(36px);opacity:0}to{transform:translateY(0);opacity:1}}
.stitle{font-family:var(--fh);font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--mu);margin-bottom:13px}
.sopt{display:flex;align-items:center;gap:11px;padding:13px;border-radius:var(--r);margin-bottom:7px;cursor:pointer;border:1px solid var(--br);background:var(--s2)}
.sopt:active{border-color:var(--ac)}
.sdot{width:11px;height:11px;border-radius:50%;flex-shrink:0}
.solbl{font-size:15px;font-weight:600}
.scur{margin-left:auto;font-size:9px;color:var(--mu);font-weight:700;letter-spacing:1px;text-transform:uppercase}
.auditsec{background:var(--sf);border:1px solid var(--br);border-radius:var(--rl);padding:14px;margin-top:18px}
.auditt{font-family:var(--fh);font-size:14px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--dn);margin-bottom:11px;display:flex;align-items:center;gap:6px}
.aurow{border-left:2px solid var(--br2);padding:6px 10px;margin-bottom:6px;border-radius:0 var(--r) var(--r) 0}
.aurow.rm{border-left-color:var(--dn)}
.aurow.add{border-left-color:var(--ok)}
.aurow.mod{border-left-color:var(--wn)}
.auitem{font-size:12px;color:var(--tx)}
.aumeta{font-size:10px;color:var(--mu);margin-top:2px}
.logrow{padding:11px 13px;border-bottom:1px solid var(--br);display:flex;align-items:flex-start;gap:10px}
.logrow:last-child{border-bottom:none}
.logav{width:30px;height:30px;border-radius:50%;background:var(--s2);border:1px solid var(--br);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;font-family:var(--fh);color:var(--ac);flex-shrink:0}
.logbody{flex:1;min-width:0}
.logact{font-size:13px;color:var(--tx);line-height:1.4}
.logt{font-size:10px;color:var(--mu);margin-top:2px}
.logevt{font-size:10px;color:var(--mu);font-style:italic}
.ucard{background:var(--sf);border:1px solid var(--br);border-radius:var(--rl);padding:13px;margin-bottom:8px;display:flex;align-items:center;gap:11px}
.uavlg{width:42px;height:42px;border-radius:50%;background:var(--s2);border:1px solid var(--br2);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:900;font-family:var(--fh);color:var(--ac);flex-shrink:0}
.ucinfo{flex:1;min-width:0}
.ucname{font-size:15px;font-weight:700;color:var(--tx);display:flex;align-items:center;gap:7px}
.ucmeta{font-size:11px;color:var(--mu);margin-top:2px}
.ucacts{display:flex;gap:6px;flex-shrink:0}
.iabadge{font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 7px;border-radius:20px;background:var(--dn2);color:var(--dn);border:1px solid var(--dn);text-transform:uppercase}
.mitem{background:var(--sf);border:1px solid var(--br);border-radius:var(--r);padding:10px 12px;margin-bottom:5px;display:flex;align-items:center;gap:10px}
.mname{flex:1;font-size:14px;font-weight:600;color:var(--tx)}
.mcat{font-size:10px;color:var(--mu);background:var(--s2);border:1px solid var(--br);border-radius:4px;padding:2px 7px}
.fab{position:fixed;bottom:22px;right:14px;width:52px;height:52px;background:var(--ac);border:none;border-radius:50%;font-size:24px;color:#000;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(232,255,71,.28);z-index:150}
.fab:active{transform:scale(.9)}
.empty{text-align:center;padding:44px 20px;color:var(--mu)}
.eico{font-size:34px;margin-bottom:10px}
.etxt{font-size:13px}
.tabrow{display:flex;gap:6px;margin-bottom:13px;flex-wrap:wrap}
.infobanner{background:var(--s2);border:1px solid var(--br);border-radius:4px;padding:7px 11px;margin-bottom:12px;font-size:12px;color:var(--mu)}
.loading{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#040406;font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;letter-spacing:3px;color:var(--ac)}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const nowISO = () => new Date().toISOString();
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
const fmtDT = (d) => d ? new Date(d).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }) : '—';
const fmtFull = (d) => d ? new Date(d).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit', second:'2-digit' }) : '—';

// ─── SUPABASE DATA LAYER ──────────────────────────────────────────────────────
const db = {
  // Users
  getUsers: async () => { const { data } = await supabase.from('cf_users').select('*').order('created_at'); return data || []; },
  upsertUser: async (u) => supabase.from('cf_users').upsert({ id:u.id, name:u.name, pin:u.pin, role:u.role, email:u.email||'', active:u.active, deactivated_at:u.deactivatedAt||null }),
  deleteUser: async (id) => supabase.from('cf_users').update({ active:false, deactivated_at:nowISO() }).eq('id', id),

  // Events
  getEvents: async () => {
    const { data: events } = await supabase.from('cf_events').select('*').order('created_at', { ascending:false });
    if (!events) return [];
    const { data: items } = await supabase.from('cf_items').select('*').order('sort_order');
    const { data: audit } = await supabase.from('cf_audit_log').select('*').order('created_at');
    const { data: activity } = await supabase.from('cf_activity_log').select('*').order('created_at');
    return events.map(ev => ({
      id: ev.id, name: ev.name, venue: ev.venue, address: ev.address,
      eventStart: ev.event_start, eventEnd: ev.event_end,
      installDT: ev.install_dt, strikeDT: ev.strike_dt, departureDT: ev.departure_dt,
      brief: ev.brief, truck: ev.truck, trailer: ev.trailer,
      live: ev.live, archived: ev.archived, archivedAt: ev.archived_at,
      createdAt: ev.created_at, updatedAt: ev.updated_at,
      items: (items || []).filter(i => i.event_id === ev.id).map(i => ({
        id: i.id, name: i.name, qty: i.qty, category: i.category, notes: i.notes,
        status: i.status, addedBy: i.added_by, addedByUserId: i.added_by_user_id,
        addedAt: i.added_at, preppedBy: i.prepped_by, preppedAt: i.prepped_at,
        loadedBy: i.loaded_by, loadedAt: i.loaded_at, returnedBy: i.returned_by,
        returnedAt: i.returned_at, modifiedBy: i.modified_by, modifiedAt: i.modified_at,
        removedBy: i.removed_by, removedByUserId: i.removed_by_user_id, removedAt: i.removed_at,
        statusLog: [],
      })),
      auditLog: (audit || []).filter(a => a.event_id === ev.id).map(a => ({
        type: a.type, itemName: a.item_name, qty: a.qty, category: a.category,
        changes: a.changes, prevStatus: a.prev_status, by: a.by_name, at: a.created_at,
      })),
      activityLog: (activity || []).filter(a => a.event_id === ev.id).map(a => ({
        id: a.id, action: a.action, detail: a.detail, by: a.by_name,
        userId: a.user_id, at: a.created_at, eventName: a.event_name,
      })),
    }));
  },

  upsertEvent: async (ev) => supabase.from('cf_events').upsert({
    id: ev.id, name: ev.name, venue: ev.venue||'', address: ev.address||'',
    event_start: ev.eventStart||'', event_end: ev.eventEnd||'',
    install_dt: ev.installDT||'', strike_dt: ev.strikeDT||'', departure_dt: ev.departureDT||'',
    brief: ev.brief||'', truck: ev.truck||'', trailer: ev.trailer||'',
    live: ev.live, archived: ev.archived||false,
    archived_at: ev.archivedAt||null, archived_reason: ev.archivedReason||'',
    updated_at: nowISO(),
  }),

  upsertItem: async (item, eventId) => supabase.from('cf_items').upsert({
    id: item.id, event_id: eventId, name: item.name, qty: item.qty,
    category: item.category, notes: item.notes||'', status: item.status||'pending',
    added_by: item.addedBy||'', added_by_user_id: item.addedByUserId||'',
    added_at: item.addedAt||null,
    prepped_by: item.preppedBy||'', prepped_at: item.preppedAt||null,
    loaded_by: item.loadedBy||'', loaded_at: item.loadedAt||null,
    returned_by: item.returnedBy||'', returned_at: item.returnedAt||null,
    modified_by: item.modifiedBy||'', modified_at: item.modifiedAt||null,
    removed_by: item.removedBy||'', removed_by_user_id: item.removedByUserId||'',
    removed_at: item.removedAt||null,
  }),

  addAudit: async (eventId, entry) => supabase.from('cf_audit_log').insert({
    id: uid(), event_id: eventId, type: entry.type, item_name: entry.itemName||'',
    qty: entry.qty||'', category: entry.category||'', changes: entry.changes||'',
    prev_status: entry.prevStatus||'', by_name: entry.by,
  }),

  addActivity: async (eventId, eventName, log) => supabase.from('cf_activity_log').insert({
    id: log.id||uid(), event_id: eventId, event_name: eventName,
    action: log.action, detail: log.detail, by_name: log.by, user_id: log.userId||'',
  }),

  // Master items
  getMasterItems: async () => { const { data } = await supabase.from('cf_master_items').select('*').order('name'); return data || []; },
  addMasterItem: async (item) => supabase.from('cf_master_items').insert({ id:item.id, name:item.name, category:item.category }),
  deleteMasterItem: async (id) => supabase.from('cf_master_items').delete().eq('id', id),

  // Fleet
  getFleet: async () => {
    const { data } = await supabase.from('cf_fleet').select('*').order('created_at');
    if (!data) return { trucks:[], trailers:[] };
    return { trucks: data.filter(f=>f.type==='truck'), trailers: data.filter(f=>f.type==='trailer') };
  },
  addFleetItem: async (item) => supabase.from('cf_fleet').insert({ id:item.id, type:item.type, name:item.name, detail:item.detail||'' }),
  deleteFleetItem: async (id) => supabase.from('cf_fleet').delete().eq('id', id),

  // Categories
  getCategories: async () => { const { data } = await supabase.from('cf_categories').select('*').order('sort_order'); return (data||[]).map(c=>c.name); },
  addCategory: async (name, order) => supabase.from('cf_categories').insert({ name, sort_order:order }),
  updateCategory: async (oldName, newName) => supabase.from('cf_categories').update({ name:newName }).eq('name', oldName),
  deleteCategory: async (name) => supabase.from('cf_categories').delete().eq('name', name),

  // Activity log (global)
  getAllActivity: async () => { const { data } = await supabase.from('cf_activity_log').select('*').order('created_at', { ascending:false }).limit(200); return data || []; },
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return <div className="twrap"><div className={'toast' + (type ? ' ' + type : '')}>{msg}</div></div>;
}

function Confirm({ title, body, danger, onConfirm, onCancel, confirmLabel, cancelLabel }) {
  return (
    <div className={'cdlg' + (danger ? ' dng' : '')}>
      <div className="ct">{title}</div>
      <div className="cb">{body}</div>
      <div className="cbtns">
        <button className="btn bghost bsm" onClick={onCancel}>{cancelLabel || 'Cancel'}</button>
        <button className={'btn bsm ' + (danger ? 'bdng' : 'bacc')} onClick={onConfirm}>{confirmLabel || 'Confirm'}</button>
      </div>
    </div>
  );
}

function AutocompleteInput({ value, onChange, masterItems, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const filtered = value.length > 0 ? masterItems.filter(m => m.name.toLowerCase().includes(value.toLowerCase())).slice(0, 8) : [];
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="acwrap" ref={ref}>
      <input className="fi" value={value} onChange={e => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder || 'Type to search items…'} autoComplete="off" />
      {open && filtered.length > 0 && (
        <div className="aclist">
          {filtered.map(m => (
            <div key={m.id} className="acitem" onMouseDown={() => { onChange(m.name); setOpen(false); }}>
              <span>{m.name}</span><span className="accat">{m.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusSheet({ item, onSelect, onClose }) {
  return (
    <>
      <div className="sback" onClick={onClose} />
      <div className="sheet">
        <div className="stitle">Update — {item.name}</div>
        {['pending','prepped','loaded','returned'].map(s => {
          const sc = STATUS_CONFIG[s];
          return (
            <div key={s} className="sopt" onClick={() => onSelect(s)}>
              <div className="sdot" style={{ background: sc.color }} />
              <span className="solbl" style={{ color: sc.color }}>{sc.label}</span>
              {item.status === s && <span className="scur">current</span>}
            </div>
          );
        })}
        <button className="btn bghost" style={{ width:'100%', marginTop:6 }} onClick={onClose}>Cancel</button>
      </div>
    </>
  );
}

function TruckModal({ event, onSave, onClose, fleet }) {
  const trucks = (fleet && fleet.trucks) ? fleet.trucks : [];
  const trailers = (fleet && fleet.trailers) ? fleet.trailers : [];
  const [truckVal, setTruckVal] = useState(event.truck || '');
  const [trailerVal, setTrailerVal] = useState(event.trailer || '');
  const [customTruck, setCustomTruck] = useState('');
  const [customTrailer, setCustomTrailer] = useState('');
  const finalTruck = truckVal === '__custom' ? customTruck : truckVal;
  const finalTrailer = trailerVal === '__custom' ? customTrailer : trailerVal;
  return (
    <div className="mback ctr">
      <div className="mover" onClick={onClose} />
      <div className="modal">
        <div className="mtitle">🚛 Vehicle Assignment</div>
        <div className="field">
          <label className="flbl">Truck</label>
          <select className="fsel" value={truckVal} onChange={e => setTruckVal(e.target.value)}>
            <option value="">— Select truck —</option>
            {trucks.map(t => <option key={t.id} value={t.name}>{t.name} — {t.detail}</option>)}
            <option value="__custom">Other / Custom…</option>
          </select>
          {truckVal === '__custom' && <input className="fi" style={{ marginTop:8 }} value={customTruck} onChange={e => setCustomTruck(e.target.value)} placeholder="Enter truck name" />}
        </div>
        <div className="field">
          <label className="flbl">Trailer</label>
          <select className="fsel" value={trailerVal} onChange={e => setTrailerVal(e.target.value)}>
            <option value="">— Select trailer —</option>
            {trailers.map(t => <option key={t.id} value={t.name}>{t.name} — {t.detail}</option>)}
            <option value="__custom">Other / Custom…</option>
          </select>
          {trailerVal === '__custom' && <input className="fi" style={{ marginTop:8 }} value={customTrailer} onChange={e => setCustomTrailer(e.target.value)} placeholder="Enter trailer name" />}
        </div>
        <div className="macts">
          <button className="btn bghost" onClick={onClose}>Cancel</button>
          <button className="btn bprim" style={{ flex:2 }} onClick={() => onSave(finalTruck, finalTrailer)}>Save</button>
        </div>
      </div>
    </div>
  );
}

function ItemModal({ item, onSave, onClose, masterItems }) {
  const categories = useContext(CatContext);
  const isEdit = !!item;
  const UNITS = ['units','pcs','ft','m','boxes','cases','rolls','sets','ea'];
  const [name, setName] = useState(item ? item.name : '');
  const [qty, setQty] = useState(item ? item.qty.split(' ')[0] : '1');
  const [unit, setUnit] = useState(item ? (item.qty.split(' ').slice(1).join(' ') || 'units') : 'units');
  const [cat, setCat] = useState(item ? item.category : categories[0]);
  const [notes, setNotes] = useState(item ? (item.notes || '') : '');
  const handleSave = () => {
    if (!name.trim()) return;
    const match = masterItems.find(m => m.name.toLowerCase() === name.toLowerCase());
    const base = isEdit ? { ...item } : { id:uid(), status:'pending', addedBy:null, removedAt:null };
    onSave({ ...base, name:name.trim(), qty:`${qty} ${unit}`, category:match ? match.category : cat, notes });
  };
  return (
    <div className="mback">
      <div className="mover" onClick={onClose} />
      <div className="modal">
        <div className="mtitle">{isEdit ? '✏️ Edit Item' : 'Add Gear Item'}</div>
        <div className="field"><label className="flbl">Item Name</label><AutocompleteInput value={name} onChange={setName} masterItems={masterItems} /></div>
        <div className="frow">
          <div className="field"><label className="flbl">Qty</label><input className="fi" type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" /></div>
          <div className="field"><label className="flbl">Unit</label><select className="fsel" value={unit} onChange={e => setUnit(e.target.value)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
        </div>
        <div className="field"><label className="flbl">Category</label><select className="fsel" value={cat} onChange={e => setCat(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
        <div className="field"><label className="flbl">Notes (optional)</label><textarea className="fta" value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
        <div className="macts">
          <button className="btn bghost" onClick={onClose}>Cancel</button>
          <button className="btn bprim" style={{ flex:2 }} onClick={handleSave}>{isEdit ? 'Save Changes' : 'Add Item'}</button>
        </div>
      </div>
    </div>
  );
}

function EventForm({ onSave, onClose, existing, masterItems }) {
  const categories = useContext(CatContext);
  const e = existing || {};
  const UNITS = ['units','pcs','ft','m','boxes','cases','rolls','sets','ea'];
  const [name, setName] = useState(e.name || '');
  const [venue, setVenue] = useState(e.venue || '');
  const [address, setAddress] = useState(e.address || '');
  const [eventStart, setEventStart] = useState(e.eventStart || '');
  const [eventEnd, setEventEnd] = useState(e.eventEnd || '');
  const [installDT, setInstallDT] = useState(e.installDT || '');
  const [strikeDT, setStrikeDT] = useState(e.strikeDT || '');
  const [departureDT, setDepartureDT] = useState(e.departureDT || '');
  const [brief, setBrief] = useState(e.brief || '');
  const [items, setItems] = useState((e.items || []).filter(i => !i.removedAt));
  const [ni, setNi] = useState({ name:'', qty:'1', unit:'units', cat:categories[0] });

  const addItem = () => {
    if (!ni.name.trim()) return;
    const match = masterItems.find(m => m.name.toLowerCase() === ni.name.toLowerCase());
    setItems(prev => [...prev, { id:uid(), name:ni.name.trim(), qty:`${ni.qty} ${ni.unit}`, category:match ? match.category : ni.cat, status:'pending', addedBy:'admin', removedAt:null, notes:'' }]);
    setNi({ name:'', qty:'1', unit:'units', cat:categories[0] });
  };

  const save = (live) => {
    if (!name.trim()) return;
    onSave({ ...e, id:e.id||uid(), name, venue, address, eventStart, eventEnd, installDT, strikeDT, departureDT, brief, items:[...items, ...(e.items||[]).filter(i=>i.removedAt)], live, archived:e.archived||false, createdAt:e.createdAt||nowISO(), truck:e.truck||'', trailer:e.trailer||'' });
  };

  return (
    <div className="mback">
      <div className="mover" onClick={onClose} />
      <div className="modal">
        <div className="mtitle">{existing ? '✏️ Edit Event' : '➕ New Event'}</div>
        <div className="field"><label className="flbl">Event Name *</label><input className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Strut Platform Putback" /></div>
        <div className="field"><label className="flbl">Venue Name</label><input className="fi" value={venue} onChange={e=>setVenue(e.target.value)} /></div>
        <div className="field"><label className="flbl">Address</label><input className="fi" value={address} onChange={e=>setAddress(e.target.value)} /></div>
        <div className="frow">
          <div className="field"><label className="flbl">Event Start</label><input className="fi" type="date" value={eventStart} onChange={e=>setEventStart(e.target.value)} /></div>
          <div className="field"><label className="flbl">Event End</label><input className="fi" type="date" value={eventEnd} onChange={e=>setEventEnd(e.target.value)} /></div>
        </div>
        <div className="frow">
          <div className="field"><label className="flbl">Install Date/Time</label><input className="fi" type="datetime-local" value={installDT} onChange={e=>setInstallDT(e.target.value)} /></div>
          <div className="field"><label className="flbl">Strike Date/Time</label><input className="fi" type="datetime-local" value={strikeDT} onChange={e=>setStrikeDT(e.target.value)} /></div>
        </div>
        <div className="field"><label className="flbl">Warehouse Departure</label><input className="fi" type="datetime-local" value={departureDT} onChange={e=>setDepartureDT(e.target.value)} /></div>
        <div className="field"><label className="flbl">Project Brief / Admin Notes</label><textarea className="fta" value={brief} onChange={e=>setBrief(e.target.value)} rows={3} /></div>
        <div className="field">
          <label className="flbl">Initial Gear List</label>
          <div style={{ background:'var(--s2)', border:'1px solid var(--br)', borderRadius:'var(--r)', padding:11 }}>
            {items.map(it => (
              <div key={it.id} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5, padding:'6px 8px', background:'var(--sf)', borderRadius:'var(--r)' }}>
                <span style={{ flex:1, fontSize:13, color:'var(--tx)' }}>{it.name}</span>
                <span style={{ fontSize:11, color:'var(--mu)' }}>{it.qty}</span>
                <span style={{ fontSize:10, color:'var(--mu)', background:'var(--s2)', padding:'2px 6px', borderRadius:4 }}>{it.category}</span>
                <button style={{ background:'none', border:'none', color:'var(--dn)', fontSize:16, cursor:'pointer' }} onClick={() => setItems(p => p.filter(i => i.id !== it.id))}>×</button>
              </div>
            ))}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:7 }}>
              <div style={{ flex:'2 1 120px' }}><AutocompleteInput value={ni.name} onChange={v => setNi(p => ({ ...p, name:v }))} masterItems={masterItems} placeholder="Search or type item…" /></div>
              <input className="fi" style={{ width:52 }} type="number" value={ni.qty} onChange={e => setNi(p => ({ ...p, qty:e.target.value }))} min="1" />
              <select className="fsel" style={{ flex:'1 1 65px' }} value={ni.unit} onChange={e => setNi(p => ({ ...p, unit:e.target.value }))}>{UNITS.map(u => <option key={u}>{u}</option>)}</select>
              <select className="fsel" style={{ flex:'1 1 90px' }} value={ni.cat} onChange={e => setNi(p => ({ ...p, cat:e.target.value }))}>{categories.map(c => <option key={c}>{c}</option>)}</select>
              <button className="btn bacc bsm" onClick={addItem}>+ Add</button>
            </div>
          </div>
        </div>
        <div className="macts">
          <button className="btn bghost" onClick={onClose}>Cancel</button>
          {!existing?.live && <button className="btn bghost" style={{ flex:1 }} onClick={() => save(false)}>Draft</button>}
          <button className="btn bprim" style={{ flex:2 }} onClick={() => save(true)}>{existing?.live ? 'Save' : 'Publish'}</button>
        </div>
      </div>
    </div>
  );
}

function EventDetail({ event, user, onBack, onUpdate, masterItems, fleet }) {
  const categories = useContext(CatContext);
  const [statusTarget, setStatusTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showTruck, setShowTruck] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const isAdmin = user.role === 'admin';
  const items = event.items || [];
  const active = items.filter(i => !i.removedAt);
  const removed = items.filter(i => i.removedAt);
  const pct = active.length ? Math.round((active.filter(i => i.status === 'loaded' || i.status === 'returned').length / active.length) * 100) : 0;
  const pt = (msg, type) => setToast({ msg, type });

  const statusKey = active.map(i => i.status).join(',');
  useEffect(() => {
    if (active.length > 0 && active.every(i => i.status === 'returned') && !event.archived) {
      handleArchive('auto');
    }
  }, [statusKey]);

  const handleArchive = async (reason) => {
    const updated = { ...event, archived:true, archivedAt:nowISO(), archivedReason:reason };
    await db.upsertEvent(updated);
    onUpdate(updated);
    if (reason === 'auto') pt('All items returned — event auto-archived ✓', 'ok');
  };

  const handleStatus = async (status) => {
    const item = statusTarget;
    setSaving(true);
    const updatedItem = { ...item, status, [`${status}By`]:user.name, [`${status}At`]:nowISO() };
    await db.upsertItem(updatedItem, event.id);
    const logEntry = { id:uid(), action:'status_change', detail:`"${item.name}": ${item.status} → ${status}`, by:user.name, userId:user.id };
    await db.addActivity(event.id, event.name, logEntry);
    const updatedEvent = { ...event, items:items.map(i => i.id === item.id ? updatedItem : i), activityLog:[...(event.activityLog||[]), { ...logEntry, at:nowISO() }] };
    onUpdate(updatedEvent);
    setStatusTarget(null);
    setSaving(false);
    pt(`${item.name} → ${STATUS_CONFIG[status].label}`, 'ok');
  };

  const handleAddItem = async (item) => {
    setSaving(true);
    const newItem = { ...item, addedBy:user.name, addedByUserId:user.id, addedAt:nowISO() };
    await db.upsertItem(newItem, event.id);
    const ae = { type:'add', itemName:item.name, qty:item.qty, by:user.name };
    await db.addAudit(event.id, ae);
    const logEntry = { id:uid(), action:'item_added', detail:`Added "${item.name}" (${item.qty}) [${item.category}]`, by:user.name, userId:user.id };
    await db.addActivity(event.id, event.name, logEntry);
    onUpdate({ ...event, items:[...items, { ...newItem, at:nowISO() }], auditLog:[...(event.auditLog||[]), { ...ae, at:nowISO() }], activityLog:[...(event.activityLog||[]), { ...logEntry, at:nowISO() }] });
    setShowAdd(false);
    setSaving(false);
    pt(`"${item.name}" added`, 'ok');
  };

  const handleEditItem = async (updated) => {
    const orig = editTarget;
    const changes = [];
    if (orig.name !== updated.name) changes.push(`name: "${orig.name}"→"${updated.name}"`);
    if (orig.qty !== updated.qty) changes.push(`qty: ${orig.qty}→${updated.qty}`);
    if (orig.category !== updated.category) changes.push(`cat: ${orig.category}→${updated.category}`);
    setSaving(true);
    const updatedItem = { ...updated, modifiedBy:user.name, modifiedAt:nowISO() };
    await db.upsertItem(updatedItem, event.id);
    const ae = { type:'mod', itemName:orig.name, changes:changes.join(', '), by:user.name };
    await db.addAudit(event.id, ae);
    const logEntry = { id:uid(), action:'item_modified', detail:`Modified "${orig.name}": ${changes.join(', ')}`, by:user.name, userId:user.id };
    await db.addActivity(event.id, event.name, logEntry);
    onUpdate({ ...event, items:items.map(i => i.id === updated.id ? updatedItem : i), auditLog:[...(event.auditLog||[]), { ...ae, at:nowISO() }], activityLog:[...(event.activityLog||[]), { ...logEntry, at:nowISO() }] });
    setEditTarget(null);
    setSaving(false);
    pt('Item updated', 'ok');
  };

  const handleRemove = async () => {
    const item = removeTarget;
    setSaving(true);
    const updatedItem = { ...item, removedAt:nowISO(), removedBy:user.name, removedByUserId:user.id };
    await db.upsertItem(updatedItem, event.id);
    const ae = { type:'rm', itemName:item.name, qty:item.qty, category:item.category, prevStatus:item.status, by:user.name };
    await db.addAudit(event.id, ae);
    const logEntry = { id:uid(), action:'item_removed', detail:`Removed "${item.name}" (${item.qty}) — was ${item.status}`, by:user.name, userId:user.id };
    await db.addActivity(event.id, event.name, logEntry);
    onUpdate({ ...event, items:items.map(i => i.id === item.id ? updatedItem : i), auditLog:[...(event.auditLog||[]), { ...ae, at:nowISO() }], activityLog:[...(event.activityLog||[]), { ...logEntry, at:nowISO() }] });
    setRemoveTarget(null);
    setSaving(false);
    pt(`"${item.name}" removed`, 'err');
  };

  const handleTruck = async (truck, trailer) => {
    const updated = { ...event, truck, trailer };
    await db.upsertEvent(updated);
    const logEntry = { id:uid(), action:'vehicle_update', detail:`Vehicle: "${truck}" / Trailer: "${trailer}"`, by:user.name, userId:user.id };
    await db.addActivity(event.id, event.name, logEntry);
    onUpdate({ ...updated, activityLog:[...(event.activityLog||[]), { ...logEntry, at:nowISO() }] });
    setShowTruck(false);
    pt('Vehicle assignment saved', 'ok');
  };

  const byCategory = categories.reduce((acc, cat) => {
    const ci = active.filter(i => i.category === cat);
    if (ci.length) acc[cat] = ci;
    return acc;
  }, {});

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      {saving && <div style={{ position:'fixed', top:52, left:0, right:0, height:2, background:'var(--ac)', zIndex:200, animation:'tin .3s ease' }} />}
      <div className="backrow" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        <span>All Events</span>
      </div>
      <div className="dh">
        <div className="dh-top">
          <div>
            <div className="dname">{event.name}</div>
            <div className="dsub">{event.venue}</div>
            <div className="dsub">{event.address}</div>
          </div>
          <div className="pills">
            <span className={'pill ' + (event.archived ? 'parc' : event.live ? 'plive' : 'pdraft')}>{event.archived ? 'Archived' : event.live ? 'Live' : 'Draft'}</span>
            {isAdmin && !event.archived && <button className="btn bacc bsm" onClick={() => setShowEditEvent(true)}>Edit</button>}
            {isAdmin && !event.archived && <button className="btn bghost bsm" onClick={() => handleArchive('manual')}>Archive</button>}
          </div>
        </div>
        <div className="dgrid">
          <div className="ichip"><div className="icl">Event Dates</div><div className="icv">{fmt(event.eventStart)} – {fmt(event.eventEnd)}</div></div>
          <div className="ichip"><div className="icl">Install</div><div className="icv">{fmtDT(event.installDT)}</div></div>
          <div className="ichip"><div className="icl">Strike</div><div className="icv">{fmtDT(event.strikeDT)}</div></div>
          <div className="ichip"><div className="icl">WH Departure</div><div className="icv">{fmtDT(event.departureDT)}</div></div>
        </div>
        <div className="trchip" onClick={() => !event.archived && setShowTruck(true)}>
          <span style={{ fontSize:18 }}>🚛</span>
          <div style={{ flex:1 }}>
            <div className="icl">Truck / Trailer</div>
            <div className="icv">{event.truck || event.trailer ? `${event.truck||'—'} · ${event.trailer||'—'}` : <span style={{ color:'var(--mu)', fontSize:12 }}>Tap to assign vehicle</span>}</div>
          </div>
          {!event.archived && <span style={{ color:'var(--mu)', fontSize:18 }}>›</span>}
        </div>
      </div>
      <div className="pblock">
        <div className="phd"><span>Progress</span><span>{pct}%</span></div>
        <div className="ptrack"><div className="pfill" style={{ width:`${pct}%` }} /></div>
        <div className="spills">
          {Object.entries(STATUS_CONFIG).map(([k,v]) => (
            <span key={k} className="spill" style={{ color:v.color, borderColor:`${v.color}44`, background:v.bg }}>{active.filter(i=>i.status===k).length} {v.label}</span>
          ))}
        </div>
      </div>
      {event.brief && <div className="brief"><div className="brieft">📋 Admin Brief</div><div className="briefb">{event.brief}</div></div>}
      {!event.archived && (
        <div className="shd">
          <span className="slbl">Gear List ({active.length})</span>
          <button className="btn bacc bsm" onClick={() => setShowAdd(true)}>+ Add Item</button>
        </div>
      )}
      {Object.keys(byCategory).length === 0 && <div className="empty"><div className="eico">📦</div><div className="etxt">No items yet.</div></div>}
      {Object.entries(byCategory).map(([cat, catItems]) => (
        <div key={cat} className="catblk">
          <div className="catlbl">{cat}</div>
          {catItems.map(item => {
            const sc = STATUS_CONFIG[item.status || 'pending'];
            return (
              <div key={item.id} className="irow">
                <div className={'ichk ' + (item.status || 'pending')} onClick={() => !event.archived && setStatusTarget(item)} style={event.archived ? { opacity:.5, cursor:'default' } : { cursor:'pointer' }}>
                  {item.status !== 'pending' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
                <div className="imain">
                  <div className="iname">{item.name}</div>
                  <div className="iqty">Qty: {item.qty}{item.notes ? ` · ${item.notes}` : ''}</div>
                  {item.addedBy && item.addedBy !== 'admin' && <div className="iby">Added by {item.addedBy}</div>}
                  {item[`${item.status}By`] && item.status !== 'pending' && <div className="iby">{sc.label} by {item[`${item.status}By`]} · {fmtDT(item[`${item.status}At`])}</div>}
                </div>
                <div className="iright">
                  <span className="sbadge" style={{ color:sc.color, borderColor:`${sc.color}44`, background:sc.bg }}>{sc.label}</span>
                  {!event.archived && (
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn bghost bsm" onClick={() => setEditTarget(item)}>Edit</button>
                      <button className="btn bdng bsm" onClick={() => setRemoveTarget(item)}>✕</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
      {(removed.length > 0 || (event.auditLog||[]).length > 0) && (
        <div className="auditsec">
          <div className="auditt">⚠ Audit Log</div>
          {removed.map(item => (
            <div key={item.id} className="aurow rm">
              <div className="auitem">🗑 {item.name} ({item.qty}) [{item.category}]</div>
              <div className="aumeta">Removed by {item.removedBy} · {fmtDT(item.removedAt)} · was {item.status}</div>
            </div>
          ))}
          {(event.auditLog||[]).filter(l=>l.type==='mod').map((l,i) => (
            <div key={i} className="aurow mod"><div className="auitem">✏ {l.itemName}</div><div className="aumeta">{l.changes} · by {l.by} · {fmtDT(l.at)}</div></div>
          ))}
          {(event.auditLog||[]).filter(l=>l.type==='add'&&l.by!=='admin').map((l,i) => (
            <div key={i} className="aurow add"><div className="auitem">✚ {l.itemName} ({l.qty})</div><div className="aumeta">Added by {l.by} · {fmtDT(l.at)}</div></div>
          ))}
        </div>
      )}
      <div className="spacer" />
      {removeTarget && (
        <div className="mback ctr"><div className="mover" onClick={() => setRemoveTarget(null)} />
          <div className="modal"><Confirm title="Remove Item?" body={`Remove "${removeTarget.name}" (${removeTarget.qty})? This will be logged.`} danger onConfirm={handleRemove} onCancel={() => setRemoveTarget(null)} confirmLabel="Yes, Remove" /></div>
        </div>
      )}
      {statusTarget && <StatusSheet item={statusTarget} onSelect={handleStatus} onClose={() => setStatusTarget(null)} />}
      {showAdd && <ItemModal masterItems={masterItems} onSave={handleAddItem} onClose={() => setShowAdd(false)} />}
      {editTarget && <ItemModal item={editTarget} masterItems={masterItems} onSave={handleEditItem} onClose={() => setEditTarget(null)} />}
      {showTruck && <TruckModal event={event} onSave={handleTruck} onClose={() => setShowTruck(false)} fleet={fleet} />}
      {showEditEvent && <EventForm existing={event} masterItems={masterItems} onSave={async ev => { await db.upsertEvent(ev); for (const item of ev.items) { await db.upsertItem(item, ev.id); } onUpdate(ev); setShowEditEvent(false); pt('Event updated!', 'ok'); }} onClose={() => setShowEditEvent(false)} />}
    </div>
  );
}

function EventList({ events, user, onSelect, onCreateNew }) {
  const [tab, setTab] = useState('active');
  const isAdmin = user.role === 'admin';
  const live = events.filter(e => !e.archived && (isAdmin || e.live));
  const archived = events.filter(e => e.archived);
  const visible = tab === 'active' ? live : archived;
  return (
    <div>
      <div className="tabrow">
        <button className={'btn bsm ' + (tab==='active'?'bacc':'bghost')} onClick={() => setTab('active')}>Active ({live.length})</button>
        <button className={'btn bsm ' + (tab==='archived'?'bacc':'bghost')} onClick={() => setTab('archived')}>Archived ({archived.length})</button>
      </div>
      {visible.length === 0 && <div className="empty"><div className="eico">{tab==='active'?'🎪':'📁'}</div><div className="etxt">{tab==='active'?(isAdmin?'No events. Create one!':'No live events right now.'):'No archived events.'}</div></div>}
      {visible.map(ev => {
        const active = (ev.items||[]).filter(i => !i.removedAt);
        const done = active.filter(i => i.status==='loaded'||i.status==='returned').length;
        const pct = active.length ? Math.round((done/active.length)*100) : 0;
        return (
          <div key={ev.id} className={'ecard'+(ev.archived?' arc':'')} onClick={() => onSelect(ev)}>
            <div className="ehd">
              <div><div className="ename">{ev.name}</div><div className="evenue">{ev.venue||ev.address||'—'}</div></div>
              <div className="pills"><span className={'pill '+(ev.archived?'parc':ev.live?'plive':'pdraft')}>{ev.archived?'Archived':ev.live?'Live':'Draft'}</span></div>
            </div>
            <div className="emeta">
              <div className="mchip"><div className="ml">Event Dates</div><div className="mv">{fmt(ev.eventStart)} – {fmt(ev.eventEnd)}</div></div>
              <div className="mchip"><div className="ml">Install</div><div className="mv">{fmtDT(ev.installDT)}</div></div>
              {ev.truck && <div className="mchip"><div className="ml">Truck</div><div className="mv">{ev.truck}</div></div>}
              {ev.trailer && <div className="mchip"><div className="ml">Trailer</div><div className="mv">{ev.trailer}</div></div>}
            </div>
            <div className="eprog">
              <div className="ptrack"><div className="pfill" style={{ width:`${pct}%` }} /></div>
              <div className="plbls"><span>{active.length} items</span><span>{pct}% complete</span></div>
            </div>
          </div>
        );
      })}
      {isAdmin && tab==='active' && <button className="fab" onClick={onCreateNew}>＋</button>}
    </div>
  );
}

function ActivityLog({ users }) {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  useEffect(() => { db.getAllActivity().then(data => { setLogs(data); setLoading(false); }); }, []);
  const empIds = [...new Set(logs.map(l => l.user_id))];
  const filtered = filter === 'all' ? logs : logs.filter(l => l.user_id === filter);
  const resolveUser = (id) => users.find(u => u.id === id);
  if (loading) return <div className="empty"><div className="etxt">Loading…</div></div>;
  return (
    <div>
      <div className="tabrow">
        <button className={'btn bsm '+(filter==='all'?'bacc':'bghost')} onClick={() => setFilter('all')}>All</button>
        {empIds.map(id => { const u = resolveUser(id); return <button key={id} className={'btn bsm '+(filter===id?'bacc':'bghost')} onClick={() => setFilter(id)}>{u?u.name:id}</button>; })}
      </div>
      {filtered.length === 0 && <div className="empty"><div className="eico">📋</div><div className="etxt">No activity yet.</div></div>}
      <div style={{ background:'var(--sf)', border:'1px solid var(--br)', borderRadius:'var(--rl)', overflow:'hidden' }}>
        {filtered.map((l, i) => {
          const u = resolveUser(l.user_id);
          return (
            <div key={i} className="logrow">
              <div className="logav">{(u?u.name:l.by_name||'?')[0]}</div>
              <div className="logbody">
                <div className="logact"><strong style={{ color:'var(--tx)' }}>{l.by_name}</strong> — {l.detail}</div>
                <div className="logt">{fmtFull(l.created_at)}</div>
                <div className="logevt">Event: {l.event_name}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UserManager({ users, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name:'', pin:'', email:'', role:'employee' });
  const pt = (msg, type) => setToast({ msg, type });
  const handleAdd = async () => {
    if (!form.name.trim() || form.pin.length !== 4) { pt('Name & 4-digit PIN required', 'err'); return; }
    const newUser = { id:uid(), name:form.name.trim(), pin:form.pin, email:form.email, role:form.role, active:true, createdAt:nowISO() };
    await db.upsertUser(newUser);
    onUpdate([...users, newUser]);
    setShowAdd(false); setForm({ name:'', pin:'', email:'', role:'employee' });
    pt('Team member added!', 'ok');
  };
  const handleEdit = async () => {
    await db.upsertUser(editUser);
    onUpdate(users.map(u => u.id === editUser.id ? editUser : u));
    setEditUser(null); pt('User updated', 'ok');
  };
  const handleDeactivate = async () => {
    await db.deleteUser(confirmDel.id);
    onUpdate(users.map(u => u.id === confirmDel.id ? { ...u, active:false, deactivatedAt:nowISO() } : u));
    setConfirmDel(null); pt(`${confirmDel.name} deactivated — data retained`, 'ok');
  };
  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <div className="shd" style={{ marginBottom:14 }}>
        <span className="slbl">Team ({users.filter(u=>u.active&&u.role!=='admin').length} active)</span>
        <button className="btn bacc bsm" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>
      {users.filter(u => u.role !== 'admin').map(u => (
        <div key={u.id} className="ucard">
          <div className="uavlg" style={{ opacity:u.active?1:.45 }}>{u.name[0]}</div>
          <div className="ucinfo">
            <div className="ucname">{u.name}{!u.active&&<span className="iabadge">Inactive</span>}</div>
            <div className="ucmeta">{u.email||'No email'} · PIN: {u.pin}</div>
            {!u.active && u.deactivatedAt && <div style={{ fontSize:10, color:'var(--dn)', marginTop:2 }}>Deactivated {fmtDT(u.deactivatedAt)}</div>}
          </div>
          <div className="ucacts">
            {u.active ? (<><button className="btn bghost bsm" onClick={() => setEditUser({...u})}>Edit</button><button className="btn bdng bsm" onClick={() => setConfirmDel(u)}>✕</button></>) : (<button className="btn bok bsm" onClick={async () => { await db.upsertUser({...u,active:true,deactivatedAt:null}); onUpdate(users.map(x=>x.id===u.id?{...x,active:true,deactivatedAt:null}:x)); }}>Restore</button>)}
          </div>
        </div>
      ))}
      {showAdd && (<div className="mback ctr"><div className="mover" onClick={() => setShowAdd(false)} /><div className="modal"><div className="mtitle">Add Team Member</div><div className="field"><label className="flbl">Full Name *</label><input className="fi" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} autoFocus /></div><div className="field"><label className="flbl">Email</label><input className="fi" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></div><div className="field"><label className="flbl">4-Digit PIN *</label><input className="fi" type="number" value={form.pin} onChange={e=>setForm(p=>({...p,pin:e.target.value.slice(0,4)}))} /></div><div className="field"><label className="flbl">Role</label><select className="fsel" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}><option value="employee">Employee</option><option value="admin">Admin</option></select></div><div className="macts"><button className="btn bghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn bprim" style={{ flex:2 }} onClick={handleAdd}>Add Member</button></div></div></div>)}
      {editUser && (<div className="mback ctr"><div className="mover" onClick={() => setEditUser(null)} /><div className="modal"><div className="mtitle">Edit: {editUser.name}</div><div className="field"><label className="flbl">Full Name</label><input className="fi" value={editUser.name} onChange={e=>setEditUser(p=>({...p,name:e.target.value}))} /></div><div className="field"><label className="flbl">Email</label><input className="fi" type="email" value={editUser.email} onChange={e=>setEditUser(p=>({...p,email:e.target.value}))} /></div><div className="field"><label className="flbl">PIN (4 digits)</label><input className="fi" type="number" value={editUser.pin} onChange={e=>setEditUser(p=>({...p,pin:e.target.value.slice(0,4)}))} /></div><div className="field"><label className="flbl">Role</label><select className="fsel" value={editUser.role} onChange={e=>setEditUser(p=>({...p,role:e.target.value}))}><option value="employee">Employee</option><option value="admin">Admin</option></select></div><div className="macts"><button className="btn bghost" onClick={() => setEditUser(null)}>Cancel</button><button className="btn bprim" style={{ flex:2 }} onClick={handleEdit}>Save Changes</button></div></div></div>)}
      {confirmDel && (<div className="mback ctr"><div className="mover" onClick={() => setConfirmDel(null)} /><div className="modal"><Confirm title="Deactivate User?" body={`${confirmDel.name} will be locked out. All their activity is preserved.`} danger onConfirm={handleDeactivate} onCancel={() => setConfirmDel(null)} confirmLabel="Deactivate" /></div></div>)}
    </div>
  );
}

function MasterItemList({ masterItems, onUpdate }) {
  const categories = useContext(CatContext);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name:'', category:categories[0] });
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState(null);
  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <div className="shd" style={{ marginBottom:8 }}><span className="slbl">Gear Library ({masterItems.length})</span><button className="btn bacc bsm" onClick={() => setShowAdd(true)}>+ Add</button></div>
      <div className="infobanner">These items appear as autocomplete suggestions when adding gear to events.</div>
      {categories.map(cat => { const catItems = masterItems.filter(m => m.category === cat); if (!catItems.length) return null; return (<div key={cat} className="catblk"><div className="catlbl">{cat}</div>{catItems.map(m => (<div key={m.id} className="mitem"><span className="mname">{m.name}</span><span className="mcat">{m.category}</span><button className="btn bdng bsm" onClick={() => setConfirmDel(m)}>✕</button></div>))}</div>); })}
      {showAdd && (<div className="mback ctr"><div className="mover" onClick={() => setShowAdd(false)} /><div className="modal"><div className="mtitle">Add to Gear Library</div><div className="field"><label className="flbl">Item Name *</label><input className="fi" value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} autoFocus /></div><div className="field"><label className="flbl">Category</label><select className="fsel" value={newItem.category} onChange={e=>setNewItem(p=>({...p,category:e.target.value}))}>{categories.map(c=><option key={c}>{c}</option>)}</select></div><div className="macts"><button className="btn bghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn bprim" style={{ flex:2 }} onClick={async () => { if(!newItem.name.trim())return; const item={id:uid(),name:newItem.name.trim(),category:newItem.category}; await db.addMasterItem(item); onUpdate([...masterItems,item]); setNewItem({name:'',category:categories[0]}); setShowAdd(false); setToast({msg:'Added to Gear Library',type:'ok'}); }}>Add</button></div></div></div>)}
      {confirmDel && (<div className="mback ctr"><div className="mover" onClick={() => setConfirmDel(null)} /><div className="modal"><Confirm title="Remove from Library?" body={`Remove "${confirmDel.name}"?`} danger onConfirm={async () => { await db.deleteMasterItem(confirmDel.id); onUpdate(masterItems.filter(m=>m.id!==confirmDel.id)); setConfirmDel(null); setToast({msg:'Removed',type:'err'}); }} onCancel={() => setConfirmDel(null)} confirmLabel="Remove" /></div></div>)}
    </div>
  );
}

function FleetLibrary({ fleet, onUpdate }) {
  const [showAdd, setShowAdd] = useState(null);
  const [newItem, setNewItem] = useState({ name:'', detail:'' });
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState(null);
  const trucks = (fleet && fleet.trucks) ? fleet.trucks : [];
  const trailers = (fleet && fleet.trailers) ? fleet.trailers : [];
  const handleAdd = async () => {
    if (!newItem.name.trim()) return;
    const entry = { id:uid(), type:showAdd, name:newItem.name.trim(), detail:newItem.detail.trim() };
    await db.addFleetItem(entry);
    const updated = showAdd === 'truck' ? { ...fleet, trucks:[...trucks, entry] } : { ...fleet, trailers:[...trailers, entry] };
    onUpdate(updated); setNewItem({ name:'', detail:'' }); setShowAdd(null);
    setToast({ msg:(showAdd==='truck'?'Truck':'Trailer')+' added!', type:'ok' });
  };
  const handleDel = async () => {
    await db.deleteFleetItem(confirmDel.id);
    const updated = confirmDel.type === 'truck' ? { ...fleet, trucks:trucks.filter(t=>t.id!==confirmDel.id) } : { ...fleet, trailers:trailers.filter(t=>t.id!==confirmDel.id) };
    onUpdate(updated); setConfirmDel(null); setToast({ msg:'Removed from fleet', type:'err' });
  };
  const renderSection = (title, items, type, icon) => (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div className="catlbl" style={{ borderBottom:'none', paddingBottom:0, marginBottom:0 }}>{icon} {title} ({items.length})</div>
        <button className="btn bacc bsm" onClick={() => { setShowAdd(type); setNewItem({ name:'', detail:'' }); }}>+ Add</button>
      </div>
      {items.length === 0 && <div style={{ fontSize:12, color:'var(--mu)', padding:'8px 0' }}>No {title.toLowerCase()} yet.</div>}
      {items.map(t => (<div key={t.id} className="mitem"><div style={{ flex:1 }}><div className="mname">{t.name}</div>{t.detail&&<div style={{ fontSize:11, color:'var(--mu)', marginTop:2 }}>{t.detail}</div>}</div><button className="btn bdng bsm" onClick={() => setConfirmDel({ type, id:t.id, name:t.name })}>✕</button></div>))}
    </div>
  );
  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <div className="infobanner">Trucks and trailers listed here appear as dropdown options when assigning vehicles to events.</div>
      {renderSection('Trucks', trucks, 'truck', '🚛')}
      {renderSection('Trailers', trailers, 'trailer', '🚚')}
      {showAdd && (<div className="mback ctr"><div className="mover" onClick={() => setShowAdd(null)} /><div className="modal"><div className="mtitle">Add {showAdd==='truck'?'Truck':'Trailer'}</div><div className="field"><label className="flbl">Name / ID *</label><input className="fi" value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} placeholder={showAdd==='truck'?'e.g. Box Truck #3':'e.g. 20ft Enclosed #3'} autoFocus /></div><div className="field"><label className="flbl">Make / Model</label><input className="fi" value={newItem.detail} onChange={e=>setNewItem(p=>({...p,detail:e.target.value}))} placeholder={showAdd==='truck'?'e.g. Ford F-650':'e.g. Haulmark 20ft'} /></div><div className="macts"><button className="btn bghost" onClick={() => setShowAdd(null)}>Cancel</button><button className="btn bprim" style={{ flex:2 }} onClick={handleAdd}>Add</button></div></div></div>)}
      {confirmDel && (<div className="mback ctr"><div className="mover" onClick={() => setConfirmDel(null)} /><div className="modal"><Confirm title="Remove Vehicle?" body={`Remove "${confirmDel.name}"?`} danger onConfirm={handleDel} onCancel={() => setConfirmDel(null)} confirmLabel="Remove" /></div></div>)}
    </div>
  );
}

function CategoryManager({ categories, onUpdate }) {
  const [newCat, setNewCat] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState(null);
  const handleAdd = async () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (categories.map(c=>c.toLowerCase()).includes(trimmed.toLowerCase())) { setToast({ msg:'Category already exists', type:'err' }); return; }
    await db.addCategory(trimmed, categories.length + 1);
    onUpdate([...categories, trimmed]); setNewCat(''); setToast({ msg:`"${trimmed}" added`, type:'ok' });
  };
  const handleEdit = async (idx) => {
    const trimmed = editVal.trim();
    if (!trimmed) return;
    await db.updateCategory(categories[idx], trimmed);
    onUpdate(categories.map((c,i) => i===idx ? trimmed : c));
    setEditIdx(null); setToast({ msg:'Category updated', type:'ok' });
  };
  const handleDelete = async (idx) => {
    await db.deleteCategory(categories[idx]);
    onUpdate(categories.filter((_,i) => i!==idx));
    setConfirmDel(null); setToast({ msg:'Category removed', type:'err' });
  };
  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <div className="infobanner">Categories organize gear items across all events. Renaming won't retroactively update existing items.</div>
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <input className="fi" value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAdd()} placeholder="New category name…" style={{ flex:1 }} />
        <button className="btn bacc bsm" onClick={handleAdd}>+ Add</button>
      </div>
      {categories.map((cat, idx) => (
        <div key={idx} className="mitem">
          {editIdx === idx ? (
            <><input className="fi" value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleEdit(idx)} style={{ flex:1, marginRight:8 }} autoFocus /><button className="btn bok bsm" onClick={() => handleEdit(idx)}>Save</button><button className="btn bghost bsm" onClick={() => setEditIdx(null)}>Cancel</button></>
          ) : (
            <><span className="mname">{cat}</span><button className="btn bghost bsm" onClick={() => { setEditIdx(idx); setEditVal(cat); }}>Edit</button><button className="btn bdng bsm" onClick={() => setConfirmDel(idx)}>✕</button></>
          )}
        </div>
      ))}
      {confirmDel !== null && (<div className="mback ctr"><div className="mover" onClick={() => setConfirmDel(null)} /><div className="modal"><Confirm title="Remove Category?" body={`Remove "${categories[confirmDel]}"? Items using this category won't be affected.`} danger onConfirm={() => handleDelete(confirmDel)} onCancel={() => setConfirmDel(null)} confirmLabel="Remove" /></div></div>)}
    </div>
  );
}

function Login({ onLogin, users }) {
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [stage, setStage] = useState('select');
  const [pendingUser, setPendingUser] = useState(null);
  const active = users.filter(u => u.active !== false);
  const handlePad = (v) => {
    if (v === 'back') { setPin(p => p.slice(0,-1)); setError(''); return; }
    if (pin.length < 4) {
      const next = pin + v;
      setPin(next);
      if (next.length === 4) {
        const u = active.find(u => u.id === userId && u.pin === next);
        if (!u) { setError('Incorrect PIN. Try again.'); setTimeout(() => setPin(''), 300); return; }
        setPendingUser(u); setStage('confirm');
      }
    }
  };
  return (
    <div className="login">
      <div className="l-eyebrow">Crew Portal</div>
      <div className="l-title">EVENT<em>FLOW</em></div>
      <div className="l-sub">Warehouse &amp; Event Management</div>
      <div className="l-card">
        {stage === 'confirm' && pendingUser ? (
          <div className="l-confirm">
            <div className="lc-title">⚡ Confirm Login</div>
            <div className="lc-body">Signing in as <strong>{pendingUser.name}</strong>.<br />All actions will be recorded under your account.</div>
            <div className="lc-btns">
              <button className="btn bghost" onClick={() => { setStage('select'); setPin(''); setPendingUser(null); }}>Back</button>
              <button className="btn bprim" onClick={() => onLogin(pendingUser)}>Confirm &amp; Enter</button>
            </div>
          </div>
        ) : (
          <>
            <div className="field">
              <label className="flbl">Select your name</label>
              <select className="fsel" value={userId} onChange={e => { setUserId(e.target.value); setPin(''); setError(''); setStage('pin'); }}>
                <option value="">— choose —</option>
                {active.map(u => <option key={u.id} value={u.id}>{u.name}{u.role==='admin'?' (Admin)':''}</option>)}
              </select>
            </div>
            {userId && (
              <>
                <div className="field">
                  <label className="flbl">Enter your PIN</label>
                  <div className="pdots">{[0,1,2,3].map(i => <div key={i} className={'pdot'+(i<pin.length?' on':'')}>{i<pin.length?'●':''}</div>)}</div>
                </div>
                <div className="pgrid">
                  {['1','2','3','4','5','6','7','8','9','⌫','0','→'].map((k,i) => (
                    <button key={i} className={'pkey'+(k==='→'?' go':'')} style={k==='→'?{opacity:.35,cursor:'default'}:{}} onClick={() => k==='⌫'?handlePad('back'):k!=='→'?handlePad(k):null}>{k}</button>
                  ))}
                </div>
                <div className="l-err">{error}</div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [masterItems, setMasterItems] = useState([]);
  const [fleet, setFleet] = useState({ trucks:[], trailers:[] });
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [adminTab, setAdminTab] = useState('Events');
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [evs, us, mi, fl, cats] = await Promise.all([
          db.getEvents(), db.getUsers(), db.getMasterItems(), db.getFleet(), db.getCategories()
        ]);
        setEvents(evs);
        setUsers(us.map(u => ({ id:u.id, name:u.name, pin:u.pin, role:u.role, email:u.email||'', active:u.active, deactivatedAt:u.deactivated_at, createdAt:u.created_at })));
        setMasterItems(mi);
        setFleet(fl);
        setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
      } catch (err) {
        console.error('Load error:', err);
      }
      setLoading(false);
    })();
  }, []);

  const handleCreateEvent = async (ev) => {
    await db.upsertEvent(ev);
    for (const item of ev.items) { await db.upsertItem(item, ev.id); }
    setEvents(prev => { const filtered = prev.filter(e => e.id !== ev.id); return [ev, ...filtered]; });
    setShowCreate(false);
    setToast({ msg:ev.live ? 'Event published! 🎉' : 'Draft saved', type:'ok' });
  };

  const handleUpdateEvent = async (ev) => {
    setEvents(prev => prev.map(e => e.id === ev.id ? ev : e));
    setSelectedEvent(ev);
  };

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="loading">CREWFLOW<span style={{ animation:'bpulse 1s infinite', marginLeft:8 }}>●</span></div>
    </>
  );

  if (!user) return (
    <>
      <style>{CSS}</style>
      <Login onLogin={setUser} users={users} />
    </>
  );

  const isAdmin = user.role === 'admin';
  const ATABS = ['Events','Activity Log','Team','Gear Library','Fleet','Categories'];

  return (
    <CatContext.Provider value={categories}>
      <div className="app">
        {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        <div className="hdr">
          <div className="brand"><div className="bdot" />CREWFLOW</div>
          <div className="hdr-r">
            <div className="uchip"><div className="uav">{user.name[0]}</div><span className="uname">{user.name}</span>{isAdmin&&<span className="abadge">Admin</span>}</div>
            <button className="signout" onClick={() => { setUser(null); setSelectedEvent(null); setAdminTab('Events'); }}>Sign Out</button>
          </div>
        </div>
        {!selectedEvent && (
          <div className="nav">
            {isAdmin ? ATABS.map(t => <button key={t} className={'ntab'+(adminTab===t?' on':'')} onClick={() => setAdminTab(t)}>{t}</button>) : <button className="ntab on">My Events</button>}
          </div>
        )}
        <div className="main">
          {selectedEvent ? (
            <EventDetail event={selectedEvent} user={user} onBack={() => setSelectedEvent(null)} onUpdate={handleUpdateEvent} masterItems={masterItems} fleet={fleet} />
          ) : !isAdmin ? (
            <EventList events={events} user={user} onSelect={setSelectedEvent} onCreateNew={() => setShowCreate(true)} />
          ) : adminTab === 'Events' ? (
            <EventList events={events} user={user} onSelect={setSelectedEvent} onCreateNew={() => setShowCreate(true)} />
          ) : adminTab === 'Activity Log' ? (
            <ActivityLog users={users} />
          ) : adminTab === 'Team' ? (
            <UserManager users={users} onUpdate={setUsers} />
          ) : adminTab === 'Gear Library' ? (
            <MasterItemList masterItems={masterItems} onUpdate={setMasterItems} />
          ) : adminTab === 'Fleet' ? (
            <FleetLibrary fleet={fleet} onUpdate={setFleet} />
          ) : adminTab === 'Categories' ? (
            <CategoryManager categories={categories} onUpdate={setCategories} />
          ) : null}
        </div>
        {showCreate && <EventForm masterItems={masterItems} onSave={handleCreateEvent} onClose={() => setShowCreate(false)} />}
      </div>
    </CatContext.Provider>
  );
}
