import React, { useState, useEffect, useRef, useContext } from 'react';
import { supabase } from './supabaseClient';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = ['Audio','Video','Lighting','Staging','Rigging','Power','Backline','Décor','Misc'];
const CatContext = React.createContext(DEFAULT_CATEGORIES);

// #3 Updated status colors — Pending=Red, Prepped=Orange, Loaded=Green, Returned REMOVED
const STATUS_CONFIG = {
  pending:  { label:'Pending',        color:'#FF4040', bg:'rgba(255,64,64,0.12)'    },
  prepped:  { label:'Pulled/Prepped', color:'#F97316', bg:'rgba(249,115,22,0.12)'   },
  loaded:   { label:'Loaded',         color:'#10B981', bg:'rgba(16,185,129,0.12)'   },
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#F0F2F5;--sf:#FFFFFF;--s2:#E8ECF0;--s3:#DDE2E8;
  --br:#C8D0D8;--br2:#B0BAC4;
  --tx:#111827;--mu:#4B5563;--fa:#6B7280;
  --ac:#1D4ED8;--ac2:rgba(29,78,216,0.1);
  --dn:#DC2626;--dn2:rgba(220,38,38,0.1);
  --wn:#D97706;--wn2:rgba(217,119,6,0.1);
  --ok:#059669;--ok2:rgba(5,150,105,0.1);
  --bl:#2563EB;--bl2:rgba(37,99,235,0.1);
  --or:#EA580C;--or2:rgba(234,88,12,0.1);
  --r:6px;--rl:10px;--rx:16px;
  --fh:'Barlow Condensed',sans-serif;--fb:'Barlow',sans-serif;
}
html,body,#root{height:100%;min-height:100vh;background:#F0F2F5;color:var(--tx);font-family:var(--fb)}
input,textarea,select,button{font-family:var(--fb)}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--br2);border-radius:2px}
.app{min-height:100vh;display:flex;flex-direction:column;max-width:680px;margin:0 auto;background:var(--bg);box-shadow:0 0 0 1px var(--br)}
.hdr{background:var(--sf);border-bottom:1px solid var(--br);padding:0 14px;display:flex;align-items:center;justify-content:space-between;height:56px;position:sticky;top:0;z-index:100}
.brand{font-family:var(--fh);font-size:22px;font-weight:900;letter-spacing:2px;color:var(--bl);display:flex;align-items:center;gap:7px}
.bdot{width:7px;height:7px;background:var(--bl);border-radius:50%;animation:bpulse 2.5s infinite}
@keyframes bpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.6)}}
.hdr-r{display:flex;align-items:center;gap:8px}
.uchip{background:var(--s2);border:1px solid var(--br);border-radius:20px;padding:4px 10px 4px 5px;display:flex;align-items:center;gap:7px}
.uav{width:24px;height:24px;border-radius:50%;background:var(--bl);color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;font-family:var(--fh);flex-shrink:0}
.uname{font-size:12px;font-weight:600;color:var(--tx)}
.abadge{background:var(--bl);color:#fff;font-size:8px;font-weight:900;letter-spacing:1.5px;padding:2px 6px;border-radius:3px;text-transform:uppercase}
.signout{background:none;border:1px solid var(--br);border-radius:var(--r);padding:5px 10px;color:var(--mu);font-size:11px;cursor:pointer}
.signout:active{color:var(--dn);border-color:var(--dn)}
.nav{background:var(--sf);border-bottom:1px solid var(--br);display:flex;overflow-x:auto;scrollbar-width:none;flex-shrink:0}
.nav::-webkit-scrollbar{display:none}
.ntab{flex-shrink:0;padding:11px 14px;font-family:var(--fh);font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--mu);border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;transition:.18s;white-space:nowrap}
.ntab.on{color:var(--bl);border-bottom-color:var(--bl)}
.main{flex:1;padding:14px;overflow-y:auto}
.spacer{height:80px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;border-radius:var(--r);font-weight:700;cursor:pointer;transition:.12s;white-space:nowrap;border:none}
.btn:active{opacity:.78}
.bprim{background:var(--bl);color:#fff;padding:13px 20px;font-family:var(--fh);font-size:16px;letter-spacing:1px;text-transform:uppercase;width:100%}
.bghost{background:var(--s2);border:1px solid var(--br);color:var(--mu);padding:8px 13px;font-size:13px}
.bdng{background:var(--dn2);border:1px solid var(--dn);color:var(--dn);padding:8px 13px;font-size:13px}
.bacc{background:var(--bl2);border:1px solid var(--bl);color:var(--bl);padding:8px 13px;font-size:13px}
.bok{background:var(--ok2);border:1px solid var(--ok);color:var(--ok);padding:8px 13px;font-size:13px}
.bsm{padding:5px 10px;font-size:11px;font-weight:700;letter-spacing:.4px}
.field{margin-bottom:13px}
.flbl{font-size:10px;font-weight:700;letter-spacing:2px;color:var(--mu);text-transform:uppercase;display:block;margin-bottom:6px}
.fi,.fsel,.fta{width:100%;background:var(--s2);border:1px solid var(--br);border-radius:var(--r);padding:11px 13px;color:var(--tx);font-size:14px;outline:none;transition:border-color .18s;appearance:none}
.fi:focus,.fsel:focus,.fta:focus{border-color:var(--bl)}
.fta{resize:vertical;min-height:74px}
.frow{display:flex;gap:10px}
.frow .field{flex:1}

/* #9 LOGIN — CREWFLOW branding */
.login{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;background:#F0F2F5}
.l-eyebrow{font-family:var(--fh);font-size:11px;font-weight:700;letter-spacing:4px;color:var(--mu);text-transform:uppercase;margin-bottom:8px;text-align:center}
.l-title{font-family:var(--fh);font-size:54px;font-weight:900;line-height:.93;text-align:center;margin-bottom:6px}
.l-title em{color:var(--bl);font-style:normal;display:block}
.l-sub{font-size:13px;color:var(--mu);margin-bottom:28px;text-align:center}
.l-card{background:var(--sf);border:1px solid var(--br);border-radius:var(--rx);padding:22px;width:100%;max-width:340px}
.pdots{display:flex;gap:10px;margin-bottom:18px}
.pdot{flex:1;height:48px;background:var(--s2);border:1px solid var(--br);border-radius:var(--r);display:flex;align-items:center;justify-content:center;font-size:18px;transition:.14s}
.pdot.on{border-color:var(--bl);color:var(--bl)}
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pkey{background:var(--s2);border:1px solid var(--br);border-radius:var(--r);height:50px;font-family:var(--fh);font-size:22px;font-weight:700;color:var(--tx);cursor:pointer;transition:.1s;display:flex;align-items:center;justify-content:center}
.pkey:active{background:var(--bl2);border-color:var(--bl);color:var(--bl)}
.pkey.go{background:var(--bl);color:#fff;border-color:var(--bl)}
.l-err{color:var(--dn);font-size:12px;text-align:center;margin-top:8px;min-height:16px}
.l-confirm{background:var(--s2);border:1px solid var(--wn);border-radius:var(--rl);padding:16px;margin-bottom:6px}
.lc-title{font-family:var(--fh);font-size:15px;font-weight:800;color:var(--wn);letter-spacing:1px;text-transform:uppercase;margin-bottom:5px}
.lc-body{font-size:13px;color:var(--tx);line-height:1.5;margin-bottom:14px}
.lc-btns{display:flex;gap:8px}
.lc-btns .btn{flex:1;padding:11px;font-size:14px;font-family:var(--fh);font-weight:800;letter-spacing:.8px;text-transform:uppercase}

/* TOAST */
.twrap{position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:999;pointer-events:none}
.toast{background:var(--sf);border:1px solid var(--br);border-radius:20px;padding:8px 16px;font-size:13px;font-weight:600;color:var(--tx);white-space:nowrap;animation:tin .22s ease;box-shadow:0 4px 20px rgba(0,0,0,.4)}
.toast.ok{border-color:var(--ok);color:var(--ok)}
.toast.err{border-color:var(--dn);color:var(--dn)}
@keyframes tin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}

/* MODAL */
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

/* EVENT CARDS */
.ecard{background:var(--sf);border:1px solid var(--br);border-radius:var(--rl);margin-bottom:10px;overflow:hidden;transition:.15s;cursor:pointer}
.ecard:active{transform:scale(.99);border-color:var(--ac);border-color:var(--bl)}
.ecard.arc{opacity:.52}
/* #11 Ready to Roll glow */
.ecard.rtr{border-color:var(--ok);border-width:2px;box-shadow:0 0 0 3px rgba(5,150,105,.2),0 4px 24px rgba(5,150,105,.25)}
.ehd{padding:14px 14px 10px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.ename{font-family:var(--fh);font-size:25px;font-weight:900;line-height:1;color:var(--tx)}
.evenue{font-size:12px;color:var(--mu);margin-top:3px}
.pills{display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end}
.pill{font-size:9px;font-weight:800;letter-spacing:1.5px;padding:3px 8px;border-radius:20px;text-transform:uppercase;border:1px solid;white-space:nowrap}
.plive{color:var(--ok);border-color:rgba(16,185,129,.35);background:var(--ok2)}
.pdraft{color:var(--wn);border-color:rgba(245,158,11,.35);background:var(--wn2)}
.parc{color:var(--mu);border-color:var(--br);background:var(--s2)}
.prtr{color:#fff;border-color:var(--ok);background:var(--ok);font-weight:900;letter-spacing:1px}
.emeta{padding:0 14px 10px;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.mchip{background:var(--s2);border-radius:var(--r);padding:7px 10px}
.mchip .ml{font-size:9px;font-weight:700;letter-spacing:2px;color:var(--mu);text-transform:uppercase}
.mchip .mv{font-size:12px;font-weight:600;color:var(--tx);margin-top:2px}
.eprog{padding:0 14px 14px}
.ptrack{background:var(--s2);border-radius:3px;height:5px;overflow:hidden}
.pfill{background:#B45309;height:100%;border-radius:3px;transition:width .5s}
.pfill.rtr{background:var(--ok)}
.plbls{display:flex;justify-content:space-between;margin-top:5px;font-size:10px;color:var(--mu)}
.plbls.rtr{color:var(--ok);font-weight:900;font-size:12px;letter-spacing:.5px}

/* EVENT DETAIL */
.backrow{display:flex;align-items:center;gap:7px;margin-bottom:14px;color:var(--mu);cursor:pointer;width:fit-content}
.backrow:active{color:var(--ac)}
.backrow svg{width:15px;height:15px}
.backrow span{font-size:13px;font-weight:600}

/* #8 Collapsible event info */
.dh{background:var(--sf);border:1px solid var(--br);border-radius:var(--rl);margin-bottom:11px;overflow:hidden}
.dh-always{padding:14px 16px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.dh-collapse-btn{background:none;border:none;color:var(--mu);cursor:pointer;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;display:flex;align-items:center;gap:4px;padding:0;flex-shrink:0;margin-top:4px}
.dh-body{padding:0 16px 14px}
.dname{font-family:var(--fh);font-size:30px;font-weight:900;line-height:1}
.dsub{font-size:12px;color:var(--mu);margin-top:3px}
.dgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:11px}
.ichip{background:var(--s2);border:1px solid var(--br);border-radius:var(--r);padding:9px 11px}
.icl{font-size:9px;font-weight:700;letter-spacing:2px;color:var(--mu);text-transform:uppercase}
.icv{font-size:13px;font-weight:600;color:var(--tx);margin-top:2px;line-height:1.3}
.trchip{background:var(--s2);border:1px solid var(--br);border-radius:var(--r);padding:9px 11px;display:flex;align-items:center;cursor:pointer;transition:.15s;gap:8px;margin-top:7px}
.trchip:active{border-color:var(--ac)}

/* Crew assignment */
.crew-section{margin-top:7px;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.crew-block{background:var(--s2);border:1px solid var(--br);border-radius:var(--r);padding:9px 11px}
.crew-lbl{font-size:9px;font-weight:700;letter-spacing:2px;color:var(--mu);text-transform:uppercase;margin-bottom:7px}
.crew-member{display:flex;align-items:center;gap:7px;padding:4px 0;cursor:pointer}
.crew-cb{width:16px;height:16px;border-radius:3px;border:2px solid var(--br2);background:var(--s3);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:.15s}
.crew-cb.on{border-color:var(--bl);background:var(--bl2)}
.crew-name{font-size:12px;color:var(--tx);font-weight:500}
.crew-name-assigned{font-size:11px;color:var(--tx);font-weight:500}

/* Admin brief inside event info */
.brief-inline{background:var(--s3);border-left:3px solid var(--bl);border-radius:0 var(--r) var(--r) 0;padding:10px 12px;margin-top:8px}
.brieft{font-size:9px;font-weight:800;letter-spacing:2px;color:var(--bl);text-transform:uppercase;margin-bottom:5px}
.briefb{font-size:13px;color:var(--tx);line-height:1.6;white-space:pre-wrap}

/* PROGRESS BLOCK */
.pblock{background:var(--sf);border:1px solid var(--br);border-radius:var(--rl);padding:12px 14px;margin-bottom:11px}
.phd{display:flex;justify-content:space-between;margin-bottom:7px}
.phd span:first-child{font-size:10px;font-weight:700;letter-spacing:2px;color:var(--mu);text-transform:uppercase}
.phd span:last-child{font-size:14px;font-weight:800;color:var(--bl)}
.spills{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px}
.spill{font-size:9px;font-weight:700;padding:3px 8px;border-radius:20px;border:1px solid}

/* #11 Ready to Roll button */
.rtr-btn{width:100%;background:linear-gradient(135deg,rgba(5,150,105,.15),rgba(5,150,105,.08));border:2px solid var(--ok);border-radius:var(--rl);padding:18px;color:var(--ok);font-family:var(--fh);font-size:20px;font-weight:900;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:.2s;margin-bottom:20px;display:flex;align-items:center;justify-content:center;gap:10px}
.rtr-btn:active{opacity:.8}
.rtr-locked{width:100%;background:rgba(5,150,105,.06);border:2px dashed rgba(5,150,105,.3);border-radius:var(--rl);padding:14px;color:rgba(5,150,105,.5);font-family:var(--fh);font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:20px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:default}
.rtr-banner{background:rgba(16,185,129,.1);border:2px solid var(--ok);border-radius:var(--rl);padding:14px 16px;margin-bottom:11px;display:flex;align-items:center;gap:10px}
.rtr-banner-text{font-family:var(--fh);font-size:16px;font-weight:900;letter-spacing:2px;color:var(--ok);text-transform:uppercase;font-weight:900}
.edit-event-btn{background:var(--dn2);border:1px solid var(--dn);border-radius:var(--r);padding:8px 14px;color:var(--dn);font-size:12px;font-weight:700;cursor:pointer;margin-bottom:11px;display:inline-flex;align-items:center;gap:5px}

/* ITEMS */
.shd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.slbl{font-family:var(--fh);font-size:14px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--mu)}
.catblk{margin-bottom:16px}
/* #7 lighter category labels */
.catlbl{font-family:var(--fh);font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--mu);border-bottom:1px solid var(--br);padding-bottom:5px;margin-bottom:7px}
.irow{background:var(--sf);border:1px solid var(--br);border-radius:var(--r);padding:11px 12px;margin-bottom:5px;display:flex;align-items:center;gap:10px}
.ichk{width:26px;height:26px;border-radius:50%;border:2px solid var(--br2);background:var(--s2);flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.18s}
.ichk.prepped{border-color:var(--or);background:var(--or2)}
/* #4 loaded = bigger bolder checkmark */
.ichk.loaded{border-color:var(--ok);background:var(--ok2)}
.imain{flex:1;min-width:0}
.iname{font-size:16px;font-weight:600;color:var(--tx);line-height:1.3;word-break:break-word;white-space:normal}
.iqty{font-size:11px;color:var(--mu);margin-top:1px}
/* #7 lighter timestamps */
.iby{font-size:10px;color:var(--mu);margin-top:3px;font-style:italic}
.iright{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0}
.sbadge{font-size:8px;font-weight:800;letter-spacing:1px;padding:3px 8px;border-radius:20px;text-transform:uppercase;white-space:nowrap;border:1px solid}

/* AUTOCOMPLETE */
.acwrap{position:relative}
.aclist{position:absolute;top:100%;left:0;right:0;background:var(--sf);border:1px solid var(--bl);border-top:none;border-radius:0 0 var(--r) var(--r);z-index:60;max-height:190px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.45)}
.acitem{padding:10px 13px;cursor:pointer;font-size:14px;color:var(--tx);border-bottom:1px solid var(--br);display:flex;align-items:center;justify-content:space-between}
.acitem:last-child{border-bottom:none}
.acitem:hover{background:var(--s2)}
.accat{font-size:10px;color:var(--mu);font-weight:600}

/* STATUS SHEET */
.sback{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:300}
.sheet{position:fixed;bottom:0;left:0;right:0;background:var(--sf);border-top:1px solid var(--br);border-radius:var(--rx) var(--rx) 0 0;padding:20px;z-index:301;max-width:680px;margin:0 auto;animation:sup .22s ease}
@keyframes sup{from{transform:translateY(36px);opacity:0}to{transform:translateY(0);opacity:1}}
.stitle{font-family:var(--fh);font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--mu);margin-bottom:13px}
.sopt{display:flex;align-items:center;gap:11px;padding:13px;border-radius:var(--r);margin-bottom:7px;cursor:pointer;border:1px solid var(--br);background:var(--s2)}
.sopt:active{border-color:var(--ac)}
.sdot{width:11px;height:11px;border-radius:50%;flex-shrink:0}
.solbl{font-size:15px;font-weight:600}
.scur{margin-left:auto;font-size:9px;color:var(--mu);font-weight:700;letter-spacing:1px;text-transform:uppercase}

/* #6 Collapsible audit */
.auditsec{background:var(--sf);border:1px solid var(--br);border-radius:var(--rl);margin-top:18px;overflow:hidden}
.audit-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:pointer}
.audit-hdr:active{background:var(--s2)}
.auditt{font-family:var(--fh);font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--mu);display:flex;align-items:center;gap:6px}
.audit-body{padding:0 14px 12px}
.aurow{border-left:2px solid var(--br2);padding:6px 10px;margin-bottom:6px;border-radius:0 var(--r) var(--r) 0}
.aurow.rm{border-left-color:var(--dn)}
.aurow.add{border-left-color:var(--ok)}
.aurow.mod{border-left-color:var(--wn)}
.auitem{font-size:12px;color:var(--tx)}
.aumeta{font-size:10px;color:var(--mu);margin-top:2px}

/* EXPORT BUTTONS */
.export-row{display:flex;gap:8px;margin-top:16px;margin-bottom:4px}
.export-btn{flex:1;background:var(--s2);border:1px solid var(--br);border-radius:var(--r);padding:10px 6px;color:var(--mu);font-size:11px;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;transition:.15s}
.export-btn:active{border-color:var(--ac);color:var(--ac)}
.export-ico{font-size:18px}

/* ACTIVITY LOG */
.logrow{padding:11px 13px;border-bottom:1px solid var(--br);display:flex;align-items:flex-start;gap:10px}
.logrow:last-child{border-bottom:none}
.logav{width:30px;height:30px;border-radius:50%;background:var(--s2);border:1px solid var(--br);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;font-family:var(--fh);color:var(--bl);flex-shrink:0}
.logbody{flex:1;min-width:0}
.logact{font-size:13px;color:var(--tx);line-height:1.4}
.logt{font-size:10px;color:var(--mu);margin-top:2px}
.logevt{font-size:10px;color:var(--mu);font-style:italic}

/* USER MGMT */
.ucard{background:var(--sf);border:1px solid var(--br);border-radius:var(--rl);padding:13px;margin-bottom:8px;display:flex;align-items:center;gap:11px}
.uavlg{width:42px;height:42px;border-radius:50%;background:var(--s2);border:1px solid var(--br2);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:900;font-family:var(--fh);color:var(--bl);flex-shrink:0}
.ucinfo{flex:1;min-width:0}
.ucname{font-size:15px;font-weight:700;color:var(--tx);display:flex;align-items:center;gap:7px}
.ucmeta{font-size:11px;color:var(--mu);margin-top:2px}
.ucacts{display:flex;gap:6px;flex-shrink:0}
.iabadge{font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 7px;border-radius:20px;background:var(--dn2);color:var(--dn);border:1px solid var(--dn);text-transform:uppercase}
.mitem{background:var(--sf);border:1px solid var(--br);border-radius:var(--r);padding:10px 12px;margin-bottom:5px;display:flex;align-items:center;gap:10px}
.mname{flex:1;font-size:14px;font-weight:600;color:var(--tx)}
.mcat{font-size:10px;color:var(--mu);background:var(--s2);border:1px solid var(--br);border-radius:4px;padding:2px 7px}
.fab{position:fixed;bottom:22px;right:14px;width:52px;height:52px;background:var(--bl);border:none;border-radius:50%;font-size:24px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(232,255,71,.28);z-index:150}
.fab:active{transform:scale(.9)}
.empty{text-align:center;padding:44px 20px;color:var(--mu)}
.eico{font-size:34px;margin-bottom:10px}
.etxt{font-size:13px}
.tabrow{display:flex;gap:6px;margin-bottom:13px;flex-wrap:wrap}
.infobanner{background:var(--s2);border:1px solid var(--br);border-radius:4px;padding:7px 11px;margin-bottom:12px;font-size:12px;color:var(--mu)}
.loading{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F0F2F5;font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;letter-spacing:3px;color:var(--tx)}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const nowISO = () => new Date().toISOString();
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
const fmtDT = (d) => {
  if (!d) return '—';
  if (d === 'TBD') return 'TBD';
  return new Date(d).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
};
const fmtFull = (d) => d ? new Date(d).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit', second:'2-digit' }) : '—';

// ─── SUPABASE DATA LAYER ──────────────────────────────────────────────────────
const db = {
  getUsers: async () => { const { data } = await supabase.from('cf_users').select('*').order('created_at'); return data || []; },
  upsertUser: async (u) => supabase.from('cf_users').upsert({ id:u.id, name:u.name, pin:u.pin, role:u.role, email:u.email||'', active:u.active, deactivated_at:u.deactivatedAt||null }),
  deleteUser: async (id) => supabase.from('cf_users').update({ active:false, deactivated_at:nowISO() }).eq('id', id),
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
      readyToRoll: ev.ready_to_roll || false,
      installCrew: ev.install_crew || [],
      strikeCrew: ev.strike_crew || [],
      installLead: ev.install_lead || '',
      strikeLead: ev.strike_lead || '',
      createdAt: ev.created_at, updatedAt: ev.updated_at,
      items: (items || []).filter(i => i.event_id === ev.id).map(i => ({
        id: i.id, name: i.name, qty: i.qty, category: i.category, notes: i.notes,
        status: i.status, addedBy: i.added_by, addedByUserId: i.added_by_user_id,
        addedAt: i.added_at, preppedBy: i.prepped_by, preppedAt: i.prepped_at,
        loadedBy: i.loaded_by, loadedAt: i.loaded_at,
        modifiedBy: i.modified_by, modifiedAt: i.modified_at,
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
    ready_to_roll: ev.readyToRoll||false,
    install_crew: ev.installCrew||[],
    strike_crew: ev.strikeCrew||[],
    install_lead: ev.installLead||'',
    strike_lead: ev.strikeLead||'',
    updated_at: nowISO(),
  }),
  upsertItem: async (item, eventId) => supabase.from('cf_items').upsert({
    id: item.id, event_id: eventId, name: item.name, qty: item.qty,
    category: item.category, notes: item.notes||'', status: item.status||'pending',
    added_by: item.addedBy||'', added_by_user_id: item.addedByUserId||'',
    added_at: item.addedAt||null,
    prepped_by: item.preppedBy||'', prepped_at: item.preppedAt||null,
    loaded_by: item.loadedBy||'', loaded_at: item.loadedAt||null,
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
  getMasterItems: async () => { const { data } = await supabase.from('cf_master_items').select('*').order('name'); return data || []; },
  addMasterItem: async (item) => supabase.from('cf_master_items').insert({ id:item.id, name:item.name, category:item.category }),
  deleteMasterItem: async (id) => supabase.from('cf_master_items').delete().eq('id', id),
  getFleet: async () => {
    const { data } = await supabase.from('cf_fleet').select('*').order('created_at');
    if (!data) return { trucks:[], trailers:[] };
    return { trucks: data.filter(f=>f.type==='truck'), trailers: data.filter(f=>f.type==='trailer') };
  },
  addFleetItem: async (item) => supabase.from('cf_fleet').insert({ id:item.id, type:item.type, name:item.name, detail:item.detail||'' }),
  deleteFleetItem: async (id) => supabase.from('cf_fleet').delete().eq('id', id),
  getCategories: async () => { const { data } = await supabase.from('cf_categories').select('*').order('sort_order'); return (data||[]).map(c=>c.name); },
  addCategory: async (name, order) => supabase.from('cf_categories').insert({ name, sort_order:order }),
  updateCategory: async (oldName, newName) => supabase.from('cf_categories').update({ name:newName }).eq('name', oldName),
  deleteCategory: async (name) => supabase.from('cf_categories').delete().eq('name', name),
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

// #5 Status confirmation sheet
function StatusSheet({ item, onSelect, onClose }) {
  const [pending, setPending] = useState(null);
  const statuses = ['pending','prepped','loaded'];

  if (pending) {
    const sc = STATUS_CONFIG[pending];
    return (
      <>
        <div className="sback" onClick={onClose} />
        <div className="sheet">
          <div className="stitle">Confirm Status Change</div>
          <div className="cdlg" style={{ marginBottom:14 }}>
            <div className="ct" style={{ color: sc.color }}>Confirm: {sc.label}</div>
            <div className="cb">Set <strong style={{ color:'var(--tx)' }}>{item.name}</strong> to <strong style={{ color: sc.color }}>{sc.label}</strong>?</div>
            <div className="cbtns">
              <button className="btn bghost bsm" onClick={() => setPending(null)}>Back</button>
              <button className="btn bacc bsm" style={{ borderColor: sc.color, color: sc.color, background: sc.bg }} onClick={() => onSelect(pending)}>Confirm</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="sback" onClick={onClose} />
      <div className="sheet">
        <div className="stitle">Update — {item.name}</div>
        {statuses.map(s => {
          const sc = STATUS_CONFIG[s];
          return (
            <div key={s} className="sopt" onClick={() => setPending(s)}>
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

function ItemModal({ item, onSave, onClose, masterItems, isAdmin }) {
  const categories = useContext(CatContext);
  const isEdit = !!item;
  const UNITS = ['units','pcs','ft','m','boxes','cases','rolls','sets','ea'];
  const [name, setName] = useState(item ? item.name : '');
  const [qty, setQty] = useState(item ? item.qty.split(' ')[0] : '1');
  const [unit, setUnit] = useState(item ? (item.qty.split(' ').slice(1).join(' ') || 'units') : 'units');
  const [cat, setCat] = useState(item ? item.category : categories[0]);
  const [notes, setNotes] = useState(item ? (item.notes || '') : '');
  const [confirmSave, setConfirmSave] = useState(false);

  const handleSaveAttempt = () => {
    if (!name.trim()) return;
    if (isEdit) { setConfirmSave(true); return; }
    doSave();
  };

  const doSave = () => {
    const match = masterItems.find(m => m.name.toLowerCase() === name.toLowerCase());
    const base = isEdit ? { ...item } : { id:uid(), status:'pending', addedBy:null, removedAt:null };
    onSave({ ...base, name:name.trim(), qty:`${qty} ${unit}`, category:match ? match.category : cat, notes });
    setConfirmSave(false);
  };

  if (confirmSave) {
    return (
      <div className="mback ctr">
        <div className="mover" onClick={() => setConfirmSave(false)} />
        <div className="modal">
          <Confirm
            title="Save Changes?"
            body={`Confirm changes to "${item.name}"? This will be logged.`}
            onConfirm={doSave}
            onCancel={() => setConfirmSave(false)}
            confirmLabel="Yes, Save"
          />
        </div>
      </div>
    );
  }

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
        {isAdmin && (
          <div className="field"><label className="flbl">Category</label><select className="fsel" value={cat} onChange={e => setCat(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
        )}
        <div className="field"><label className="flbl">Notes (optional)</label><textarea className="fta" value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
        <div className="macts">
          <button className="btn bghost" onClick={onClose}>Cancel</button>
          <button className="btn bprim" style={{ flex:2 }} onClick={handleSaveAttempt}>{isEdit ? 'Save Changes' : 'Add Item'}</button>
        </div>
      </div>
    </div>
  );
}

// #2 TBD date field helper
function DateTimeFieldWithTBD({ label, value, onChange }) {
  const isTBD = value === 'TBD';
  return (
    <div className="field">
      <label className="flbl">{label}</label>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <input className="fi" type="datetime-local" value={isTBD ? '' : value} onChange={e => onChange(e.target.value)} disabled={isTBD} style={{ flex:1, opacity: isTBD ? .4 : 1 }} />
        <label style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', flexShrink:0 }}>
          <input type="checkbox" checked={isTBD} onChange={e => onChange(e.target.checked ? 'TBD' : '')} style={{ width:14, height:14 }} />
          <span style={{ fontSize:11, color: isTBD ? 'var(--ac)' : 'var(--mu)', fontWeight:700 }}>TBD</span>
        </label>
      </div>
    </div>
  );
}

function EventForm({ onSave, onClose, existing, masterItems, users }) {
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
  const [installCrew, setInstallCrew] = useState(e.installCrew || []);
  const [strikeCrew, setStrikeCrew] = useState(e.strikeCrew || []);
  const [installLead, setInstallLead] = useState(e.installLead || '');
  const [strikeLead, setStrikeLead] = useState(e.strikeLead || '');
  const employees = (users || []).filter(u => u.active && u.role === 'employee');

  const toggleCrew = (list, setList, name, lead, setLead) => {
    const isOn = list.includes(name);
    setList(prev => isOn ? prev.filter(n => n !== name) : [...prev, name]);
    if (isOn && lead === name) setLead('');
  };

  const addItem = () => {
    if (!ni.name.trim()) return;
    const match = masterItems.find(m => m.name.toLowerCase() === ni.name.toLowerCase());
    setItems(prev => [...prev, { id:uid(), name:ni.name.trim(), qty:`${ni.qty} ${ni.unit}`, category:match ? match.category : ni.cat, status:'pending', addedBy:'admin', removedAt:null, notes:'' }]);
    setNi({ name:'', qty:'1', unit:'units', cat:categories[0] });
  };

  const save = (live) => {
    if (!name.trim()) return;
    onSave({ ...e, id:e.id||uid(), name, venue, address, eventStart, eventEnd, installDT, strikeDT, departureDT, brief, installCrew, strikeCrew, installLead, strikeLead, items:[...items, ...(e.items||[]).filter(i=>i.removedAt)], live, archived:e.archived||false, createdAt:e.createdAt||nowISO(), truck:e.truck||'', trailer:e.trailer||'', readyToRoll:e.readyToRoll||false });
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
        <DateTimeFieldWithTBD label="Install Date/Time" value={installDT} onChange={setInstallDT} />
        <DateTimeFieldWithTBD label="Strike Date/Time" value={strikeDT} onChange={setStrikeDT} />
        <DateTimeFieldWithTBD label="Warehouse Departure" value={departureDT} onChange={setDepartureDT} />

        {/* #1 Crew assignment in form */}
        {employees.length > 0 && (
          <div className="frow">
            <div className="field">
              <label className="flbl">Install Crew</label>
              <div style={{ background:'var(--s2)', border:'1px solid var(--br)', borderRadius:'var(--r)', padding:'8px 10px' }}>
                {employees.map(u => (
                  <div key={u.id} style={{ marginBottom:6 }}>
                    <div className="crew-member" onClick={() => toggleCrew(installCrew, setInstallCrew, u.name, installLead, setInstallLead)}>
                      <div className={'crew-cb' + (installCrew.includes(u.name) ? ' on' : '')}>
                        {installCrew.includes(u.name) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span className="crew-name">{u.name}</span>
                    </div>
                    {installCrew.includes(u.name) && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, paddingLeft:22, marginTop:3 }}
                        onClick={() => setInstallLead(installLead === u.name ? '' : u.name)}>
                        <div style={{ width:14, height:14, borderRadius:7, border:`2px solid ${installLead===u.name?'#D97706':'var(--br2)'}`, background:installLead===u.name?'#D97706':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                          {installLead === u.name && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span style={{ fontSize:10, color: installLead===u.name?'#D97706':'var(--mu)', fontWeight:700, letterSpacing:.5 }}>⭐ Lead</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="flbl">Strike Crew</label>
              <div style={{ background:'var(--s2)', border:'1px solid var(--br)', borderRadius:'var(--r)', padding:'8px 10px' }}>
                {employees.map(u => (
                  <div key={u.id} style={{ marginBottom:6 }}>
                    <div className="crew-member" onClick={() => toggleCrew(strikeCrew, setStrikeCrew, u.name, strikeLead, setStrikeLead)}>
                      <div className={'crew-cb' + (strikeCrew.includes(u.name) ? ' on' : '')}>
                        {strikeCrew.includes(u.name) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span className="crew-name">{u.name}</span>
                    </div>
                    {strikeCrew.includes(u.name) && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, paddingLeft:22, marginTop:3 }}
                        onClick={() => setStrikeLead(strikeLead === u.name ? '' : u.name)}>
                        <div style={{ width:14, height:14, borderRadius:7, border:`2px solid ${strikeLead===u.name?'#D97706':'var(--br2)'}`, background:strikeLead===u.name?'#D97706':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                          {strikeLead === u.name && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span style={{ fontSize:10, color: strikeLead===u.name?'#D97706':'var(--mu)', fontWeight:700, letterSpacing:.5 }}>⭐ Lead</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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

// #12 Export helpers
function generatePlainText(event) {
  const lines = [];
  lines.push('CREWFLOW — EVENT SNAPSHOT');
  lines.push('⚠ SNAPSHOT ONLY — This list may be outdated. Always confirm against the live CrewFlow app before use.');
  lines.push('');
  lines.push(`Event: ${event.name}`);
  if (event.venue) lines.push(`Venue: ${event.venue}`);
  if (event.address) lines.push(`Address: ${event.address}`);
  lines.push(`Event Dates: ${fmt(event.eventStart)} – ${fmt(event.eventEnd)}`);
  lines.push(`Install: ${fmtDT(event.installDT)}`);
  lines.push(`Strike: ${fmtDT(event.strikeDT)}`);
  lines.push(`WH Departure: ${fmtDT(event.departureDT)}`);
  if (event.truck || event.trailer) lines.push(`Vehicle: ${event.truck||'—'} / ${event.trailer||'—'}`);
  if (event.installCrew?.length) lines.push(`Install Crew: ${event.installCrew.join(', ')}`);
  if (event.strikeCrew?.length) lines.push(`Strike Crew: ${event.strikeCrew.join(', ')}`);
  if (event.brief) { lines.push(''); lines.push(`Brief: ${event.brief}`); }
  lines.push('');
  lines.push('GEAR LIST:');
  const active = (event.items || []).filter(i => !i.removedAt);
  active.forEach((item, idx) => {
    lines.push(`${idx+1}. [${(item.status||'pending').toUpperCase()}] ${item.name} — ${item.qty} [${item.category}]${item.notes ? ' — '+item.notes : ''}`);
  });
  lines.push('');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  return lines.join('\n');
}

function ExportModal({ event, onClose }) {
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    const text = generatePlainText(event);
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const exportPDF = () => {
    const active = (event.items || []).filter(i => !i.removedAt);
    const watermark = 'SNAPSHOT ONLY — Verify you are referencing the most current version in the CrewFlow app before use';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>CrewFlow — ${event.name}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:30px;color:#111;max-width:700px;margin:0 auto;background:#fff}
      h1{font-size:26px;margin-bottom:4px}
      .sub{color:#666;font-size:13px;margin-bottom:16px}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
      .chip{background:#f4f4f4;border-radius:6px;padding:8px 10px}
      .chip-lbl{font-size:9px;font-weight:700;letter-spacing:1.5px;color:#888;text-transform:uppercase}
      .chip-val{font-size:13px;font-weight:600;margin-top:2px}
      .brief{background:#fffbe6;border-left:3px solid #F59E0B;padding:10px 14px;margin-bottom:16px;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th{background:#111;color:#fff;padding:8px 10px;font-size:11px;letter-spacing:1px;text-transform:uppercase;text-align:left}
      td{padding:8px 10px;border-bottom:1px solid #eee;font-size:13px}
      .status{font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;text-transform:uppercase}
      .pending{background:#ffe5e5;color:#cc0000}
      .prepped{background:#fff1e5;color:#c05000}
      .loaded{background:#e5f7f0;color:#087050}
      .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:18px;font-weight:900;color:rgba(0,0,0,0.08);text-align:center;white-space:nowrap;pointer-events:none;z-index:1000;width:100%;letter-spacing:2px}
      .crew{font-size:12px;color:#444;margin-bottom:4px}
    </style></head><body>
    <div class="watermark">${watermark}</div>
    <h1>${event.name}</h1>
    <div class="sub">${event.venue || ''}${event.venue && event.address ? ' — ' : ''}${event.address || ''}</div>
    <div class="meta">
      <div class="chip"><div class="chip-lbl">Event Dates</div><div class="chip-val">${fmt(event.eventStart)} – ${fmt(event.eventEnd)}</div></div>
      <div class="chip"><div class="chip-lbl">Install</div><div class="chip-val">${fmtDT(event.installDT)}</div></div>
      <div class="chip"><div class="chip-lbl">Strike</div><div class="chip-val">${fmtDT(event.strikeDT)}</div></div>
      <div class="chip"><div class="chip-lbl">WH Departure</div><div class="chip-val">${fmtDT(event.departureDT)}</div></div>
      ${event.truck || event.trailer ? `<div class="chip"><div class="chip-lbl">Vehicle</div><div class="chip-val">${event.truck||'—'} / ${event.trailer||'—'}</div></div>` : ''}
    </div>
    ${event.installCrew?.length ? `<div class="crew"><strong>Install Crew:</strong> ${event.installCrew.join(', ')}</div>` : ''}
    ${event.strikeCrew?.length ? `<div class="crew"><strong>Strike Crew:</strong> ${event.strikeCrew.join(', ')}</div>` : ''}
    ${event.brief ? `<div class="brief"><strong>Admin Brief:</strong> ${event.brief}</div>` : ''}
    <table><thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Category</th><th>Status</th></tr></thead><tbody>
    ${active.map((item,i) => `<tr><td>${i+1}</td><td>${item.name}${item.notes?'<br><small style="color:#888">'+item.notes+'</small>':''}</td><td>${item.qty}</td><td>${item.category}</td><td><span class="status ${item.status||'pending'}">${(item.status||'pending').toUpperCase()}</span></td></tr>`).join('')}
    </tbody></table>
    <p style="margin-top:20px;font-size:11px;color:#999">Generated: ${new Date().toLocaleString()} — ⚠ ${watermark}</p>
    </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="mback ctr">
      <div className="mover" onClick={onClose} />
      <div className="modal">
        <div className="mtitle">📤 Export / Hard Copy</div>
        <p style={{ fontSize:13, color:'var(--mu)', marginBottom:20, lineHeight:1.5 }}>All exports include a watermark reminding crew to verify against the live app.</p>
        <button className="btn bprim" style={{ marginBottom:10 }} onClick={exportPDF}>📄 Open Print / PDF View</button>
        <button className="btn bghost" style={{ width:'100%', marginBottom:10 }} onClick={copyText}>
          {copied ? '✓ Copied to Clipboard!' : '📋 Copy as Plain Text'}
        </button>
        <button className="btn bghost" style={{ width:'100%' }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function EventDetail({ event, user, onBack, onUpdate, masterItems, fleet, users }) {
  const categories = useContext(CatContext);
  const [statusTarget, setStatusTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showTruck, setShowTruck] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showRTRConfirm, setShowRTRConfirm] = useState(false);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false); // #6 collapsed by default
  const [infoOpen, setInfoOpen] = useState(true); // #8 open by default
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const isAdmin = user.role === 'admin';
  const items = event.items || [];
  const active = items.filter(i => !i.removedAt);
  const removed = items.filter(i => i.removedAt);
  const allLoaded = active.length > 0 && active.every(i => i.status === 'loaded');
  const pct = active.length ? Math.round((active.filter(i => i.status === 'loaded').length / active.length) * 100) : 0;
  const pt = (msg, type) => setToast({ msg, type });
  const isRTR = event.readyToRoll;
  // Employee is locked out of editing unless they unlock
  const isLocked = isRTR && !isAdmin;

  const handleArchive = async (reason) => {
    const updated = { ...event, archived:true, archivedAt:nowISO(), archivedReason:reason };
    await db.upsertEvent(updated);
    onUpdate(updated);
    if (reason === 'auto') pt('Event auto-archived ✓', 'ok');
  };

  const handleStatus = async (status) => {
    const item = statusTarget;
    setSaving(true);
    const updatedItem = { ...item, status, [`${status}By`]:user.name, [`${status}At`]:nowISO() };
    await db.upsertItem(updatedItem, event.id);
    const logEntry = { id:uid(), action:'status_change', detail:`"${item.name}": ${item.status} → ${status}`, by:user.name, userId:user.id };
    await db.addActivity(event.id, event.name, logEntry);
    onUpdate({ ...event, items:items.map(i => i.id === item.id ? updatedItem : i), activityLog:[...(event.activityLog||[]), { ...logEntry, at:nowISO() }] });
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

  // #11 Ready to Roll
  const handleReadyToRoll = async () => {
    const updated = { ...event, readyToRoll:true };
    await db.upsertEvent(updated);
    const logEntry = { id:uid(), action:'ready_to_roll', detail:'Marked as READY TO ROLL', by:user.name, userId:user.id };
    await db.addActivity(event.id, event.name, logEntry);
    onUpdate({ ...updated, activityLog:[...(event.activityLog||[]), { ...logEntry, at:nowISO() }] });
    setShowRTRConfirm(false);
    pt('🟢 Event marked READY TO ROLL!', 'ok');
  };

  const handleUnlock = async () => {
    const updated = { ...event, readyToRoll:false };
    await db.upsertEvent(updated);
    const logEntry = { id:uid(), action:'rtr_unlocked', detail:'Ready to Roll status removed — event reopened for editing', by:user.name, userId:user.id };
    await db.addActivity(event.id, event.name, logEntry);
    onUpdate({ ...updated, activityLog:[...(event.activityLog||[]), { ...logEntry, at:nowISO() }] });
    setShowUnlockConfirm(false);
    pt('Event unlocked for editing', 'ok');
  };

  const byCategory = categories.reduce((acc, cat) => {
    const ci = active.filter(i => i.category === cat);
    if (ci.length) acc[cat] = ci;
    return acc;
  }, {});

  const canEdit = !isLocked && !event.archived;

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      {saving && <div style={{ position:'fixed', top:52, left:0, right:0, height:2, background:'var(--ac)', zIndex:200 }} />}

      <div className="backrow" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        <span>All Events</span>
      </div>

      {/* #8 Collapsible event info — name always visible */}
      <div className="dh">
        <div className="dh-always">
          <div style={{ flex:1 }}>
            <div className="dname">{event.name}</div>
            {!infoOpen && <div className="dsub" style={{ marginTop:4 }}>{event.venue}{event.venue && event.address ? ' — ' : ''}{event.address}</div>}
          </div>
          <div style={{ display:'flex', alignItems:'flex-start', gap:6, flexShrink:0 }}>
            <div className="pills" style={{ marginBottom:6 }}>
              <span className={'pill ' + (event.archived ? 'parc' : isRTR ? 'prtr' : event.live ? 'plive' : 'pdraft')}>
                {event.archived ? 'Archived' : isRTR ? '✓ Ready to Roll' : event.live ? 'Live' : 'Draft'}
              </span>
              {isAdmin && !event.archived && <button className="btn bacc bsm" onClick={() => setShowEditEvent(true)}>Edit</button>}
              {isAdmin && !event.archived && <button className="btn bghost bsm" onClick={() => handleArchive('manual')}>Archive</button>}
            </div>
          </div>
        </div>
        <div style={{ padding:'4px 16px 8px', display:'flex', justifyContent:'flex-end' }}>
          <button className="dh-collapse-btn" onClick={() => setInfoOpen(o => !o)}>
            {infoOpen ? '▲ collapse' : '▼ expand'}
          </button>
        </div>

        {infoOpen && (
          <div className="dh-body">
            {event.venue && <div className="dsub">{event.venue}</div>}
            {event.address && <div className="dsub">{event.address}</div>}
            <div className="dgrid">
              <div className="ichip"><div className="icl">Event Dates</div><div className="icv">{fmt(event.eventStart)} – {fmt(event.eventEnd)}</div></div>
              <div className="ichip"><div className="icl">Install</div><div className="icv">{fmtDT(event.installDT)}</div></div>
              <div className="ichip"><div className="icl">Strike</div><div className="icv">{fmtDT(event.strikeDT)}</div></div>
              <div className="ichip"><div className="icl">WH Departure</div><div className="icv">{fmtDT(event.departureDT)}</div></div>
            </div>

            {/* Vehicle */}
            <div className="trchip" onClick={() => canEdit && setShowTruck(true)}>
              <span style={{ fontSize:18 }}>🚛</span>
              <div style={{ flex:1 }}>
                <div className="icl">Truck / Trailer</div>
                <div className="icv">{event.truck || event.trailer ? `${event.truck||'—'} · ${event.trailer||'—'}` : <span style={{ color:'var(--mu)', fontSize:12 }}>Tap to assign vehicle</span>}</div>
              </div>
              {canEdit && <span style={{ color:'var(--mu)', fontSize:18 }}>›</span>}
            </div>

            {/* #1 Crew display */}
            <div className="crew-section">
              <div className="crew-block">
                <div className="crew-lbl">Install Crew</div>
                {(event.installCrew||[]).length === 0
                  ? <div style={{ fontSize:11, color:'var(--mu)' }}>Not assigned</div>
                  : (event.installCrew||[]).map(n => (
                    <div key={n} className="crew-name-assigned" style={{ display:'flex', alignItems:'center', gap:4, marginBottom:3 }}>
                      👤 {n}
                      {event.installLead === n && <span style={{ fontSize:9, fontWeight:800, color:'#D97706', background:'rgba(217,119,6,.1)', border:'1px solid #D97706', borderRadius:10, padding:'1px 6px', letterSpacing:.5 }}>⭐ LEAD</span>}
                    </div>
                  ))}
              </div>
              <div className="crew-block">
                <div className="crew-lbl">Strike Crew</div>
                {(event.strikeCrew||[]).length === 0
                  ? <div style={{ fontSize:11, color:'var(--mu)' }}>Not assigned</div>
                  : (event.strikeCrew||[]).map(n => (
                    <div key={n} className="crew-name-assigned" style={{ display:'flex', alignItems:'center', gap:4, marginBottom:3 }}>
                      👤 {n}
                      {event.strikeLead === n && <span style={{ fontSize:9, fontWeight:800, color:'#D97706', background:'rgba(217,119,6,.1)', border:'1px solid #D97706', borderRadius:10, padding:'1px 6px', letterSpacing:.5 }}>⭐ LEAD</span>}
                    </div>
                  ))}
              </div>
            </div>

            {/* #8 Brief inside event info */}
            {event.brief && (
              <div className="brief-inline">
                <div className="brieft">📋 Admin Brief</div>
                <div className="briefb">{event.brief}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="pblock">
        <div className="phd"><span>Progress</span><span style={{ color: isRTR ? 'var(--ok)' : 'var(--ac)' }}>{pct}%</span></div>
        <div className="ptrack"><div className={'pfill' + (isRTR ? ' rtr' : '')} style={{ width:`${pct}%` }} /></div>
        {isRTR ? (
          <div style={{ marginTop:8, textAlign:'center', color:'var(--ok)', fontFamily:'var(--fh)', fontSize:15, fontWeight:900, letterSpacing:2 }}>✓ READY TO ROLL</div>
        ) : (
          <div className="spills">
            {Object.entries(STATUS_CONFIG).map(([k,v]) => (
              <span key={k} className="spill" style={{ color:v.color, borderColor:`${v.color}44`, background:v.bg }}>{active.filter(i=>i.status===k).length} {v.label}</span>
            ))}
          </div>
        )}
      </div>

      {/* #11 Ready to Roll / unlock */}
      {!event.archived && isRTR && (
        <div className="rtr-banner">
          <span style={{ fontSize:22 }}>✅</span>
          <div style={{ flex:1 }}>
            <div className="rtr-banner-text">Ready to Roll</div>
            <div style={{ fontSize:11, color:'var(--ok)', marginTop:2 }}>All items loaded & verified</div>
          </div>
          <button className="edit-event-btn" style={{ margin:0 }} onClick={() => setShowUnlockConfirm(true)}>Edit Event</button>
        </div>
      )}
      {!event.archived && !isRTR && (
        allLoaded ? (
          <button className="rtr-btn" onClick={() => setShowRTRConfirm(true)}>
            <span>🟢</span> Mark as Ready to Roll
          </button>
        ) : (
          <div className="rtr-locked">
            <span>🔒</span> Ready to Roll — {active.filter(i=>i.status!=='loaded').length} item{active.filter(i=>i.status!=='loaded').length !== 1 ? 's' : ''} not yet loaded
          </div>
        )
      )}

      {/* Gear list */}
      {canEdit && (
        <div className="shd" style={{ marginBottom:14, marginTop:8 }}>
          <span className="slbl">Gear List ({active.length})</span>
          <button className="btn" style={{ background:'var(--bl)', color:'#fff', padding:'8px 16px', fontSize:13, fontWeight:800, borderRadius:'var(--r)', letterSpacing:.5 }} onClick={() => setShowAdd(true)}>+ Add Item</button>
        </div>
      )}
      {isRTR && !isAdmin && (
        <div className="shd">
          <span className="slbl">Gear List ({active.length})</span>
          <span style={{ fontSize:11, color:'var(--ok)', fontWeight:700 }}>✓ Verified</span>
        </div>
      )}
      {!canEdit && !isRTR && event.archived && (
        <div className="shd"><span className="slbl">Gear List ({active.length})</span></div>
      )}

      {Object.keys(byCategory).length === 0 && <div className="empty"><div className="eico">📦</div><div className="etxt">No items yet.</div></div>}

      {Object.entries(byCategory).map(([cat, catItems]) => (
        <div key={cat} className="catblk">
          <div className="catlbl">{cat}</div>
          {catItems.map(item => {
            const sc = STATUS_CONFIG[item.status || 'pending'];
            const isLoaded = item.status === 'loaded';
            return (
              <div key={item.id} className="irow">
                {/* #4 Bigger bolder checkmark for loaded */}
                <div className={'ichk ' + (item.status || 'pending')}
                  onClick={() => canEdit && !isLocked && setStatusTarget(item)}
                  style={(event.archived || isRTR) ? { opacity: isLoaded ? 1 : .7, cursor:'default' } : { cursor:'pointer' }}>
                  {item.status !== 'pending' && (
                    <svg
                      width={isLoaded ? "18" : "13"}
                      height={isLoaded ? "18" : "13"}
                      viewBox="0 0 24 24" fill="none" stroke={sc.color}
                      strokeWidth={isLoaded ? "4" : "3"}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="imain">
                  <div className="iname">{item.name}</div>
                  <div className="iqty">Qty: {item.qty}{item.notes ? ` · ${item.notes}` : ''}</div>
                  {item.addedBy && item.addedBy !== 'admin' && <div className="iby">Added by {item.addedBy}</div>}
                  {/* #7 Lighter timestamp text */}
                  {item[`${item.status}By`] && item.status !== 'pending' && (
                    <div className="iby">{sc.label} by {item[`${item.status}By`]} · {fmtDT(item[`${item.status}At`])}</div>
                  )}
                </div>
                <div className="iright">
                  <span className="sbadge" style={{ color:sc.color, borderColor:`${sc.color}44`, background:sc.bg }}>{sc.label}</span>
                  {canEdit && !isLocked && (
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

      {/* #12 Export buttons */}
      <div className="export-row">
        <button className="export-btn" onClick={() => setShowExport(true)}>
          <span className="export-ico">📤</span>Export
        </button>
      </div>

      {/* #6 Collapsible audit log */}
      {(removed.length > 0 || (event.auditLog||[]).length > 0) && (
        <div className="auditsec">
          <div className="audit-hdr" onClick={() => setAuditOpen(o => !o)}>
            <div className="auditt">⚠ Audit Log <span style={{ fontSize:10, color:'var(--mu)' }}>({removed.length + (event.auditLog||[]).length} entries)</span></div>
            <span style={{ fontSize:11, color:'var(--mu)', fontWeight:700 }}>{auditOpen ? '▲' : '▼'}</span>
          </div>
          {auditOpen && (
            <div className="audit-body">
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
        </div>
      )}

      <div className="spacer" />

      {/* Modals */}
      {removeTarget && (
        <div className="mback ctr"><div className="mover" onClick={() => setRemoveTarget(null)} />
          <div className="modal"><Confirm title="Remove Item?" body={`Remove "${removeTarget.name}" (${removeTarget.qty})? This will be logged.`} danger onConfirm={handleRemove} onCancel={() => setRemoveTarget(null)} confirmLabel="Yes, Remove" /></div>
        </div>
      )}

      {/* #11 RTR confirmation */}
      {showRTRConfirm && (
        <div className="mback ctr"><div className="mover" onClick={() => setShowRTRConfirm(false)} />
          <div className="modal">
            <div className="mtitle" style={{ color:'var(--ok)' }}>🟢 Ready to Roll?</div>
            <div style={{ background:'var(--ok2)', border:'2px solid var(--ok)', borderRadius:'var(--rl)', padding:'16px', marginBottom:16 }}>
              <div style={{ fontFamily:'var(--fh)', fontSize:15, fontWeight:800, color:'var(--ok)', marginBottom:6, letterSpacing:1 }}>⚠ PHYSICAL VERIFICATION REQUIRED</div>
              <div style={{ fontSize:13, color:'var(--tx)', lineHeight:1.6 }}>
                Before confirming, physically verify that <strong>every item on the list is on the truck</strong>.<br /><br />
                Once marked Ready to Roll, the checklist will be locked. Make sure everything is loaded and accounted for.
              </div>
            </div>
            <div className="macts">
              <button className="btn bghost" onClick={() => setShowRTRConfirm(false)}>Go Back & Check</button>
              <button className="btn bprim" style={{ flex:2, background:'var(--ok)' }} onClick={handleReadyToRoll}>✓ Confirm — We're Ready</button>
            </div>
          </div>
        </div>
      )}

      {/* #11 Unlock / edit confirmation */}
      {showUnlockConfirm && (
        <div className="mback ctr"><div className="mover" onClick={() => setShowUnlockConfirm(false)} />
          <div className="modal">
            <Confirm
              title="Edit This Event?"
              body="Editing this event will remove the Ready to Roll status. You will need to re-verify and resubmit once your changes are complete."
              danger
              onConfirm={handleUnlock}
              onCancel={() => setShowUnlockConfirm(false)}
              confirmLabel="Yes, Unlock & Edit"
            />
          </div>
        </div>
      )}

      {statusTarget && <StatusSheet item={statusTarget} onSelect={handleStatus} onClose={() => setStatusTarget(null)} />}
      {showAdd && <ItemModal masterItems={masterItems} onSave={handleAddItem} onClose={() => setShowAdd(false)} isAdmin={isAdmin} />}
      {editTarget && <ItemModal item={editTarget} masterItems={masterItems} onSave={handleEditItem} onClose={() => setEditTarget(null)} isAdmin={isAdmin} />}
      {showTruck && <TruckModal event={event} onSave={handleTruck} onClose={() => setShowTruck(false)} fleet={fleet} />}
      {showExport && <ExportModal event={event} onClose={() => setShowExport(false)} />}
      {showEditEvent && <EventForm existing={event} masterItems={masterItems} users={users} onSave={async ev => { await db.upsertEvent(ev); for (const item of ev.items) { await db.upsertItem(item, ev.id); } onUpdate(ev); setShowEditEvent(false); pt('Event updated!', 'ok'); }} onClose={() => setShowEditEvent(false)} />}
    </div>
  );
}

function EventList({ events, user, onSelect, onCreateNew }) {
  const [tab, setTab] = useState('active');
  const isAdmin = user.role === 'admin';
  const live = events.filter(e => !e.archived && (isAdmin || e.live));
  const archived = events.filter(e => e.archived);

  // #10 Sort by event start date soonest first
  const sortByDate = (arr) => [...arr].sort((a, b) => {
    if (!a.eventStart) return 1;
    if (!b.eventStart) return -1;
    return new Date(a.eventStart) - new Date(b.eventStart);
  });

  const visible = tab === 'active' ? sortByDate(live) : sortByDate(archived);

  return (
    <div>
      <div className="tabrow">
        <button className={'btn bsm ' + (tab==='active'?'bacc':'bghost')} onClick={() => setTab('active')}>Active ({live.length})</button>
        <button className={'btn bsm ' + (tab==='archived'?'bacc':'bghost')} onClick={() => setTab('archived')}>Archived ({archived.length})</button>
      </div>
      {visible.length === 0 && <div className="empty"><div className="eico">{tab==='active'?'🎪':'📁'}</div><div className="etxt">{tab==='active'?(isAdmin?'No events. Create one!':'No live events right now.'):'No archived events.'}</div></div>}
      {visible.map(ev => {
        const active = (ev.items||[]).filter(i => !i.removedAt);
        const done = active.filter(i => i.status==='loaded').length;
        const pct = active.length ? Math.round((done/active.length)*100) : 0;
        const isRTR = ev.readyToRoll;
        return (
          <div key={ev.id} className={'ecard' + (ev.archived ? ' arc' : '') + (isRTR ? ' rtr' : '')} onClick={() => onSelect(ev)}>
            <div className="ehd">
              <div><div className="ename">{ev.name}</div><div className="evenue">{ev.venue||ev.address||'—'}</div></div>
              <div className="pills">
                <span className={'pill ' + (ev.archived ? 'parc' : isRTR ? 'prtr' : ev.live ? 'plive' : 'pdraft')}>
                  {ev.archived ? 'Archived' : isRTR ? '✓ Ready to Roll' : ev.live ? 'Live' : 'Draft'}
                </span>
              </div>
            </div>
            <div className="emeta">
              <div className="mchip"><div className="ml">Event Dates</div><div className="mv">{fmt(ev.eventStart)} – {fmt(ev.eventEnd)}</div></div>
              <div className="mchip"><div className="ml">Install</div><div className="mv">{fmtDT(ev.installDT)}</div></div>
              {ev.truck && <div className="mchip"><div className="ml">Truck</div><div className="mv">{ev.truck}</div></div>}
              {ev.trailer && <div className="mchip"><div className="ml">Trailer</div><div className="mv">{ev.trailer}</div></div>}
            </div>
            <div className="eprog">
              <div className="ptrack"><div className={'pfill' + (isRTR ? ' rtr' : '')} style={{ width:`${pct}%` }} /></div>
              <div className={'plbls' + (isRTR ? ' rtr' : '')}>
                <span>{active.length} items</span>
                <span>{isRTR ? '✓ READY TO ROLL' : `${pct}% complete`}</span>
              </div>
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
  const [filterType, setFilterType] = useState('all'); // 'all' | empId | projectName
  const [filterMode, setFilterMode] = useState('employee'); // 'employee' | 'project'
  const [loading, setLoading] = useState(true);
  useEffect(() => { db.getAllActivity().then(data => { setLogs(data); setLoading(false); }); }, []);

  const resolveUser = (id) => users.find(u => u.id === id);
  const empIds = [...new Set(logs.map(l => l.user_id).filter(Boolean))];
  const projects = [...new Set(logs.map(l => l.event_name).filter(Boolean))];

  const filtered = filterType === 'all'
    ? logs
    : filterMode === 'employee'
      ? logs.filter(l => l.user_id === filterType)
      : logs.filter(l => l.event_name === filterType);

  // Contribution % per employee (based on status_change actions)
  const statusLogs = logs.filter(l => l.action === 'status_change');
  const contribMap = {};
  statusLogs.forEach(l => {
    if (l.user_id) contribMap[l.user_id] = (contribMap[l.user_id] || 0) + 1;
  });
  const totalActions = Object.values(contribMap).reduce((a,b) => a+b, 0);

  if (loading) return <div className="empty"><div className="etxt">Loading…</div></div>;
  return (
    <div>
      {/* Mode toggle */}
      <div className="tabrow" style={{ marginBottom:8 }}>
        <button className={'btn bsm '+(filterMode==='employee'?'bacc':'bghost')} onClick={() => { setFilterMode('employee'); setFilterType('all'); }}>By Employee</button>
        <button className={'btn bsm '+(filterMode==='project'?'bacc':'bghost')} onClick={() => { setFilterMode('project'); setFilterType('all'); }}>By Project</button>
      </div>

      {/* Filter buttons */}
      <div className="tabrow">
        <button className={'btn bsm '+(filterType==='all'?'bacc':'bghost')} onClick={() => setFilterType('all')}>All</button>
        {filterMode === 'employee'
          ? empIds.map(id => { const u = resolveUser(id); return <button key={id} className={'btn bsm '+(filterType===id?'bacc':'bghost')} onClick={() => setFilterType(id)}>{u?u.name:id}</button>; })
          : projects.map(p => <button key={p} className={'btn bsm '+(filterType===p?'bacc':'bghost')} onClick={() => setFilterType(p)} style={{ maxWidth:120, overflow:'hidden', textOverflow:'ellipsis' }}>{p}</button>)
        }
      </div>

      {/* Contribution stats — shown when filtering by employee or all */}
      {filterMode === 'employee' && totalActions > 0 && (
        <div style={{ background:'var(--sf)', border:'1px solid var(--br)', borderRadius:'var(--rl)', padding:'12px 14px', marginBottom:12 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:'var(--mu)', textTransform:'uppercase', marginBottom:10 }}>Load Contributions</div>
          {empIds.map(id => {
            const u = resolveUser(id);
            const count = contribMap[id] || 0;
            const pct = totalActions > 0 ? Math.round((count / totalActions) * 100) : 0;
            return (
              <div key={id} style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>{u?u.name:id}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--bl)' }}>{pct}% <span style={{ color:'var(--mu)', fontWeight:400 }}>({count} actions)</span></span>
                </div>
                <div style={{ background:'var(--s2)', borderRadius:3, height:6, overflow:'hidden' }}>
                  <div style={{ background:'var(--bl)', width:`${pct}%`, height:'100%', borderRadius:3, transition:'width .4s' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

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
      <div className="infobanner">Trucks and trailers here appear as dropdown options when assigning vehicles to events.</div>
      {renderSection('Trucks', trucks, 'truck', '🚛')}
      {renderSection('Trailers', trailers, 'trailer', '🚚')}
      {showAdd && (<div className="mback ctr"><div className="mover" onClick={() => setShowAdd(null)} /><div className="modal"><div className="mtitle">Add {showAdd==='truck'?'Truck':'Trailer'}</div><div className="field"><label className="flbl">Name / ID *</label><input className="fi" value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} autoFocus /></div><div className="field"><label className="flbl">Make / Model</label><input className="fi" value={newItem.detail} onChange={e=>setNewItem(p=>({...p,detail:e.target.value}))} /></div><div className="macts"><button className="btn bghost" onClick={() => setShowAdd(null)}>Cancel</button><button className="btn bprim" style={{ flex:2 }} onClick={handleAdd}>Add</button></div></div></div>)}
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
      <div className="infobanner">Categories organize gear items. Renaming won't retroactively update existing items.</div>
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
      {confirmDel !== null && (<div className="mback ctr"><div className="mover" onClick={() => setConfirmDel(null)} /><div className="modal"><Confirm title="Remove Category?" body={`Remove "${categories[confirmDel]}"?`} danger onConfirm={() => handleDelete(confirmDel)} onCancel={() => setConfirmDel(null)} confirmLabel="Remove" /></div></div>)}
    </div>
  );
}

// #9 Login — CREWFLOW branding
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
      <img src="/CrewFlowLogo.png" alt="CrewFlow" style={{ width:'100%', maxWidth:320, marginBottom:24, objectFit:"contain" }} />
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
      <div className="loading"><img src="/CrewFlowLogo.png" alt="CrewFlow" style={{ height:48, objectFit:"contain" }} /></div>
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
          <div className="brand"><img src="/CrewFlowLogo.png" alt="CrewFlow" style={{ height:32, objectFit:"contain" }} /></div>
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
            <EventDetail event={selectedEvent} user={user} onBack={() => setSelectedEvent(null)} onUpdate={handleUpdateEvent} masterItems={masterItems} fleet={fleet} users={users} />
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
        {showCreate && <EventForm masterItems={masterItems} users={users} onSave={handleCreateEvent} onClose={() => setShowCreate(false)} />}
      </div>
    </CatContext.Provider>
  );
}
