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
.flbl{font-size:11px;font-weight:700;letter-spacing:2px;color:var(--mu);text-transform:uppercase;display:block;margin-bottom:8px}
.fi,.fsel,.fta{width:100%;background:var(--s2);border:1px solid var(--br);border-radius:var(--r);padding:13px 15px;color:var(--tx);font-size:16px;outline:none;transition:border-color .18s;appearance:none}
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
.l-card{background:var(--sf);border:1px solid var(--br);border-radius:var(--rx);padding:28px;width:100%;max-width:420px}
.pdots{display:flex;gap:10px;margin-bottom:18px}
.pdot{flex:1;height:58px;background:var(--s2);border:1px solid var(--br);border-radius:var(--r);display:flex;align-items:center;justify-content:center;font-size:22px;transition:.14s}
.pdot.on{border-color:var(--bl);color:var(--bl)}
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pkey{background:var(--s2);border:1px solid var(--br);border-radius:var(--r);height:64px;font-family:var(--fh);font-size:26px;font-weight:700;color:var(--tx);cursor:pointer;transition:.1s;display:flex;align-items:center;justify-content:center}
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
.pblock{background:var(--sf);border:1px solid var(--br);border-radius:var(--rl);padding:14px 16px;margin-bottom:16px}
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
.catblk{margin-bottom:22px}
/* #7 lighter category labels */
.catlbl{font-family:var(--fh);font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--mu);border-bottom:1px solid var(--br);padding-bottom:5px;margin-bottom:7px}
.irow{background:var(--sf);border:1px solid var(--br);border-radius:var(--r);padding:13px 13px;margin-bottom:8px;display:flex;align-items:center;gap:10px}
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


/* ─── NOTES ───────────────────────────────────────────────────────────────── */
.notes-section{background:var(--sf);border:1px solid var(--br);border-radius:var(--rl);padding:14px 16px;margin-top:18px}
.notes-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.notes-lbl{font-family:var(--fh);font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--mu)}
.note-item{background:var(--s2);border:1px solid var(--br);border-left:3px solid var(--wn);border-radius:var(--r);padding:10px 12px;margin-bottom:8px}
.note-body{font-size:14px;color:var(--tx);line-height:1.5;white-space:pre-wrap}
.note-meta{font-size:10px;color:var(--mu);margin-top:5px;font-style:italic}

/* ─── TASK MODULE ─────────────────────────────────────────────────────────── */
.tcard{background:var(--sf);border:1px solid var(--br);border-radius:var(--rl);margin-bottom:10px;overflow:hidden;transition:.15s;cursor:pointer}
.tcard:active{transform:scale(.99);border-color:var(--bl)}
.tcard.arc{opacity:.52}
.tcard.atc{border-color:var(--ok);border-width:2px;box-shadow:0 0 0 3px rgba(5,150,105,.15),0 4px 20px rgba(5,150,105,.2)}
.tcard.nodate{border-left:4px solid var(--wn)}
.tcard.overdue{border-left:4px solid var(--dn)}
.thd{padding:14px 14px 8px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.ttitle{font-family:var(--fh);font-size:22px;font-weight:900;line-height:1.1;color:var(--tx)}
.ttype-badge{font-size:9px;font-weight:800;letter-spacing:1.5px;padding:3px 8px;border-radius:20px;text-transform:uppercase;border:1px solid;white-space:nowrap;flex-shrink:0}
.ttype-daily{color:var(--bl);border-color:rgba(37,99,235,.4);background:var(--bl2)}
.ttype-weekly{color:#7C3AED;border-color:rgba(124,58,237,.4);background:rgba(124,58,237,.1)}
.ttype-nodate{color:var(--wn);border-color:rgba(217,119,6,.4);background:var(--wn2)}
.tmeta{padding:0 14px 8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.tmchip{background:var(--s2);border-radius:4px;padding:4px 8px;font-size:11px;color:var(--mu);font-weight:600}
.tprog{padding:0 14px 12px}
.tatc-banner{background:rgba(5,150,105,.08);border:2px solid var(--ok);border-radius:var(--rl);padding:12px 14px;margin-bottom:11px;display:flex;align-items:center;gap:10px}
.tatc-btn{width:100%;background:linear-gradient(135deg,rgba(5,150,105,.12),rgba(5,150,105,.06));border:2px solid var(--ok);border-radius:var(--rl);padding:16px;color:var(--ok);font-family:var(--fh);font-size:18px;font-weight:900;letter-spacing:2px;text-transform:uppercase;cursor:pointer;margin-bottom:18px;display:flex;align-items:center;justify-content:center;gap:8px}
.tatc-locked{width:100%;background:rgba(5,150,105,.04);border:2px dashed rgba(5,150,105,.25);border-radius:var(--rl);padding:13px;color:rgba(5,150,105,.45);font-family:var(--fh);font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:18px;display:flex;align-items:center;justify-content:center;gap:7px;cursor:default}
.titem{background:var(--sf);border:1px solid var(--br);border-radius:var(--r);padding:14px 13px;margin-bottom:10px;display:flex;align-items:flex-start;gap:10px}
.titem.done{opacity:.7;background:var(--s2)}
.titem.needs{border-left:3px solid var(--dn)}
.tchk{width:26px;height:26px;border-radius:50%;border:2px solid var(--br2);background:var(--s2);flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.18s;margin-top:1px}
.tchk.completed{border-color:var(--ok);background:var(--ok2)}
.tchk.needs_support{border-color:var(--dn);background:var(--dn2)}
.tmain{flex:1;min-width:0}
.tname{font-size:16px;font-weight:600;color:var(--tx);line-height:1.3;word-break:break-word;white-space:normal}
.tnotes{font-size:12px;color:var(--mu);margin-top:3px;line-height:1.4}
.tassign{font-size:11px;color:var(--bl);margin-top:3px;font-weight:600}
.tcarryover{font-size:10px;color:var(--dn);margin-top:4px;font-weight:600;line-height:1.5}
.tright{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0}
.tbadge{font-size:8px;font-weight:800;letter-spacing:.8px;padding:3px 8px;border-radius:20px;text-transform:uppercase;white-space:nowrap;border:1px solid}
.msq-item{background:var(--sf);border:1px solid var(--dn);border-left:4px solid var(--dn);border-radius:var(--r);padding:11px 13px;margin-bottom:7px}
.msq-title{font-size:13px;font-weight:700;color:var(--dn)}
.msq-meta{font-size:11px;color:var(--mu);margin-top:3px}
.lb-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--br)}
.lb-row:last-child{border-bottom:none}
.lb-rank{font-family:var(--fh);font-size:20px;font-weight:900;color:var(--mu);width:28px;flex-shrink:0}
.lb-rank.top{color:var(--wn)}
.lb-av{width:36px;height:36px;border-radius:50%;background:var(--bl2);border:2px solid var(--bl);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;font-family:var(--fh);color:var(--bl);flex-shrink:0}
.lb-info{flex:1;min-width:0}
.lb-name{font-size:14px;font-weight:700;color:var(--tx)}
.lb-stat{font-size:11px;color:var(--mu);margin-top:1px}
.lb-score{font-family:var(--fh);font-size:22px;font-weight:900;color:var(--bl)}
.lb-bar{height:5px;background:var(--s2);border-radius:3px;margin-top:4px;overflow:hidden}
.lb-fill{height:100%;background:var(--bl);border-radius:3px;transition:width .4s}
.lb-time-row{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const nowISO = () => new Date().toISOString();
const fmt = (d) => { if (!d) return '—'; if (d==='TBD'||d==='N/A') return d; return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); };
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
  unarchiveEvent: async (id) => supabase.from('cf_events').update({ archived:false, archived_at:null, archived_reason:'' }).eq('id', id),

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
  updateMasterItem: async (item) => supabase.from('cf_master_items').update({ name:item.name, category:item.category }).eq('id', item.id),
  deleteMasterItem: async (id) => supabase.from('cf_master_items').delete().eq('id', id),
  getFleet: async () => {
    const { data } = await supabase.from('cf_fleet').select('*').order('created_at');
    if (!data) return { trucks:[], trailers:[] };
    return { trucks: data.filter(f=>f.type==='truck'), trailers: data.filter(f=>f.type==='trailer') };
  },
  addFleetItem: async (item) => supabase.from('cf_fleet').insert({ id:item.id, type:item.type, name:item.name, detail:item.detail||'' }),
  updateFleetItem: async (item) => supabase.from('cf_fleet').update({ name:item.name, detail:item.detail||'', type:item.type }).eq('id', item.id),
  deleteFleetItem: async (id) => supabase.from('cf_fleet').delete().eq('id', id),
  getCategories: async () => { const { data } = await supabase.from('cf_categories').select('*').order('sort_order'); return (data||[]).map(c=>c.name); },
  addCategory: async (name, order) => supabase.from('cf_categories').insert({ name, sort_order:order }),
  updateCategory: async (oldName, newName) => supabase.from('cf_categories').update({ name:newName }).eq('name', oldName),
  deleteCategory: async (name) => supabase.from('cf_categories').delete().eq('name', name),
  getAllActivity: async () => { const { data } = await supabase.from('cf_activity_log').select('*').order('created_at', { ascending:false }).limit(200); return data || []; },

  // Login log
  addLoginLog: async (entry) => supabase.from('cf_login_log').insert({ id:entry.id, user_id:entry.userId, user_name:entry.userName, role:entry.role, logged_in_at:entry.at }),
  getLoginLog: async () => { const { data } = await supabase.from('cf_login_log').select('*').order('logged_in_at', { ascending:false }).limit(500); return data||[]; },
  purgeOldLoginLog: async () => {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 2);
    await supabase.from('cf_login_log').delete().lt('logged_in_at', cutoff.toISOString());
  },

  // Notes
  getNotes: async (refId) => { const { data } = await supabase.from('cf_notes').select('*').eq('ref_id', refId).order('created_at'); return data || []; },
  addNote: async (note) => supabase.from('cf_notes').insert({ id:note.id, ref_id:note.refId, ref_type:note.refType, body:note.body, by_name:note.by, user_id:note.userId }),
  deleteNote: async (id) => supabase.from('cf_notes').delete().eq('id', id),

  // Task Lists
  getTaskLists: async () => {
    const { data: lists } = await supabase.from('cf_task_lists').select('*').order('created_at', { ascending:false });
    if (!lists) return [];
    const { data: items } = await supabase.from('cf_task_items').select('*').order('sort_order');
    const { data: audit } = await supabase.from('cf_task_audit').select('*').order('created_at');
    return lists.map(tl => ({
      id: tl.id, title: tl.title, type: tl.type,
      dateStart: tl.date_start, dateEnd: tl.date_end,
      brief: tl.brief, archived: tl.archived, archivedAt: tl.archived_at,
      allTasksComplete: tl.all_tasks_complete || false,
      createdAt: tl.created_at,
      items: (items||[]).filter(i => i.list_id === tl.id).map(i => ({
        id: i.id, name: i.name, notes: i.notes||'',
        status: i.status||'pending',
        assignedTo: i.assigned_to||[], lead: i.lead||'', openToAll: i.open_to_all||false,
        completedBy: i.completed_by||'', completedAt: i.completed_at||null,
        needsSupportBy: i.needs_support_by||'', needsSupportAt: i.needs_support_at||null,
        carryoverLog: i.carryover_log||[], removedAt: i.removed_at||null,
        addedBy: i.added_by||'', addedAt: i.added_at||null,
      })),
      auditLog: (audit||[]).filter(a => a.list_id === tl.id).map(a => ({
        type: a.type, itemName: a.item_name, changes: a.changes, by: a.by_name, at: a.created_at,
      })),
    }));
  },
  unarchiveTaskList: async (id) => supabase.from('cf_task_lists').update({ archived:false, archived_at:null, all_tasks_complete:false }).eq('id', id),

  upsertTaskList: async (tl) => supabase.from('cf_task_lists').upsert({
    id: tl.id, title: tl.title, type: tl.type,
    date_start: tl.dateStart||null, date_end: tl.dateEnd||null,
    brief: tl.brief||'', archived: tl.archived||false,
    archived_at: tl.archivedAt||null,
    all_tasks_complete: tl.allTasksComplete||false,
    updated_at: new Date().toISOString(),
  }),
  upsertTaskItem: async (item, listId) => supabase.from('cf_task_items').upsert({
    id: item.id, list_id: listId, name: item.name, notes: item.notes||'',
    status: item.status||'pending',
    assigned_to: item.assignedTo||[], lead: item.lead||'', open_to_all: item.openToAll||false,
    completed_by: item.completedBy||'', completed_at: item.completedAt||null,
    needs_support_by: item.needsSupportBy||'', needs_support_at: item.needsSupportAt||null,
    carryover_log: item.carryoverLog||[], removed_at: item.removedAt||null,
    added_by: item.addedBy||'', added_at: item.addedAt||null,
  }),
  moveTaskItem: async (item, fromListId, toListId) => {
    // Remove from old list
    await supabase.from('cf_task_items').update({ removed_at: new Date().toISOString() }).eq('id', item.id);
    // Insert into new list with new id
    const newItem = { ...item, id: Math.random().toString(36).slice(2,9), list_id: toListId, status:'pending', completed_by:'', completed_at:null, needs_support_by:'', needs_support_at:null };
    await supabase.from('cf_task_items').insert({
      id: newItem.id, list_id: toListId, name: newItem.name, notes: newItem.notes||'',
      status: 'pending', assigned_to: newItem.assignedTo||[], lead: newItem.lead||'',
      open_to_all: newItem.openToAll||false, completed_by:'', completed_at:null,
      needs_support_by:'', needs_support_at:null, carryover_log: newItem.carryoverLog||[],
      removed_at: null, added_by: newItem.addedBy||'', added_at: newItem.addedAt||null,
    });
    return newItem;
  },
  addTaskAudit: async (listId, entry) => supabase.from('cf_task_audit').insert({
    id: Math.random().toString(36).slice(2,9), list_id: listId,
    type: entry.type, item_name: entry.itemName||'', changes: entry.changes||'', by_name: entry.by,
  }),
  addTaskActivity: async (listId, listTitle, log) => supabase.from('cf_activity_log').insert({
    id: log.id||Math.random().toString(36).slice(2,9),
    event_id: listId, event_name: listTitle,
    action: log.action, detail: log.detail, by_name: log.by, user_id: log.userId||'',
    activity_type: 'task',
  }),
  getTaskActivity: async () => { const { data } = await supabase.from('cf_activity_log').select('*').where ? await supabase.from('cf_activity_log').select('*').eq('activity_type','task').order('created_at',{ascending:false}).limit(500) : await supabase.from('cf_activity_log').select('*').order('created_at',{ascending:false}).limit(500); return (data||[]).filter(l => l.activity_type === 'task'); },
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
              <span>{m.name}</span>
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
  // Check for template from duplicate
  const templateStr = !existing ? sessionStorage.getItem('cf_template_event') : null;
  const template = templateStr ? JSON.parse(templateStr) : null;
  if (templateStr) sessionStorage.removeItem('cf_template_event');
  const e = existing || {};
  const t = template || {};
  const UNITS = ['units','pcs','ft','m','boxes','cases','rolls','sets','ea'];
  const [name, setName] = useState(e.name || (t.name ? `${t.name} (Copy)` : ''));
  const [venue, setVenue] = useState(e.venue || t.venue || '');
  const [address, setAddress] = useState(e.address || t.address || '');
  const [eventStart, setEventStart] = useState(e.eventStart || '');
  const [eventEnd, setEventEnd] = useState(e.eventEnd || '');
  const [installDT, setInstallDT] = useState(e.installDT || '');
  const [strikeDT, setStrikeDT] = useState(e.strikeDT || '');
  const [departureDT, setDepartureDT] = useState(e.departureDT || '');
  const [brief, setBrief] = useState(e.brief || t.brief || '');
  // For template: copy items but reset statuses
  const templateItems = t.items ? t.items.filter(i=>!i.removedAt).map(i=>({...i, id:uid(), status:'pending', addedBy:'admin', addedAt:null, preppedBy:'', loadedBy:'', removedAt:null, carryoverLog:[] })) : [];
  const [items, setItems] = useState((e.items || []).filter(i => !i.removedAt).length > 0 ? (e.items||[]).filter(i=>!i.removedAt) : templateItems);
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
        <div className="mtitle">{existing ? '✏️ Edit Event' : template ? '⧉ Duplicate Event' : '➕ New Event'}</div>
        {template && <div className="infobanner" style={{marginBottom:14}}>⧉ Copied from <strong>{template.name}</strong> — update the dates before publishing.</div>}
        <div className="field"><label className="flbl">Event Name *</label><input className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Strut Platform Putback" /></div>
        <div className="field"><label className="flbl">Venue Name</label><input className="fi" value={venue} onChange={e=>setVenue(e.target.value)} /></div>
        <div className="field"><label className="flbl">Address</label><input className="fi" value={address} onChange={e=>setAddress(e.target.value)} /></div>
        <div className="frow">
          <div className="field">
            <label className="flbl">Event Start</label>
            {eventStart==='N/A'||eventStart==='TBD' ? (
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <div className="fi" style={{flex:1,background:'var(--s2)',color:'var(--mu)',cursor:'default'}}>{eventStart}</div>
                <button className="btn bghost bsm" onClick={()=>setEventStart('')}>Change</button>
              </div>
            ) : (
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <input className="fi" type="date" value={eventStart} onChange={e=>setEventStart(e.target.value)} style={{flex:1,minWidth:120}} />
                <button className="btn bghost bsm" onClick={()=>setEventStart('TBD')}>TBD</button>
                <button className="btn bghost bsm" onClick={()=>setEventStart('N/A')}>N/A</button>
              </div>
            )}
          </div>
          <div className="field">
            <label className="flbl">Event End</label>
            {eventEnd==='N/A'||eventEnd==='TBD' ? (
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <div className="fi" style={{flex:1,background:'var(--s2)',color:'var(--mu)',cursor:'default'}}>{eventEnd}</div>
                <button className="btn bghost bsm" onClick={()=>setEventEnd('')}>Change</button>
              </div>
            ) : (
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <input className="fi" type="date" value={eventEnd} onChange={e=>setEventEnd(e.target.value)} style={{flex:1,minWidth:120}} />
                <button className="btn bghost bsm" onClick={()=>setEventEnd('TBD')}>TBD</button>
                <button className="btn bghost bsm" onClick={()=>setEventEnd('N/A')}>N/A</button>
              </div>
            )}
          </div>
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


// ─── NOTES SECTION ────────────────────────────────────────────────────────────
function NotesSection({ refId, refType, user }) {
  const [notes, setNotes] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.getNotes(refId).then(data => { setNotes(data||[]); setLoading(false); });
  }, [refId]);

  const handleAdd = async () => {
    if (!body.trim()) return;
    setSaving(true);
    const note = { id:uid(), refId, refType, body:body.trim(), by:user.name, userId:user.id };
    await db.addNote(note);
    setNotes(prev => [...prev, { ...note, created_at:new Date().toISOString() }]);
    setBody(''); setShowAdd(false); setSaving(false);
  };

  return (
    <div className="notes-section">
      <div className="notes-hdr">
        <span className="notes-lbl">📝 Notes ({notes.length})</span>
        {!showAdd && (
          <button className="btn" style={{background:'var(--wn)',color:'#fff',padding:'6px 14px',fontSize:12,fontWeight:800,borderRadius:'var(--r)'}} onClick={() => setShowAdd(true)}>+ Add Note</button>
        )}
      </div>
      {showAdd && (
        <div style={{background:'var(--s2)',border:'1px solid var(--wn)',borderRadius:'var(--r)',padding:12,marginBottom:10}}>
          <textarea
            className="fta"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Type your note here…"
            rows={3}
            autoFocus
            style={{marginBottom:8}}
          />
          <div style={{display:'flex',gap:8}}>
            <button className="btn bghost bsm" onClick={() => { setShowAdd(false); setBody(''); }}>Cancel</button>
            <button className="btn bsm" style={{flex:1,background:'var(--wn)',color:'#fff',fontWeight:800}} onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving…' : 'Save Note'}
            </button>
          </div>
        </div>
      )}
      {!loading && notes.length === 0 && !showAdd && (
        <div style={{fontSize:12,color:'var(--mu)',fontStyle:'italic'}}>No notes yet. Add one above.</div>
      )}
      {notes.map((n, i) => (
        <div key={n.id||i} className="note-item">
          <div className="note-body">{n.body}</div>
          <div className="note-meta">— {n.by_name||n.by} · {n.created_at ? new Date(n.created_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) : ''}</div>
        </div>
      ))}
    </div>
  );
}


// ─── HOLD TO DELETE ───────────────────────────────────────────────────────────
function HoldToDelete({ onDelete }) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const HOLD_MS = 1500;

  const startHold = () => {
    setHolding(true);
    setProgress(0);
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / HOLD_MS) * 100, 100);
      setProgress(pct);
    }, 30);
    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setHolding(false);
      setProgress(0);
      onDelete();
    }, HOLD_MS);
  };

  const cancelHold = () => {
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    setHolding(false);
    setProgress(0);
  };

  return (
    <button
      className="btn bdng bsm"
      style={{ position:'relative', overflow:'hidden', minWidth:36, userSelect:'none' }}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      title="Hold to delete"
    >
      {holding && (
        <div style={{
          position:'absolute', left:0, top:0, height:'100%',
          width:`${progress}%`, background:'rgba(220,38,38,0.3)',
          transition:'none', borderRadius:'var(--r)'
        }} />
      )}
      <span style={{position:'relative'}}>✕</span>
    </button>
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
  const isLocked = isRTR; // RTR locks for everyone including admin — must unlock first

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
              {isAdmin && !event.archived && !isRTR && <button className="btn bacc bsm" onClick={() => setShowEditEvent(true)}>Edit</button>}
              {isAdmin && !event.archived && !isRTR && <button className="btn bghost bsm" onClick={() => handleArchive('manual')}>Archive</button>}
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
      <div className="pblock" style={{marginTop:14}}>
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
      <div style={{height:6}} />
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
      <div style={{height:8}} />
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
                  <div className="iqty">Qty: {item.qty}</div>
                  {item.notes && <div className="iqty" style={{marginTop:3,whiteSpace:'pre-wrap',lineHeight:1.5}}>{item.notes}</div>}
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
                      {isAdmin
                        ? <button className="btn bdng bsm" onClick={() => setRemoveTarget(item)}>✕</button>
                        : <HoldToDelete onDelete={() => setRemoveTarget(item)} />
                      }
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Divider + Notes section */}
      <div style={{borderTop:'2px solid var(--br)',margin:'22px 0 0'}} />
      <NotesSection refId={event.id} refType="event" user={user} />

      {/* #12 Export buttons */}
      <div className="export-row" style={{marginTop:18}}>
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
                Also check the <strong>📝 Notes section</strong> below — crew may have left important last-minute notes.<br /><br />
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

function EventList({ events, user, onSelect, onCreateNew, onUpdate, onDuplicate }) {
  const [tab, setTab] = useState('active');
  const [confirmArchive, setConfirmArchive] = useState(null);
  const [confirmUnarchive, setConfirmUnarchive] = useState(null);
  const [toast, setToast] = useState(null);
  const isAdmin = user.role === 'admin';
  const pt = (msg, type) => setToast({ msg, type });

  const handleArchive = async (ev) => {
    const updated = { ...ev, archived:true, archivedAt:nowISO(), archivedReason:'manual' };
    await db.upsertEvent(updated);
    onUpdate(updated);
    setConfirmArchive(null);
    pt(`"${ev.name}" archived`, 'ok');
  };

  const handleUnarchive = async (ev) => {
    await db.unarchiveEvent(ev.id);
    const updated = { ...ev, archived:false, archivedAt:null, archivedReason:'' };
    onUpdate(updated);
    setConfirmUnarchive(null);
    pt(`"${ev.name}" reinstated`, 'ok');
  };
  const live = events.filter(e => !e.archived && (isAdmin || e.live));
  const archived = events.filter(e => e.archived);

  // #10 Sort by event start date soonest first
  const sortByDate = (arr) => [...arr].sort((a, b) => {
    const da = a.installDT && a.installDT !== 'TBD' ? a.installDT : a.eventStart;
    const db2 = b.installDT && b.installDT !== 'TBD' ? b.installDT : b.eventStart;
    if (!da) return 1;
    if (!db2) return -1;
    return new Date(da) - new Date(db2);
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
              <div style={{flex:1}}><div className="ename">{ev.name}</div><div className="evenue">{ev.venue||ev.address||'—'}</div></div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
                <div className="pills">
                  <span className={'pill ' + (ev.archived ? 'parc' : isRTR ? 'prtr' : ev.live ? 'plive' : 'pdraft')}>
                    {ev.archived ? 'Archived' : isRTR ? '✓ Ready to Roll' : ev.live ? 'Live' : 'Draft'}
                  </span>
                </div>
                {isAdmin && (
                  <div style={{display:'flex',gap:4}} onClick={e=>e.stopPropagation()}>
                    <button className="btn bghost bsm" style={{fontSize:10}} onClick={()=>onDuplicate(ev)}>⧉ Copy</button>
                    {ev.archived
                      ? <button className="btn bok bsm" style={{fontSize:10}} onClick={()=>setConfirmUnarchive(ev)}>↩ Reinstate</button>
                      : <button className="btn bghost bsm" style={{fontSize:10}} onClick={()=>setConfirmArchive(ev)}>Archive</button>
                    }
                  </div>
                )}
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

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      {confirmArchive && (
        <div className="mback ctr"><div className="mover" onClick={() => setConfirmArchive(null)} />
          <div className="modal">
            <Confirm title="Archive Event?" body={`Archive "${confirmArchive.name}"? It will move to Archived and can be reinstated at any time.`}
              onConfirm={() => handleArchive(confirmArchive)} onCancel={() => setConfirmArchive(null)} confirmLabel="Archive" />
          </div>
        </div>
      )}
      {confirmUnarchive && (
        <div className="mback ctr"><div className="mover" onClick={() => setConfirmUnarchive(null)} />
          <div className="modal">
            <Confirm title="Reinstate Event?" body={`Reinstate "${confirmUnarchive.name}"? It will move back to Active events.`}
              onConfirm={() => handleUnarchive(confirmUnarchive)} onCancel={() => setConfirmUnarchive(null)} confirmLabel="Reinstate" />
          </div>
        </div>
      )}
    </div>
  );
}


// ─── LOGIN HISTORY ────────────────────────────────────────────────────────────
function LoginHistory({ loginLogs }) {
  const [period, setPeriod] = useState('week');
  const now = new Date();

  const inPeriod = (dateStr) => {
    const d = new Date(dateStr);
    if (period === 'day') {
      const start = new Date(now); start.setHours(0,0,0,0);
      const end = new Date(now); end.setHours(23,59,59,999);
      return d >= start && d <= end;
    }
    if (period === 'week') {
      const day = now.getDay();
      const monday = new Date(now); monday.setDate(now.getDate()-(day===0?6:day-1)); monday.setHours(0,0,0,0);
      const sunday = new Date(monday); sunday.setDate(monday.getDate()+6); sunday.setHours(23,59,59,999);
      return d >= monday && d <= sunday;
    }
    if (period === 'month') return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
    if (period === 'year') return d.getFullYear()===now.getFullYear();
    return true;
  };

  const filtered = loginLogs.filter(l => inPeriod(l.logged_in_at));

  // Group by date
  const grouped = filtered.reduce((acc, l) => {
    const date = new Date(l.logged_in_at).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(l);
    return acc;
  }, {});

  // Count per user for selected period
  const userCounts = {};
  filtered.forEach(l => { userCounts[l.user_name] = (userCounts[l.user_name]||0) + 1; });
  const topUsers = Object.entries(userCounts).sort((a,b)=>b[1]-a[1]);

  const PERIODS = [['day','Today'],['week','This Week'],['month','This Month'],['year','This Year']];

  return (
    <div style={{marginTop:10}}>
      {/* Period filter */}
      <div className="tabrow" style={{marginBottom:12}}>
        {PERIODS.map(([v,l]) => (
          <button key={v} className={'btn bsm '+(period===v?'bacc':'bghost')} onClick={()=>setPeriod(v)}>{l}</button>
        ))}
      </div>

      {/* Summary chips */}
      {filtered.length > 0 && (
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
          <div style={{background:'var(--bl2)',border:'1px solid var(--bl)',borderRadius:'var(--r)',padding:'6px 12px',fontSize:12,color:'var(--bl)',fontWeight:700}}>
            {filtered.length} login{filtered.length!==1?'s':''}
          </div>
          {topUsers.slice(0,3).map(([name,count])=>(
            <div key={name} style={{background:'var(--s2)',border:'1px solid var(--br)',borderRadius:'var(--r)',padding:'6px 12px',fontSize:12,color:'var(--mu)',fontWeight:600}}>
              {name}: {count}×
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty" style={{padding:20}}><div className="etxt">No logins in this period.</div></div>
      )}

      {/* Grouped by day */}
      {Object.entries(grouped).map(([date, entries]) => (
        <div key={date} style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:'var(--mu)',textTransform:'uppercase',marginBottom:6,paddingBottom:4,borderBottom:'1px solid var(--br)'}}>
            {date} — {entries.length} login{entries.length!==1?'s':''}
          </div>
          <div style={{background:'var(--sf)',border:'1px solid var(--br)',borderRadius:'var(--rl)',overflow:'hidden'}}>
            {entries.map((l,i) => (
              <div key={i} className="logrow">
                <div className="logav" style={{background:l.role==='admin'?'var(--bl2)':'var(--s2)',borderColor:l.role==='admin'?'var(--bl)':'var(--br)',color:l.role==='admin'?'var(--bl)':'var(--mu)'}}>
                  {(l.user_name||'?')[0]}
                </div>
                <div className="logbody">
                  <div className="logact">
                    <strong style={{color:'var(--tx)'}}>{l.user_name}</strong> logged in
                    {l.role==='admin' && <span style={{marginLeft:6,fontSize:9,fontWeight:800,color:'var(--bl)',background:'var(--bl2)',padding:'1px 6px',borderRadius:10,letterSpacing:1,textTransform:'uppercase'}}>Admin</span>}
                  </div>
                  <div className="logt">{new Date(l.logged_in_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',second:'2-digit'})}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{textAlign:'center',marginTop:8,fontSize:10,color:'var(--mu)'}}>
        Login history retained for 2 years · {loginLogs.length} total records
      </div>
    </div>
  );
}

function ActivityLog({ users, events }) {
  const [logs, setLogs] = useState([]);
  const [taskLogs, setTaskLogs] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [showLoginLog, setShowLoginLog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('project');
  const [projPeriod, setProjPeriod] = useState('week');
  const [projEvent, setProjEvent] = useState('all');
  const [whPeriod, setWhPeriod] = useState('week');
  const [combPeriod, setCombPeriod] = useState('week');

  useEffect(() => {
    Promise.all([db.getAllActivity(), db.getTaskActivity(), db.getLoginLog()]).then(([all, tasks, logins]) => {
      setLogs(all||[]); setTaskLogs(tasks||[]); setLoginLogs(logins||[]); setLoading(false);
    });
    db.purgeOldLoginLog(); // silently purge entries older than 2 years
  }, []);

  const resolveUser = (id) => users.find(u => u.id === id);
  const now = new Date();

  // Period filter — precise calendar boundaries
  const inPeriod = (dateStr, period) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (period === 'day') {
      const start = new Date(now); start.setHours(0,0,0,0);
      const end = new Date(now); end.setHours(23,59,59,999);
      return d >= start && d <= end;
    }
    if (period === 'week') {
      const day = now.getDay(); // 0=Sun
      const monday = new Date(now); monday.setDate(now.getDate() - (day===0?6:day-1)); monday.setHours(0,0,0,0);
      const sunday = new Date(monday); sunday.setDate(monday.getDate()+6); sunday.setHours(23,59,59,999);
      return d >= monday && d <= sunday;
    }
    if (period === 'month') {
      return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
    }
    if (period === 'year') {
      return d.getFullYear()===now.getFullYear();
    }
    return true;
  };

  // All event names for dropdown — archive by year
  const allEventNames = [...new Set(logs.map(l=>l.event_name).filter(Boolean))].sort();
  const currentYear = now.getFullYear();
  const eventsByYear = allEventNames.reduce((acc, name) => {
    // Find most recent log for this event to determine year
    const evLogs = logs.filter(l=>l.event_name===name);
    const latest = evLogs.reduce((a,b)=>new Date(a.created_at)>new Date(b.created_at)?a:b, evLogs[0]);
    const yr = latest ? new Date(latest.created_at).getFullYear() : currentYear;
    if (!acc[yr]) acc[yr] = [];
    acc[yr].push(name);
    return acc;
  }, {});

  // Project logs (status_change on events)
  const projLogs = logs.filter(l => l.action==='status_change' && (!l.activity_type || l.activity_type==='event'));
  const filteredProjLogs = projLogs.filter(l =>
    inPeriod(l.created_at, projPeriod) &&
    (projEvent==='all' || l.event_name===projEvent)
  );

  // Warehouse task logs
  const filteredWhLogs = taskLogs.filter(l => inPeriod(l.created_at, whPeriod));

  // Contribution calc helper
  const calcContribs = (logArr, userIdField='user_id') => {
    const map = {};
    logArr.forEach(l => { const uid = l[userIdField]||l.userId; if(uid) map[uid]=(map[uid]||0)+1; });
    const total = Object.values(map).reduce((a,b)=>a+b,0);
    return { map, total };
  };

  const PERIODS = [['day','Today'],['week','This Week'],['month','This Month'],['year','This Year']];

  const ContribBar = ({ label, count, total, color='var(--bl)' }) => {
    const pct = total>0 ? Math.round((count/total)*100) : 0;
    return (
      <div style={{marginBottom:10}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
          <span style={{fontSize:13,fontWeight:600,color:'var(--tx)'}}>{label}</span>
          <span style={{fontSize:12,fontWeight:700,color}}>{pct}% <span style={{color:'var(--mu)',fontWeight:400}}>({count} actions)</span></span>
        </div>
        <div style={{background:'var(--s2)',borderRadius:3,height:7,overflow:'hidden'}}>
          <div style={{background:color,width:`${pct}%`,height:'100%',borderRadius:3,transition:'width .4s'}} />
        </div>
      </div>
    );
  };

  const LogList = ({ items }) => {
    if (items.length===0) return <div className="empty" style={{padding:20}}><div className="etxt">No activity for this period.</div></div>;
    const sliced = items.slice(0,150);
    let lastDay = null;
    return (
      <div style={{background:'var(--sf)',border:'1px solid var(--br)',borderRadius:'var(--rl)',overflow:'hidden',marginTop:10}}>
        {sliced.map((l,i) => {
          const u = resolveUser(l.user_id);
          const entryDay = l.created_at ? new Date(l.created_at).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}) : null;
          const showDivider = entryDay && entryDay !== lastDay;
          if (showDivider) lastDay = entryDay;
          return (
            <React.Fragment key={i}>
              {showDivider && (
                <div style={{padding:'7px 14px',background:'var(--s2)',borderBottom:'1px solid var(--br)',borderTop:i>0?'1px solid var(--br)':'none',display:'flex',alignItems:'center',gap:10}}>
                  <div style={{flex:1,height:1,background:'var(--br)'}} />
                  <span style={{fontSize:10,fontWeight:800,letterSpacing:1.5,color:'var(--mu)',textTransform:'uppercase',whiteSpace:'nowrap'}}>{entryDay}</span>
                  <div style={{flex:1,height:1,background:'var(--br)'}} />
                </div>
              )}
              <div className="logrow">
                <div className="logav">{(u?u.name:l.by_name||'?')[0]}</div>
                <div className="logbody">
                  <div className="logact"><strong style={{color:'var(--tx)'}}>{l.by_name}</strong> — {l.detail}</div>
                  <div className="logt">{fmtFull(l.created_at)}</div>
                  {l.event_name && <div className="logevt">{l.activity_type==='task'?'Task':'Event'}: {l.event_name}</div>}
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {items.length>150 && <div style={{padding:'8px 14px',fontSize:11,color:'var(--mu)',textAlign:'center'}}>Showing 150 of {items.length} entries</div>}
      </div>
    );
  };

  if (loading) return <div className="empty"><div className="etxt">Loading…</div></div>;

  return (
    <div>
      {/* Main section tabs */}
      <div className="tabrow" style={{marginBottom:14}}>
        <button className={'btn bsm '+(section==='project'?'bacc':'bghost')} onClick={()=>setSection('project')}>🎪 Project Tasks</button>
        <button className={'btn bsm '+(section==='warehouse'?'bacc':'bghost')} onClick={()=>setSection('warehouse')}>📦 Warehouse Tasks</button>
        <button className={'btn bsm '+(section==='combined'?'bacc':'bghost')} onClick={()=>setSection('combined')}>📊 Combined</button>
      </div>

      {/* ── PROJECT TASKS ── */}
      {section==='project' && (() => {
        const { map, total } = calcContribs(filteredProjLogs);
        const activeEmps = users.filter(u=>u.active&&map[u.id]);
        return (
          <div>
            <div className="tabrow" style={{marginBottom:8}}>
              {PERIODS.map(([v,l])=><button key={v} className={'btn bsm '+(projPeriod===v?'bacc':'bghost')} onClick={()=>setProjPeriod(v)}>{l}</button>)}
            </div>
            <div className="field">
              <label className="flbl">Filter by Event</label>
              <select className="fsel" value={projEvent} onChange={e=>setProjEvent(e.target.value)}>
                <option value="all">All Events</option>
                {Object.keys(eventsByYear).sort((a,b)=>b-a).map(yr=>(
                  <optgroup key={yr} label={yr==currentYear?`${yr} — Current`:`${yr} — Archived`}>
                    {eventsByYear[yr].map(name=><option key={name} value={name}>{name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            {total>0 && (
              <div style={{background:'var(--sf)',border:'1px solid var(--br)',borderRadius:'var(--rl)',padding:'12px 14px',marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'var(--mu)',textTransform:'uppercase',marginBottom:10}}>Contributions — {filteredProjLogs.length} actions</div>
                {activeEmps.sort((a,b)=>(map[b.id]||0)-(map[a.id]||0)).map(u=>(
                  <ContribBar key={u.id} label={u.name} count={map[u.id]||0} total={total} color="var(--bl)" />
                ))}
              </div>
            )}
            <LogList items={filteredProjLogs} />
          </div>
        );
      })()}

      {/* ── WAREHOUSE TASKS ── */}
      {section==='warehouse' && (() => {
        const taskActions = filteredWhLogs.filter(l=>l.action==='task_status');
        const { map, total } = calcContribs(taskActions);
        const activeEmps = users.filter(u=>u.active&&map[u.id]);
        return (
          <div>
            <div className="tabrow" style={{marginBottom:8}}>
              {PERIODS.map(([v,l])=><button key={v} className={'btn bsm '+(whPeriod===v?'bacc':'bghost')} onClick={()=>setWhPeriod(v)}>{l}</button>)}
            </div>
            {total>0 && (
              <div style={{background:'var(--sf)',border:'1px solid var(--br)',borderRadius:'var(--rl)',padding:'12px 14px',marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'var(--mu)',textTransform:'uppercase',marginBottom:10}}>Contributions — {taskActions.length} actions</div>
                {activeEmps.sort((a,b)=>(map[b.id]||0)-(map[a.id]||0)).map(u=>(
                  <ContribBar key={u.id} label={u.name} count={map[u.id]||0} total={total} color="var(--ok)" />
                ))}
              </div>
            )}
            <LogList items={filteredWhLogs} />
          </div>
        );
      })()}

      {/* ── COMBINED ── */}
      {section==='combined' && (() => {
        const combProjLogs = projLogs.filter(l=>inPeriod(l.created_at, combPeriod));
        const combWhLogs = taskLogs.filter(l=>inPeriod(l.created_at, combPeriod) && l.action==='task_status');
        const { map: pm, total: pt2 } = calcContribs(combProjLogs);
        const { map: wm, total: wt } = calcContribs(combWhLogs);
        const totalAll = pt2 + wt;
        const allActiveEmps = users.filter(u=>u.active&&((pm[u.id]||0)+(wm[u.id]||0)>0));
        return (
          <div>
            <div className="tabrow" style={{marginBottom:14}}>
              {PERIODS.map(([v,l])=><button key={v} className={'btn bsm '+(combPeriod===v?'bacc':'bghost')} onClick={()=>setCombPeriod(v)}>{l}</button>)}
            </div>
            {allActiveEmps.length===0 && <div className="empty"><div className="eico">📊</div><div className="etxt">No activity for this period.</div></div>}
            {allActiveEmps.sort((a,b)=>((pm[b.id]||0)+(wm[b.id]||0))-((pm[a.id]||0)+(wm[a.id]||0))).map(u=>{
              const projCount = pm[u.id]||0;
              const whCount = wm[u.id]||0;
              const total2 = projCount+whCount;
              const combPct = totalAll>0?Math.round((total2/totalAll)*100):0;
              const projPct2 = total2>0?Math.round((projCount/total2)*100):0;
              const whPct2 = 100-projPct2;
              return (
                <div key={u.id} style={{background:'var(--sf)',border:'1px solid var(--br)',borderRadius:'var(--rl)',padding:'13px 14px',marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:9}}>
                      <div className="lb-av">{u.name[0]}</div>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:'var(--tx)'}}>{u.name}</div>
                        <div style={{fontSize:11,color:'var(--mu)',marginTop:1}}>{total2} total actions · {combPct}% of team</div>
                      </div>
                    </div>
                    <div style={{fontFamily:'var(--fh)',fontSize:24,fontWeight:900,color:'var(--bl)'}}>{combPct}%</div>
                  </div>
                  {/* Combined bar */}
                  <div style={{marginBottom:6}}>
                    <div style={{height:10,borderRadius:5,overflow:'hidden',display:'flex',background:'var(--s2)'}}>
                      <div style={{width:`${projPct2}%`,background:'var(--bl)',transition:'width .4s'}} />
                      <div style={{width:`${whPct2}%`,background:'var(--ok)',transition:'width .4s'}} />
                    </div>
                    <div style={{display:'flex',gap:12,marginTop:4}}>
                      <span style={{fontSize:10,color:'var(--bl)',fontWeight:700}}>■ Project: {projCount} ({projPct2}%)</span>
                      <span style={{fontSize:10,color:'var(--ok)',fontWeight:700}}>■ Warehouse: {whCount} ({whPct2}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
      {/* Login Log */}
      <div style={{marginTop:28,textAlign:'center'}}>
        <button
          onClick={() => setShowLoginLog(o=>!o)}
          style={{background:'none',border:'none',color:'var(--mu)',fontSize:12,cursor:'pointer',textDecoration:'underline',opacity:.7}}>
          {showLoginLog ? '▲ Hide Login History' : '▼ View Login History'}
        </button>
      </div>
      {showLoginLog && <LoginHistory loginLogs={loginLogs} />}
    </div>
  );
}

function UserManager({ users, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name:'', pin:'', role:'employee' });
  const pt = (msg, type) => setToast({ msg, type });

  const handleAdd = async () => {
    if (!form.name.trim() || form.pin.length < 4) { pt('Name & 4-digit PIN required', 'err'); return; }
    const newUser = { id:uid(), name:form.name.trim(), pin:form.pin, email:'', role:form.role, active:true, createdAt:nowISO() };
    await db.upsertUser(newUser);
    onUpdate([...users, newUser]);
    setShowAdd(false); setForm({ name:'', pin:'', role:'employee' });
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
    setConfirmDel(null); pt(`${confirmDel.name} deactivated — moved to Archived Crew`, 'ok');
  };

  const activeEmployees = users.filter(u => u.id !== 'admin' && u.active);
  const archivedEmployees = users.filter(u => u.id !== 'admin' && !u.active);

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <div className="shd" style={{ marginBottom:14 }}>
        <span className="slbl">Team ({activeEmployees.length} active)</span>
        <button className="btn bacc bsm" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>

      {/* Active employees */}
      {activeEmployees.map(u => (
        <div key={u.id} className="ucard">
          <div className="uavlg">{u.name[0]}</div>
          <div className="ucinfo">
            <div className="ucname">{u.name}</div>
            <div className="ucmeta">PIN: {u.pin}</div>
          </div>
          <div className="ucacts">
            <button className="btn bghost bsm" onClick={() => setEditUser({...u})}>Edit</button>
            <button className="btn bdng bsm" onClick={() => setConfirmDel(u)}>✕</button>
          </div>
        </div>
      ))}

      {/* Archived crew section */}
      {archivedEmployees.length > 0 && (
        <div style={{marginTop:20}}>
          <div
            style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'var(--s2)',border:'1px solid var(--br)',borderRadius:'var(--rl)',cursor:'pointer',marginBottom:showArchived?8:0}}
            onClick={() => setShowArchived(o=>!o)}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:16}}>🗄</span>
              <span style={{fontFamily:'var(--fh)',fontSize:13,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--mu)'}}>Archived Crew ({archivedEmployees.length})</span>
            </div>
            <span style={{fontSize:12,color:'var(--mu)',fontWeight:700}}>{showArchived?'▲':'▼'}</span>
          </div>
          {showArchived && archivedEmployees.map(u => (
            <div key={u.id} className="ucard" style={{opacity:.75,borderStyle:'dashed'}}>
              <div className="uavlg" style={{opacity:.5}}>{u.name[0]}</div>
              <div className="ucinfo">
                <div className="ucname">{u.name}<span className="iabadge" style={{marginLeft:7}}>Inactive</span></div>
                <div className="ucmeta">PIN: {u.pin}</div>
                {u.deactivatedAt && <div style={{fontSize:10,color:'var(--dn)',marginTop:2}}>Deactivated {fmtDT(u.deactivatedAt)}</div>}
              </div>
              <div className="ucacts">
                <button className="btn bok bsm" onClick={async () => {
                  await db.upsertUser({...u,active:true,deactivatedAt:null});
                  onUpdate(users.map(x=>x.id===u.id?{...x,active:true,deactivatedAt:null}:x));
                  pt(`${u.name} restored!`,'ok');
                }}>Restore</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="mback ctr"><div className="mover" onClick={() => setShowAdd(false)} />
          <div className="modal">
            <div className="mtitle">Add Team Member</div>
            <div className="field"><label className="flbl">Full Name *</label><input className="fi" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} autoFocus /></div>
            <div className="field"><label className="flbl">4-Digit PIN *</label><input className="fi" type="number" value={form.pin} onChange={e=>setForm(p=>({...p,pin:e.target.value.slice(0,4)}))} /></div>
            <div className="field"><label className="flbl">Role</label>
              <select className="fsel" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="macts">
              <button className="btn bghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn bprim" style={{flex:2}} onClick={handleAdd}>Add Member</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className="mback ctr"><div className="mover" onClick={() => setEditUser(null)} />
          <div className="modal">
            <div className="mtitle">Edit: {editUser.name}</div>
            <div className="field"><label className="flbl">Full Name</label><input className="fi" value={editUser.name} onChange={e=>setEditUser(p=>({...p,name:e.target.value}))} /></div>
            <div className="field"><label className="flbl">PIN (4 digits)</label><input className="fi" type="number" value={editUser.pin} onChange={e=>setEditUser(p=>({...p,pin:e.target.value.slice(0,4)}))} /></div>
            <div className="field"><label className="flbl">Role</label>
              <select className="fsel" value={editUser.role} onChange={e=>setEditUser(p=>({...p,role:e.target.value}))}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="macts">
              <button className="btn bghost" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn bprim" style={{flex:2}} onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="mback ctr"><div className="mover" onClick={() => setConfirmDel(null)} />
          <div className="modal">
            <Confirm title="Deactivate User?" body={`${confirmDel.name} will be locked out and moved to Archived Crew. All their activity is preserved.`} danger onConfirm={handleDeactivate} onCancel={() => setConfirmDel(null)} confirmLabel="Deactivate" />
          </div>
        </div>
      )}
    </div>
  );
}


// ─── GEAR TAB (combined Gear Library + Categories) ────────────────────────────
function GearTab({ masterItems, onUpdateMaster, categories, onUpdateCategories }) {
  const [view, setView] = useState('library'); // 'library' | 'categories'
  return (
    <div>
      <div style={{display:'flex',background:'var(--s2)',border:'1px solid var(--br)',borderRadius:'var(--rl)',padding:4,marginBottom:16,gap:4}}>
        <button
          onClick={() => setView('library')}
          style={{flex:1,padding:'8px',borderRadius:'var(--r)',border:'none',fontFamily:'var(--fh)',fontSize:13,fontWeight:800,letterSpacing:1,cursor:'pointer',transition:'.15s',
            background: view==='library' ? 'var(--sf)' : 'transparent',
            color: view==='library' ? 'var(--bl)' : 'var(--mu)',
            boxShadow: view==='library' ? '0 1px 4px rgba(0,0,0,.08)' : 'none'
          }}>
          📦 Gear Library
        </button>
        <button
          onClick={() => setView('categories')}
          style={{flex:1,padding:'8px',borderRadius:'var(--r)',border:'none',fontFamily:'var(--fh)',fontSize:13,fontWeight:800,letterSpacing:1,cursor:'pointer',transition:'.15s',
            background: view==='categories' ? 'var(--sf)' : 'transparent',
            color: view==='categories' ? 'var(--bl)' : 'var(--mu)',
            boxShadow: view==='categories' ? '0 1px 4px rgba(0,0,0,.08)' : 'none'
          }}>
          🏷 Categories
        </button>
      </div>
      {view === 'library'
        ? <MasterItemList masterItems={masterItems} onUpdate={onUpdateMaster} />
        : <CategoryManager categories={categories} onUpdate={onUpdateCategories} />
      }
    </div>
  );
}

function MasterItemList({ masterItems, onUpdate }) {
  const categories = useContext(CatContext);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [newItem, setNewItem] = useState({ name:'', category:categories[0] });
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState(null);

  const handleAdd = async () => {
    if (!newItem.name.trim()) return;
    const item = { id:uid(), name:newItem.name.trim(), category:newItem.category };
    await db.addMasterItem(item);
    onUpdate([...masterItems, item]);
    setNewItem({ name:'', category:categories[0] });
    setShowAdd(false);
    setToast({ msg:'Added to Gear Library', type:'ok' });
  };

  const handleEdit = async () => {
    if (!editItem.name.trim()) return;
    await db.updateMasterItem(editItem);
    onUpdate(masterItems.map(m => m.id === editItem.id ? editItem : m));
    setEditItem(null);
    setToast({ msg:'Item updated', type:'ok' });
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <div className="shd" style={{ marginBottom:8 }}>
        <span className="slbl">Gear Library ({masterItems.length})</span>
        <button className="btn bacc bsm" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>
      <div className="infobanner">These items appear as autocomplete suggestions when adding gear to events.</div>
      {categories.map(cat => {
        const catItems = masterItems.filter(m => m.category === cat);
        if (!catItems.length) return null;
        return (
          <div key={cat} className="catblk">
            <div className="catlbl">{cat}</div>
            {catItems.map(m => (
              <div key={m.id} className="mitem">
                <span className="mname">{m.name}</span>
                <span className="mcat">{m.category}</span>
                <button className="btn bghost bsm" onClick={() => setEditItem({...m})}>Edit</button>
                <button className="btn bdng bsm" onClick={() => setConfirmDel(m)}>✕</button>
              </div>
            ))}
          </div>
        );
      })}

      {/* Add modal */}
      {showAdd && (
        <div className="mback ctr"><div className="mover" onClick={() => setShowAdd(false)} />
          <div className="modal">
            <div className="mtitle">Add to Gear Library</div>
            <div className="field"><label className="flbl">Item Name *</label><input className="fi" value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} autoFocus /></div>
            <div className="field"><label className="flbl">Category</label>
              <select className="fsel" value={newItem.category} onChange={e=>setNewItem(p=>({...p,category:e.target.value}))}>
                {categories.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="macts">
              <button className="btn bghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn bprim" style={{flex:2}} onClick={handleAdd}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editItem && (
        <div className="mback ctr"><div className="mover" onClick={() => setEditItem(null)} />
          <div className="modal">
            <div className="mtitle">✏️ Edit Gear Item</div>
            <div className="field"><label className="flbl">Item Name *</label><input className="fi" value={editItem.name} onChange={e=>setEditItem(p=>({...p,name:e.target.value}))} autoFocus /></div>
            <div className="field"><label className="flbl">Category</label>
              <select className="fsel" value={editItem.category} onChange={e=>setEditItem(p=>({...p,category:e.target.value}))}>
                {categories.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="macts">
              <button className="btn bghost" onClick={() => setEditItem(null)}>Cancel</button>
              <button className="btn bprim" style={{flex:2}} onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="mback ctr"><div className="mover" onClick={() => setConfirmDel(null)} />
          <div className="modal">
            <Confirm title="Remove from Library?" body={`Remove "${confirmDel.name}"?`} danger
              onConfirm={async () => { await db.deleteMasterItem(confirmDel.id); onUpdate(masterItems.filter(m=>m.id!==confirmDel.id)); setConfirmDel(null); setToast({msg:'Removed',type:'err'}); }}
              onCancel={() => setConfirmDel(null)} confirmLabel="Remove" />
          </div>
        </div>
      )}
    </div>
  );
}

function FleetLibrary({ fleet, onUpdate }) {
  const [showAdd, setShowAdd] = useState(null);
  const [editItem, setEditItem] = useState(null);
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

  const handleEdit = async () => {
    if (!editItem.name.trim()) return;
    await db.updateFleetItem(editItem);
    // Rebuild fleet — item may have switched type (truck ↔ trailer)
    const allItems = [...trucks, ...trailers].map(t => t.id === editItem.id ? editItem : t);
    onUpdate({
      trucks: allItems.filter(t=>t.type==='truck'),
      trailers: allItems.filter(t=>t.type==='trailer'),
    });
    setEditItem(null);
    setToast({ msg:'Vehicle updated', type:'ok' });
  };

  const handleDel = async () => {
    await db.deleteFleetItem(confirmDel.id);
    const updated = confirmDel.type === 'truck'
      ? { ...fleet, trucks:trucks.filter(t=>t.id!==confirmDel.id) }
      : { ...fleet, trailers:trailers.filter(t=>t.id!==confirmDel.id) };
    onUpdate(updated); setConfirmDel(null); setToast({ msg:'Removed from fleet', type:'err' });
  };

  const renderSection = (title, items, type, icon) => (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div className="catlbl" style={{ borderBottom:'none', paddingBottom:0, marginBottom:0 }}>{icon} {title} ({items.length})</div>
        <button className="btn bacc bsm" onClick={() => { setShowAdd(type); setNewItem({ name:'', detail:'' }); }}>+ Add</button>
      </div>
      {items.length === 0 && <div style={{ fontSize:12, color:'var(--mu)', padding:'8px 0' }}>No {title.toLowerCase()} yet.</div>}
      {items.map(t => (
        <div key={t.id} className="mitem">
          <div style={{ flex:1 }}>
            <div className="mname">{t.name}</div>
            {t.detail && <div style={{ fontSize:11, color:'var(--mu)', marginTop:2 }}>{t.detail}</div>}
          </div>
          <button className="btn bghost bsm" onClick={() => setEditItem({...t})}>Edit</button>
          <button className="btn bdng bsm" onClick={() => setConfirmDel({ type, id:t.id, name:t.name })}>✕</button>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <div className="infobanner">Trucks and trailers here appear as dropdown options when assigning vehicles to events.</div>
      {renderSection('Trucks', trucks, 'truck', '🚛')}
      {renderSection('Trailers', trailers, 'trailer', '🚚')}

      {/* Add modal */}
      {showAdd && (
        <div className="mback ctr"><div className="mover" onClick={() => setShowAdd(null)} />
          <div className="modal">
            <div className="mtitle">Add {showAdd==='truck'?'Truck':'Trailer'}</div>
            <div className="field"><label className="flbl">Name / ID *</label>
              <input className="fi" value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))}
                placeholder={showAdd==='truck'?'e.g. Box Truck #3':'e.g. 20ft Enclosed #3'} autoFocus />
            </div>
            <div className="field"><label className="flbl">Make / Model</label>
              <input className="fi" value={newItem.detail} onChange={e=>setNewItem(p=>({...p,detail:e.target.value}))}
                placeholder={showAdd==='truck'?'e.g. Ford F-650':'e.g. Haulmark 20ft'} />
            </div>
            <div className="macts">
              <button className="btn bghost" onClick={() => setShowAdd(null)}>Cancel</button>
              <button className="btn bprim" style={{flex:2}} onClick={handleAdd}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editItem && (
        <div className="mback ctr"><div className="mover" onClick={() => setEditItem(null)} />
          <div className="modal">
            <div className="mtitle">✏️ Edit Vehicle</div>
            <div className="field"><label className="flbl">Name / ID *</label>
              <input className="fi" value={editItem.name} onChange={e=>setEditItem(p=>({...p,name:e.target.value}))} autoFocus />
            </div>
            <div className="field"><label className="flbl">Make / Model</label>
              <input className="fi" value={editItem.detail||''} onChange={e=>setEditItem(p=>({...p,detail:e.target.value}))} />
            </div>
            <div className="field"><label className="flbl">Type</label>
              <select className="fsel" value={editItem.type} onChange={e=>setEditItem(p=>({...p,type:e.target.value}))}>
                <option value="truck">Truck</option>
                <option value="trailer">Trailer</option>
              </select>
            </div>
            <div className="macts">
              <button className="btn bghost" onClick={() => setEditItem(null)}>Cancel</button>
              <button className="btn bprim" style={{flex:2}} onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="mback ctr"><div className="mover" onClick={() => setConfirmDel(null)} />
          <div className="modal">
            <Confirm title="Remove Vehicle?" body={`Remove "${confirmDel.name}"?`} danger onConfirm={handleDel} onCancel={() => setConfirmDel(null)} confirmLabel="Remove" />
          </div>
        </div>
      )}
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

  const moveUp = async (idx) => {
    if (idx === 0) return;
    const updated = [...categories];
    [updated[idx-1], updated[idx]] = [updated[idx], updated[idx-1]];
    // Update sort_order for both in Supabase
    await supabase.from('cf_categories').upsert([
      { name: updated[idx-1], sort_order: idx-1 },
      { name: updated[idx], sort_order: idx },
    ]);
    onUpdate(updated);
  };

  const moveDown = async (idx) => {
    if (idx === categories.length - 1) return;
    const updated = [...categories];
    [updated[idx], updated[idx+1]] = [updated[idx+1], updated[idx]];
    await supabase.from('cf_categories').upsert([
      { name: updated[idx], sort_order: idx },
      { name: updated[idx+1], sort_order: idx+1 },
    ]);
    onUpdate(updated);
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <div className="infobanner">Categories organize gear items and display in this order on load lists. Use ▲▼ to reorder.</div>
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <input className="fi" value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAdd()} placeholder="New category name…" style={{ flex:1 }} />
        <button className="btn bacc bsm" onClick={handleAdd}>+ Add</button>
      </div>
      {categories.map((cat, idx) => (
        <div key={idx} className="mitem" style={{alignItems:'center'}}>
          {/* Order arrows */}
          <div style={{display:'flex',flexDirection:'column',gap:1,marginRight:6,flexShrink:0}}>
            <button
              onClick={() => moveUp(idx)}
              disabled={idx===0}
              style={{background:'none',border:'none',cursor:idx===0?'default':'pointer',color:idx===0?'var(--br2)':'var(--bl)',fontSize:12,lineHeight:1,padding:'1px 4px',fontWeight:700}}>▲</button>
            <button
              onClick={() => moveDown(idx)}
              disabled={idx===categories.length-1}
              style={{background:'none',border:'none',cursor:idx===categories.length-1?'default':'pointer',color:idx===categories.length-1?'var(--br2)':'var(--bl)',fontSize:12,lineHeight:1,padding:'1px 4px',fontWeight:700}}>▼</button>
          </div>
          <span style={{fontSize:11,color:'var(--mu)',fontWeight:700,minWidth:18,textAlign:'right',marginRight:8}}>{idx+1}</span>
          {editIdx === idx ? (
            <>
              <input className="fi" value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleEdit(idx)} style={{ flex:1, marginRight:8 }} autoFocus />
              <button className="btn bok bsm" onClick={() => handleEdit(idx)}>Save</button>
              <button className="btn bghost bsm" onClick={() => setEditIdx(null)}>Cancel</button>
            </>
          ) : (
            <>
              <span className="mname">{cat}</span>
              <button className="btn bghost bsm" onClick={() => { setEditIdx(idx); setEditVal(cat); }}>Edit</button>
              <button className="btn bdng bsm" onClick={() => setConfirmDel(idx)}>✕</button>
            </>
          )}
        </div>
      ))}
      {confirmDel !== null && (
        <div className="mback ctr"><div className="mover" onClick={() => setConfirmDel(null)} />
          <div className="modal">
            <Confirm title="Remove Category?" body={`Remove "${categories[confirmDel]}"?`} danger onConfirm={() => handleDelete(confirmDel)} onCancel={() => setConfirmDel(null)} confirmLabel="Remove" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TASK HELPERS ─────────────────────────────────────────────────────────────
const TASK_STATUS = {
  pending:        { label:'Pending',              color:'#6B7280', bg:'rgba(107,114,128,0.1)'  },
  completed:      { label:'Completed',            color:'#059669', bg:'rgba(5,150,105,0.1)'    },
  needs_support:  { label:'Needs Manager Support',color:'#DC2626', bg:'rgba(220,38,38,0.1)'   },
};

const fmtDate = (d) => d ? new Date(d+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';
const isOverdue = (tl) => {
  if (tl.type === 'nodate' || tl.archived) return false;
  const ref = tl.dateEnd || tl.dateStart;
  if (!ref) return false;
  return new Date(ref+'T23:59:59') < new Date();
};
const isTodayList = (tl) => {
  if (tl.type === 'nodate') return false;
  const today = new Date().toISOString().slice(0,10);
  if (tl.type === 'daily') return tl.dateStart === today;
  if (tl.type === 'weekly') return tl.dateStart <= today && today <= (tl.dateEnd||tl.dateStart);
  return false;
};

// ─── TASK ITEM MODAL ──────────────────────────────────────────────────────────
function TaskItemModal({ item, onSave, onClose, users, isAdmin }) {
  const isEdit = !!item;
  const employees = (users||[]).filter(u => u.active);
  const [name, setName] = useState(item?.name||'');
  const [notes, setNotes] = useState(item?.notes||'');
  const [openToAll, setOpenToAll] = useState(item?.openToAll||false);
  const [assignedTo, setAssignedTo] = useState(item?.assignedTo||[]);
  const [lead, setLead] = useState(item?.lead||'');
  const [confirmSave, setConfirmSave] = useState(false);

  const toggleAssign = (name) => {
    setAssignedTo(prev => prev.includes(name) ? prev.filter(n=>n!==name) : [...prev,name]);
    if (lead === name) setLead('');
  };

  const doSave = () => {
    if (!name.trim()) return;
    const base = isEdit ? {...item} : { id:Math.random().toString(36).slice(2,9), status:'pending', carryoverLog:[], removedAt:null };
    onSave({...base, name:name.trim(), notes, openToAll, assignedTo: openToAll?[]:assignedTo, lead: openToAll?'':lead });
    setConfirmSave(false);
  };

  if (confirmSave) return (
    <div className="mback ctr"><div className="mover" onClick={()=>setConfirmSave(false)} />
      <div className="modal"><Confirm title="Save Changes?" body={`Confirm changes to "${item.name}"?`} onConfirm={doSave} onCancel={()=>setConfirmSave(false)} confirmLabel="Yes, Save" /></div>
    </div>
  );

  return (
    <div className="mback"><div className="mover" onClick={onClose} />
      <div className="modal">
        <div className="mtitle">{isEdit?'✏️ Edit Task':'Add Task'}</div>
        <div className="field"><label className="flbl">Task Name *</label><input className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Restock cable bins" autoFocus /></div>
        <div className="field"><label className="flbl">Notes / Details</label><textarea className="fta" value={notes} onChange={e=>setNotes(e.target.value)} rows={2} /></div>
        <div className="field">
          <label className="flbl">Assignment</label>
          <div style={{background:'var(--s2)',border:'1px solid var(--br)',borderRadius:'var(--r)',padding:'10px 12px',marginBottom:8}}>
            <div className="crew-member" onClick={()=>{setOpenToAll(o=>!o); if(!openToAll){setAssignedTo([]); setLead('');}}}>
              <div className={'crew-cb'+(openToAll?' on':'')}>
                {openToAll&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span className="crew-name" style={{fontWeight:700}}>🌐 Open to All — anyone available</span>
            </div>
          </div>
          {!openToAll && employees.length > 0 && (
            <div style={{background:'var(--s2)',border:'1px solid var(--br)',borderRadius:'var(--r)',padding:'10px 12px'}}>
              {employees.map(u=>(
                <div key={u.id} style={{marginBottom:6}}>
                  <div className="crew-member" onClick={()=>toggleAssign(u.name)}>
                    <div className={'crew-cb'+(assignedTo.includes(u.name)?' on':'')}>
                      {assignedTo.includes(u.name)&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span className="crew-name">{u.name}</span>
                  </div>
                  {assignedTo.includes(u.name) && (
                    <div style={{display:'flex',alignItems:'center',gap:6,paddingLeft:22,marginTop:3}} onClick={()=>setLead(lead===u.name?'':u.name)}>
                      <div style={{width:14,height:14,borderRadius:7,border:`2px solid ${lead===u.name?'#D97706':'var(--br2)'}`,background:lead===u.name?'#D97706':'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                        {lead===u.name&&<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span style={{fontSize:10,color:lead===u.name?'#D97706':'var(--mu)',fontWeight:700}}>⭐ Lead</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="macts">
          <button className="btn bghost" onClick={onClose}>Cancel</button>
          <button className="btn bprim" style={{flex:2}} onClick={()=>isEdit?setConfirmSave(true):doSave()}>{isEdit?'Save Changes':'Add Task'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── TASK LIST FORM ───────────────────────────────────────────────────────────
function TaskListForm({ onSave, onClose, existing, users }) {
  const e = existing||{};
  const templateStr = !existing ? sessionStorage.getItem('cf_template_task') : null;
  const template = templateStr ? JSON.parse(templateStr) : null;
  if (templateStr) sessionStorage.removeItem('cf_template_task');
  const t = template||{};
  const employees = (users||[]).filter(u=>u.active);
  const todayPT = new Date(new Date().toLocaleString('en-US',{timeZone:'America/Los_Angeles'}));
  const todayStr = todayPT.toISOString().slice(0,10);
  const makeDateTitle = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  };
  const [type, setType] = useState(e.type||t.type||'daily');
  const [dateStart, setDateStart] = useState(e.dateStart||todayStr);
  const [customTitle, setCustomTitle] = useState(!!(e.title && !e.title.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/)) || !!(t.title));
  const [title, setTitle] = useState(e.title||(t.title?`${t.title} (Copy)`:makeDateTitle(e.dateStart||todayStr)));
  const [dateEnd, setDateEnd] = useState(e.dateEnd||'');
  const [brief, setBrief] = useState(e.brief||t.brief||'');
  const templateTaskItems = t.items ? t.items.filter(i=>!i.removedAt).map(i=>({...i,id:Math.random().toString(36).slice(2,9),status:'pending',completedBy:'',completedAt:null,needsSupportBy:'',needsSupportAt:null,carryoverLog:[]})) : [];
  const [items, setItems] = useState((e.items||[]).filter(i=>!i.removedAt).length>0 ? (e.items||[]).filter(i=>!i.removedAt) : templateTaskItems);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const handleAddItem = (item) => { setItems(p=>[...p,{...item,addedBy:'admin',addedAt:new Date().toISOString()}]); setShowItemModal(false); };
  const handleEditItem = (item) => { setItems(p=>p.map(i=>i.id===item.id?item:i)); setEditItem(null); };

  const save = () => {
    if (!title.trim()) return;
    onSave({...e, id:e.id||Math.random().toString(36).slice(2,9), title, type,
      dateStart: type==='nodate'?null:dateStart, dateEnd: type==='weekly'?dateEnd:null,
      brief, items:[...items,...(e.items||[]).filter(i=>i.removedAt)],
      archived:e.archived||false, allTasksComplete:e.allTasksComplete||false,
      createdAt:e.createdAt||new Date().toISOString() });
  };

  return (
    <div className="mback"><div className="mover" onClick={onClose}/>
      <div className="modal">
        <div className="mtitle">{existing?'✏️ Edit Task List':template?'⧉ Duplicate Task List':'➕ New Task List'}</div>
        {template && <div className="infobanner" style={{marginBottom:14}}>⧉ Copied from <strong>{template.title}</strong> — update the date before publishing.</div>}
        <div className="field">
          <label className="flbl">Type</label>
          <div style={{display:'flex',gap:8}}>
            {[['daily','📅 Daily'],['weekly','📆 Weekly'],['nodate','🗂 No Date']].map(([v,l])=>(
              <button key={v} className={'btn bsm '+(type===v?'bacc':'bghost')} style={{flex:1}} onClick={()=>setType(v)}>{l}</button>
            ))}
          </div>
        </div>
        {type!=='nodate' && (
          <div className="frow">
            <div className="field">
              <label className="flbl">{type==='weekly'?'Start Date':'Date'}</label>
              <input className="fi" type="date" value={dateStart} onChange={e=>{
                setDateStart(e.target.value);
                if (!customTitle) setTitle(makeDateTitle(e.target.value));
              }} />
            </div>
            {type==='weekly' && <div className="field"><label className="flbl">End Date</label><input className="fi" type="date" value={dateEnd} onChange={e=>setDateEnd(e.target.value)} /></div>}
          </div>
        )}
        <div className="field">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
            <label className="flbl" style={{marginBottom:0}}>Title</label>
            <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}>
              <input type="checkbox" checked={customTitle} onChange={e=>{
                setCustomTitle(e.target.checked);
                if (!e.target.checked) setTitle(makeDateTitle(dateStart));
              }} style={{width:13,height:13}} />
              <span style={{fontSize:10,color:'var(--mu)',fontWeight:700,letterSpacing:.5}}>Custom title</span>
            </label>
          </div>
          {customTitle
            ? <input className="fi" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Monday Warehouse Deep Clean" />
            : <div className="fi" style={{background:'var(--s2)',color:'var(--mu)',cursor:'default'}}>{title||makeDateTitle(dateStart)||'Select a date above'}</div>
          }
        </div>
        <div className="field"><label className="flbl">Admin Brief</label><textarea className="fta" value={brief} onChange={e=>setBrief(e.target.value)} rows={2} placeholder="Notes for the crew..." /></div>
        <div className="field">
          <label className="flbl">Task Items</label>
          <div style={{background:'var(--s2)',border:'1px solid var(--br)',borderRadius:'var(--r)',padding:10,marginBottom:8}}>
            {items.length===0 && <div style={{fontSize:12,color:'var(--mu)',padding:'4px 0'}}>No items yet — add below.</div>}
            {items.map(it=>(
              <div key={it.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',background:'var(--sf)',borderRadius:'var(--r)',marginBottom:5}}>
                <span style={{flex:1,fontSize:13,color:'var(--tx)',fontWeight:600}}>{it.name}</span>
                {it.openToAll && <span style={{fontSize:10,color:'var(--bl)'}}>🌐 Open</span>}
                {!it.openToAll && it.assignedTo?.length>0 && <span style={{fontSize:10,color:'var(--mu)'}}>{it.assignedTo.join(', ')}</span>}
                <button style={{background:'none',border:'none',color:'var(--bl)',fontSize:12,cursor:'pointer',fontWeight:700}} onClick={()=>setEditItem(it)}>Edit</button>
                <button style={{background:'none',border:'none',color:'var(--dn)',fontSize:16,cursor:'pointer'}} onClick={()=>setItems(p=>p.filter(i=>i.id!==it.id))}>×</button>
              </div>
            ))}
          </div>
          <button className="btn bacc bsm" style={{width:'100%'}} onClick={()=>setShowItemModal(true)}>+ Add Task Item</button>
        </div>
        <div className="macts">
          <button className="btn bghost" onClick={onClose}>Cancel</button>
          <button className="btn bprim" style={{flex:2}} onClick={save}>{existing?'Save':'Create'}</button>
        </div>
      </div>
      {showItemModal && <TaskItemModal onSave={handleAddItem} onClose={()=>setShowItemModal(false)} users={users} isAdmin={true} />}
      {editItem && <TaskItemModal item={editItem} onSave={handleEditItem} onClose={()=>setEditItem(null)} users={users} isAdmin={true} />}
    </div>
  );
}

// ─── TASK LIST DETAIL ─────────────────────────────────────────────────────────
function TaskDetail({ taskList, user, onBack, onUpdate, users }) {
  const isAdmin = user.role==='admin';
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showATCConfirm, setShowATCConfirm] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [allTaskLists, setAllTaskLists] = useState([]);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const pt = (msg,type)=>setToast({msg,type});

  useEffect(() => {
    db.getTaskLists().then(lists => setAllTaskLists(lists.filter(l => !l.archived && l.id !== taskList.id)));
  }, [taskList.id]);

  const handleMove = async (item, targetListId) => {
    setSaving(true);
    const targetList = allTaskLists.find(l => l.id === targetListId);
    const newItem = await db.moveTaskItem(item, taskList.id, targetListId);
    await db.addTaskAudit(taskList.id, { type:'rm', itemName:item.name, changes:`Moved to "${targetList?.title||targetListId}"`, by:user.name });
    await db.addTaskAudit(targetListId, { type:'add', itemName:item.name, changes:`Moved from "${taskList.title}"`, by:user.name });
    onUpdate({ ...taskList, items: items.map(i => i.id===item.id ? {...i, removedAt:new Date().toISOString()} : i) });
    setMoveTarget(null);
    setSaving(false);
    pt(`"${item.name}" moved to "${targetList?.title||'list'}"`, 'ok');
  };

  const items = taskList.items||[];
  const active = items.filter(i=>!i.removedAt);
  const allDone = active.length>0 && active.every(i=>i.status==='completed');
  const isATC = taskList.allTasksComplete;
  const isLocked = isATC && !isAdmin;
  const pct = active.length ? Math.round((active.filter(i=>i.status==='completed').length/active.length)*100) : 0;

  const handleStatusSelect = async (status) => {
    const item = statusTarget;
    setSaving(true);
    const now = new Date().toISOString();
    const updatedItem = {...item, status,
      completedBy: status==='completed'?user.name:item.completedBy,
      completedAt: status==='completed'?now:item.completedAt,
      needsSupportBy: status==='needs_support'?user.name:item.needsSupportBy,
      needsSupportAt: status==='needs_support'?now:item.needsSupportAt,
    };
    await db.upsertTaskItem(updatedItem, taskList.id);
    await db.addTaskActivity(taskList.id, taskList.title, {
      action:'task_status', detail:`"${item.name}": ${item.status} → ${status}`, by:user.name, userId:user.id
    });
    onUpdate({...taskList, items:items.map(i=>i.id===item.id?updatedItem:i)});
    setStatusTarget(null); setPendingStatus(null); setSaving(false);
    pt(`${item.name} → ${TASK_STATUS[status].label}`, status==='completed'?'ok':'err');
  };

  const handleAddItem = async (item) => {
    setSaving(true);
    const newItem = {...item, addedBy:user.name, addedAt:new Date().toISOString()};
    await db.upsertTaskItem(newItem, taskList.id);
    await db.addTaskAudit(taskList.id, {type:'add', itemName:item.name, by:user.name});
    onUpdate({...taskList, items:[...items, newItem]});
    setShowAdd(false); setSaving(false);
    pt(`"${item.name}" added`, 'ok');
  };

  const handleEditItem = async (updated) => {
    const orig = editItem;
    const changes = [];
    if (orig.name!==updated.name) changes.push(`name: "${orig.name}"→"${updated.name}"`);
    if (orig.notes!==updated.notes) changes.push('notes updated');
    setSaving(true);
    await db.upsertTaskItem(updated, taskList.id);
    await db.addTaskAudit(taskList.id, {type:'mod', itemName:orig.name, changes:changes.join(', '), by:user.name});
    onUpdate({...taskList, items:items.map(i=>i.id===updated.id?updated:i)});
    setEditItem(null); setSaving(false);
    pt('Task updated','ok');
  };

  const handleRemove = async () => {
    const item = removeTarget;
    setSaving(true);
    const updated = {...item, removedAt:new Date().toISOString()};
    await db.upsertTaskItem(updated, taskList.id);
    await db.addTaskAudit(taskList.id, {type:'rm', itemName:item.name, by:user.name});
    onUpdate({...taskList, items:items.map(i=>i.id===item.id?updated:i)});
    setRemoveTarget(null); setSaving(false);
    pt(`"${item.name}" removed`,'err');
  };

  const handleATC = async () => {
    const updated = {...taskList, allTasksComplete:true, archived:true, archivedAt:new Date().toISOString()};
    await db.upsertTaskList(updated);
    onUpdate(updated);
    setShowATCConfirm(false);
    pt('✅ All Tasks Complete — list archived!','ok');
    setTimeout(onBack, 1200);
  };

  const handleUnlock = async () => {
    const updated = {...taskList, allTasksComplete:false};
    await db.upsertTaskList(updated);
    onUpdate(updated);
    setShowUnlock(false);
    pt('Task list unlocked for editing','ok');
  };

  const exportText = () => {
    const lines = ['CREWFLOW — TASK LIST SNAPSHOT',
      '⚠ SNAPSHOT ONLY — Verify against the live CrewFlow app before use.','',
      `List: ${taskList.title}`, `Type: ${taskList.type}`,
      taskList.dateStart?`Date: ${fmtDate(taskList.dateStart)}${taskList.dateEnd?' – '+fmtDate(taskList.dateEnd):''}`:''
    ];
    if (taskList.brief) lines.push('','Brief: '+taskList.brief);
    lines.push('','TASKS:');
    active.forEach((item,i)=>{
      lines.push(`${i+1}. [${item.status.toUpperCase()}] ${item.name}${item.notes?' — '+item.notes:''}`);
      if (item.carryoverLog?.length) lines.push(`   ↩ Carried over from: ${item.carryoverLog.map(c=>c.date).join(', ')}`);
    });
    lines.push('','Generated: '+new Date().toLocaleString());
    navigator.clipboard.writeText(lines.join('\n')).then(()=>pt('Copied!','ok'));
  };

  const exportPDF = () => {
    const watermark = 'SNAPSHOT ONLY — Verify you are referencing the most current version in the CrewFlow app before use';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>CrewFlow — ${taskList.title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:30px;color:#111;max-width:700px;margin:0 auto}
      h1{font-size:24px;margin-bottom:4px}
      .sub{color:#666;font-size:13px;margin-bottom:16px}
      .meta{background:#f4f4f4;border-radius:6px;padding:10px 14px;margin-bottom:14px;font-size:13px}
      .brief{background:#fffbe6;border-left:3px solid #D97706;padding:10px 14px;margin-bottom:16px;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th{background:#111;color:#fff;padding:8px 10px;font-size:11px;letter-spacing:1px;text-transform:uppercase;text-align:left}
      td{padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;vertical-align:top}
      .status{font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;text-transform:uppercase}
      .pending{background:#ffe5e5;color:#cc0000}
      .completed{background:#e5f7f0;color:#087050}
      .needs_support{background:#ffe5e5;color:#cc0000}
      .carryover{font-size:10px;color:#D97706;margin-top:3px}
      .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:16px;font-weight:900;color:rgba(0,0,0,0.07);text-align:center;white-space:nowrap;pointer-events:none;z-index:1000;width:100%}
    </style></head><body>
    <div class="watermark">${watermark}</div>
    <h1>${taskList.title}</h1>
    <div class="sub">${taskList.type==='daily'?'📅 Daily':taskList.type==='weekly'?'📆 Weekly':'🗂 No Date'}${taskList.dateStart?' · '+fmtDate(taskList.dateStart):''}</div>
    ${taskList.brief?`<div class="brief"><strong>Brief:</strong> ${taskList.brief}</div>`:''}
    <table><thead><tr><th>#</th><th>Task</th><th>Assigned To</th><th>Status</th></tr></thead><tbody>
    ${active.map((item,i)=>`<tr>
      <td>${i+1}</td>
      <td>${item.name}${item.notes?'<br><small style="color:#888">'+item.notes+'</small>':''}${item.carryoverLog?.length?'<div class="carryover">↩ Carried from: '+item.carryoverLog.map(c=>c.date).join(' → ')+'</div>':''}
      </td>
      <td>${item.openToAll?'🌐 Open to all':(item.assignedTo?.length?item.assignedTo.join(', '):'—')}</td>
      <td><span class="status ${item.status||'pending'}">${(item.status||'pending').replace('_',' ').toUpperCase()}</span></td>
    </tr>`).join('')}
    </tbody></table>
    <p style="margin-top:20px;font-size:11px;color:#999">Generated: ${new Date().toLocaleString()} — ⚠ ${watermark}</p>
    </body></html>`;
    const w = window.open('','_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(()=>w.print(), 500);
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)} />}
      {saving && <div style={{position:'fixed',top:52,left:0,right:0,height:2,background:'var(--bl)',zIndex:200}} />}
      <div className="backrow" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        <span>All Tasks</span>
      </div>

      {/* Info block */}
      <div className="dh">
        <div className="dh-always">
          <div style={{flex:1}}>
            <div className="dname">{taskList.title}</div>
            {!infoOpen && taskList.dateStart && <div className="dsub" style={{marginTop:4}}>{fmtDate(taskList.dateStart)}{taskList.dateEnd?' – '+fmtDate(taskList.dateEnd):''}</div>}
          </div>
          <div style={{display:'flex',alignItems:'flex-start',gap:6,flexShrink:0}}>
            <div className="pills" style={{marginBottom:6}}>
              <span className={'ttype-badge ttype-'+taskList.type}>{taskList.type==='daily'?'📅 Daily':taskList.type==='weekly'?'📆 Weekly':'🗂 No Date'}</span>
              {isATC && <span className="pill prtr">✓ Complete</span>}

            </div>
          </div>
        </div>
        <div style={{padding:'4px 16px 8px',display:'flex',justifyContent:'flex-end'}}>
          <button className="dh-collapse-btn" onClick={()=>setInfoOpen(o=>!o)}>{infoOpen?'▲ collapse':'▼ expand'}</button>
        </div>
        {infoOpen && (
          <div className="dh-body">
            {taskList.type!=='nodate' && (
              <div className="dgrid">
                <div className="ichip"><div className="icl">{taskList.type==='weekly'?'Start':'Date'}</div><div className="icv">{fmtDate(taskList.dateStart)}</div></div>
                {taskList.type==='weekly' && <div className="ichip"><div className="icl">End</div><div className="icv">{fmtDate(taskList.dateEnd)}</div></div>}
              </div>
            )}
            {taskList.brief && <div className="brief-inline"><div className="brieft">📋 Admin Brief</div><div className="briefb">{taskList.brief}</div></div>}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="pblock" style={{marginTop:14}}>
        <div className="phd"><span>Progress</span><span style={{color:isATC?'var(--ok)':'var(--bl)'}}>{pct}%</span></div>
        <div className="ptrack"><div className="pfill" style={{width:`${pct}%`,background:isATC?'var(--ok)':'#B45309'}} /></div>
        {isATC ? (
          <div style={{marginTop:8,textAlign:'center',color:'var(--ok)',fontFamily:'var(--fh)',fontSize:15,fontWeight:900,letterSpacing:2}}>✓ ALL TASKS COMPLETE</div>
        ) : (
          <div className="spills">
            {Object.entries(TASK_STATUS).map(([k,v])=>(
              <span key={k} className="spill" style={{color:v.color,borderColor:`${v.color}44`,background:v.bg}}>{active.filter(i=>i.status===k).length} {v.label}</span>
            ))}
          </div>
        )}
      </div>

      {/* ATC button */}
      <div style={{height:6}} />
      {!taskList.archived && !isATC && (
        allDone ? (
          <button className="tatc-btn" onClick={()=>setShowATCConfirm(true)}>✅ Mark All Tasks Complete</button>
        ) : (
          <div className="tatc-locked">🔒 {active.filter(i=>i.status!=='completed').length} task{active.filter(i=>i.status!=='completed').length!==1?'s':''} remaining</div>
        )
      )}
      {isATC && (
        <div className="tatc-banner">
          <span style={{fontSize:22}}>✅</span>
          <div style={{flex:1}}><div style={{fontFamily:'var(--fh)',fontSize:16,fontWeight:900,color:'var(--ok)',letterSpacing:2,textTransform:'uppercase'}}>All Tasks Complete</div></div>
          <button className="edit-event-btn" style={{margin:0}} onClick={()=>setShowUnlock(true)}>Edit List</button>
        </div>
      )}

      {/* Task items */}
      {!isLocked && !taskList.archived && (
        <div className="shd" style={{marginBottom:14,marginTop:8}}>
          <span className="slbl">Tasks ({active.length})</span>
          <button className="btn" style={{background:'var(--bl)',color:'#fff',padding:'8px 16px',fontSize:13,fontWeight:800,borderRadius:'var(--r)'}} onClick={()=>setShowAdd(true)}>+ Add Task</button>
        </div>
      )}

      {active.length===0 && <div className="empty"><div className="eico">📋</div><div className="etxt">No tasks yet.</div></div>}

      <div style={{height:4}} />
      {active.map(item=>{
        const sc = TASK_STATUS[item.status||'pending'];
        return (
          <div key={item.id} className={'titem'+(item.status==='completed'?' done':'')+(item.status==='needs_support'?' needs':'')}>
            <div className={'tchk '+item.status}
              onClick={()=>{ if(!isLocked&&!taskList.archived){ setStatusTarget(item); setPendingStatus(null); }}}>
              {item.status==='completed' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              {item.status==='needs_support' && <span style={{fontSize:12}}>🔴</span>}
            </div>
            <div className="tmain">
              <div className="tname" style={{textDecoration:item.status==='completed'?'line-through':'none'}}>{item.name}</div>
              {item.notes && <div className="tnotes">{item.notes}</div>}
              {item.openToAll && <div className="tassign">🌐 Open to all</div>}
              {!item.openToAll && item.assignedTo?.length>0 && (
                <div className="tassign">
                  👤 {item.assignedTo.join(', ')}
                  {item.lead && <span style={{color:'#D97706',marginLeft:6}}>⭐ Lead: {item.lead}</span>}
                </div>
              )}
              {item.completedBy && item.status==='completed' && <div className="iby">✓ {item.completedBy} · {item.completedAt?new Date(item.completedAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):''}</div>}
              {item.needsSupportBy && item.status==='needs_support' && <div style={{fontSize:10,color:'var(--dn)',fontStyle:'italic',marginTop:3}}>🔴 Flagged by {item.needsSupportBy}</div>}
              {item.carryoverLog?.length>0 && (
                <div className="tcarryover">
                  ↩ Carried over from: {item.carryoverLog.map(c=>`${c.date}${c.fromTitle?' ('+c.fromTitle+')':''}`).join(' → ')}
                </div>
              )}
            </div>
            <div className="tright">
              <span className="tbadge" style={{color:sc.color,borderColor:`${sc.color}44`,background:sc.bg}}>{sc.label}</span>
              {!isLocked && !taskList.archived && (
                <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'flex-end'}}>
                  <button className="btn bghost bsm" onClick={()=>setEditItem(item)}>Edit</button>
                  {isAdmin && <button className="btn bghost bsm" style={{color:'var(--bl)',borderColor:'var(--bl)'}} onClick={()=>setMoveTarget(item)}>↗ Move</button>}
                  {isAdmin && <button className="btn bdng bsm" onClick={()=>setRemoveTarget(item)}>✕</button>}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Divider + Notes section */}
      <div style={{borderTop:'2px solid var(--br)',margin:'22px 0 0'}} />
      <NotesSection refId={taskList.id} refType="task" user={user} />

      {/* Export */}
      <div className="export-row" style={{marginTop:18}}>
        <button className="export-btn" onClick={exportPDF}><span className="export-ico">📄</span>PDF</button>
        <button className="export-btn" onClick={exportText}><span className="export-ico">📋</span>Copy Text</button>
      </div>

      {/* Audit log */}
      {(taskList.auditLog||[]).length>0 && (
        <div className="auditsec">
          <div className="audit-hdr" onClick={()=>setAuditOpen(o=>!o)}>
            <div className="auditt">⚠ Audit Log <span style={{fontSize:10,color:'var(--mu)'}}>({(taskList.auditLog||[]).length} entries)</span></div>
            <span style={{fontSize:11,color:'var(--mu)',fontWeight:700}}>{auditOpen?'▲':'▼'}</span>
          </div>
          {auditOpen && (
            <div className="audit-body">
              {(taskList.auditLog||[]).map((l,i)=>(
                <div key={i} className={'aurow '+(l.type==='rm'?'rm':l.type==='add'?'add':'mod')}>
                  <div className="auitem">{l.type==='rm'?'🗑':l.type==='add'?'✚':'✏'} {l.itemName}{l.changes?' — '+l.changes:''}</div>
                  <div className="aumeta">by {l.by} · {l.at?new Date(l.at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="spacer" />

      {/* Status selection */}
      {statusTarget && !pendingStatus && (
        <>
          <div className="sback" onClick={()=>setStatusTarget(null)} />
          <div className="sheet">
            <div className="stitle">Update — {statusTarget.name}</div>
            {Object.entries(TASK_STATUS).map(([s,sc])=>(
              <div key={s} className="sopt" onClick={()=>setPendingStatus(s)}>
                <div className="sdot" style={{background:sc.color}} />
                <span className="solbl" style={{color:sc.color}}>{sc.label}</span>
                {statusTarget.status===s && <span className="scur">current</span>}
              </div>
            ))}
            <button className="btn bghost" style={{width:'100%',marginTop:6}} onClick={()=>setStatusTarget(null)}>Cancel</button>
          </div>
        </>
      )}
      {statusTarget && pendingStatus && (
        <>
          <div className="sback" onClick={()=>{setStatusTarget(null);setPendingStatus(null);}} />
          <div className="sheet">
            <div className="stitle">Confirm</div>
            <div className="cdlg" style={{marginBottom:14}}>
              <div className="ct" style={{color:TASK_STATUS[pendingStatus].color}}>Confirm: {TASK_STATUS[pendingStatus].label}</div>
              <div className="cb">Set <strong>{statusTarget.name}</strong> to <strong style={{color:TASK_STATUS[pendingStatus].color}}>{TASK_STATUS[pendingStatus].label}</strong>?</div>
              <div className="cbtns">
                <button className="btn bghost bsm" onClick={()=>setPendingStatus(null)}>Back</button>
                <button className="btn bacc bsm" onClick={()=>handleStatusSelect(pendingStatus)}>Confirm</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Move to list modal */}
      {moveTarget && (
        <div className="mback ctr"><div className="mover" onClick={()=>setMoveTarget(null)} />
          <div className="modal">
            <div className="mtitle">↗ Move Task</div>
            <p style={{fontSize:13,color:'var(--mu)',marginBottom:16}}>Move <strong style={{color:'var(--tx)'}}>{moveTarget.name}</strong> to which list?</p>
            {allTaskLists.length === 0 && <div style={{fontSize:13,color:'var(--mu)',textAlign:'center',padding:16}}>No other active task lists available.</div>}
            {allTaskLists.map(tl => (
              <div key={tl.id} className="sopt" style={{marginBottom:8,cursor:'pointer'}} onClick={()=>handleMove(moveTarget, tl.id)}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--tx)'}}>{tl.title}</div>
                  <div style={{fontSize:11,color:'var(--mu)',marginTop:2}}>
                    {tl.type==='daily'?'📅 Daily':tl.type==='weekly'?'📆 Weekly':'🗂 No Date'}
                    {tl.dateStart?' · '+fmtDate(tl.dateStart):''}
                    {' · '}{(tl.items||[]).filter(i=>!i.removedAt).length} tasks
                  </div>
                </div>
                <span style={{color:'var(--bl)',fontSize:18}}>›</span>
              </div>
            ))}
            <button className="btn bghost" style={{width:'100%',marginTop:8}} onClick={()=>setMoveTarget(null)}>Cancel</button>
          </div>
        </div>
      )}

      {removeTarget && (
        <div className="mback ctr"><div className="mover" onClick={()=>setRemoveTarget(null)} />
          <div className="modal"><Confirm title="Remove Task?" body={`Remove "${removeTarget.name}"? This will be logged.`} danger onConfirm={handleRemove} onCancel={()=>setRemoveTarget(null)} confirmLabel="Yes, Remove" /></div>
        </div>
      )}
      {showATCConfirm && (
        <div className="mback ctr"><div className="mover" onClick={()=>setShowATCConfirm(false)} />
          <div className="modal">
            <div className="mtitle" style={{color:'var(--ok)'}}>✅ All Tasks Complete?</div>
            <div style={{background:'var(--ok2)',border:'2px solid var(--ok)',borderRadius:'var(--rl)',padding:16,marginBottom:16}}>
              <div style={{fontFamily:'var(--fh)',fontSize:15,fontWeight:800,color:'var(--ok)',marginBottom:6,letterSpacing:1}}>⚠ VERIFY BEFORE CONFIRMING</div>
              <div style={{fontSize:13,color:'var(--tx)',lineHeight:1.6}}>Confirming will mark this list as <strong>All Tasks Complete</strong> and archive it immediately. Make sure every task is genuinely done.</div>
            </div>
            <div className="macts">
              <button className="btn bghost" onClick={()=>setShowATCConfirm(false)}>Go Back</button>
              <button className="btn bprim" style={{flex:2,background:'var(--ok)'}} onClick={handleATC}>✓ Confirm Complete</button>
            </div>
          </div>
        </div>
      )}
      {showUnlock && (
        <div className="mback ctr"><div className="mover" onClick={()=>setShowUnlock(false)} />
          <div className="modal">
            <Confirm title="Edit This List?" body="Editing will remove the All Tasks Complete status. You'll need to resubmit when done." danger onConfirm={handleUnlock} onCancel={()=>setShowUnlock(false)} confirmLabel="Yes, Unlock & Edit" />
          </div>
        </div>
      )}
      {showAdd && <TaskItemModal onSave={handleAddItem} onClose={()=>setShowAdd(false)} users={users} isAdmin={isAdmin} />}
      {editItem && <TaskItemModal item={editItem} onSave={handleEditItem} onClose={()=>setEditItem(null)} users={users} isAdmin={isAdmin} />}
    </div>
  );
}

// ─── TASK LIST VIEW ───────────────────────────────────────────────────────────
function TaskListView({ taskLists, user, onSelect, onCreateNew, onUpdate, onDuplicate, onDeleteList }) {
  const [tab, setTab] = useState('active');
  const [confirmArchive, setConfirmArchive] = useState(null);
  const [confirmUnarchive, setConfirmUnarchive] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const isAdmin = user.role==='admin';
  const pt = (msg, type) => setToast({ msg, type });

  const handleArchive = async (tl) => {
    const updated = { ...tl, archived:true, archivedAt:nowISO() };
    await db.upsertTaskList(updated);
    onUpdate(updated);
    setConfirmArchive(null);
    pt(`"${tl.title}" archived`, 'ok');
  };

  const handleUnarchive = async (tl) => {
    await db.unarchiveTaskList(tl.id);
    const updated = { ...tl, archived:false, archivedAt:null, allTasksComplete:false };
    onUpdate(updated);
    setConfirmUnarchive(null);
    pt(`"${tl.title}" reinstated`, 'ok');
  };

  const handleDelete = async (tl) => {
    await supabase.from('cf_task_items').delete().eq('list_id', tl.id);
    await supabase.from('cf_task_audit').delete().eq('list_id', tl.id);
    await supabase.from('cf_task_lists').delete().eq('id', tl.id);
    onDeleteList(tl.id);
    setConfirmDelete(null);
    pt(`"${tl.title}" permanently deleted`, 'err');
  };

  // Midnight carryover — Pacific Standard Time (UTC-8), runs once on mount
  useEffect(()=>{
    const checkCarryover = async () => {
      // Get today's date in Pacific time
      const nowPT = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      const todayPT = nowPT.toISOString().slice(0,10);

      const toCarry = taskLists.filter(tl =>
        !tl.archived && tl.type!=='nodate' && !tl.allTasksComplete &&
        (tl.dateEnd||tl.dateStart) < todayPT
      );

      if (toCarry.length === 0) return;

      // Find or create today's list ONCE (prevents duplication)
      let todayList = taskLists.find(t => t.type==='daily' && t.dateStart===todayPT && !t.archived);
      let todayListCreated = false;

      if (!todayList) {
        const todayDateObj = new Date(nowPT);
        const dayName = todayDateObj.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric', timeZone:'America/Los_Angeles' });
        todayList = {
          id: Math.random().toString(36).slice(2,9),
          title: dayName,
          type: 'daily', dateStart: todayPT, dateEnd: null,
          brief: 'Auto-generated from carryover.',
          archived: false, allTasksComplete: false, items: [], auditLog: [],
          createdAt: new Date().toISOString(),
        };
        await db.upsertTaskList(todayList);
        todayListCreated = true;
      }

      // Track which item IDs have already been carried to prevent duplicates
      const existingNames = new Set((todayList.items||[]).map(i => i.name + '|' + (i.carryoverLog||[]).length));

      for (const tl of toCarry) {
        const incomplete = (tl.items||[]).filter(i => !i.removedAt && i.status!=='completed');
        if (incomplete.length === 0) continue;

        for (const item of incomplete) {
          // Deduplicate — skip if same item already carried to today
          const key = item.name + '|' + ((item.carryoverLog||[]).length + 1);
          if (existingNames.has(key)) continue;
          existingNames.add(key);

          const carried = {
            ...item,
            id: Math.random().toString(36).slice(2,9),
            status: 'pending', completedBy: '', completedAt: null,
            needsSupportBy: '', needsSupportAt: null,
            assignedTo: item.assignedTo || [], // preserve original assignment
            carryoverLog: [...(item.carryoverLog||[]), { date: tl.dateStart||tl.title, fromTitle: tl.title }],
          };
          await db.upsertTaskItem(carried, todayList.id);
          todayList = { ...todayList, items: [...(todayList.items||[]), carried] };
        }

        // Archive the original list
        const archived = { ...tl, archived:true, archivedAt: new Date().toISOString() };
        await db.upsertTaskList(archived);
        onUpdate(archived);
      }
    };
    checkCarryover();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sort = (arr) => [...arr].sort((a,b)=>{
    if (a.type==='nodate') return 1;
    if (b.type==='nodate') return -1;
    const da = a.dateStart||'';
    const db2 = b.dateStart||'';
    return da < db2 ? -1 : da > db2 ? 1 : 0;
  });

  const active = sort(taskLists.filter(tl=>!tl.archived));
  const archived = sort(taskLists.filter(tl=>tl.archived));
  const visible = tab==='active' ? active : archived;

  // Manager support queue
  const msSupportItems = taskLists.filter(tl=>!tl.archived).flatMap(tl=>
    (tl.items||[]).filter(i=>!i.removedAt&&i.status==='needs_support').map(i=>({...i,listTitle:tl.title,listId:tl.id}))
  );

  return (
    <div>
      {isAdmin && msSupportItems.length>0 && (
        <div style={{background:'var(--dn2)',border:'2px solid var(--dn)',borderRadius:'var(--rl)',padding:'12px 14px',marginBottom:14}}>
          <div style={{fontFamily:'var(--fh)',fontSize:13,fontWeight:800,color:'var(--dn)',letterSpacing:1,textTransform:'uppercase',marginBottom:8}}>🔴 Needs Manager Support ({msSupportItems.length})</div>
          {msSupportItems.map(item=>(
            <div key={item.id} className="msq-item">
              <div className="msq-title">{item.name}</div>
              <div className="msq-meta">From: {item.listTitle} · Flagged by {item.needsSupportBy} · {item.needsSupportAt?new Date(item.needsSupportAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}):''}</div>
            </div>
          ))}
        </div>
      )}

      <div className="tabrow">
        <button className={'btn bsm '+(tab==='active'?'bacc':'bghost')} onClick={()=>setTab('active')}>Active ({active.length})</button>
        <button className={'btn bsm '+(tab==='archived'?'bacc':'bghost')} onClick={()=>setTab('archived')}>Archived ({archived.length})</button>
      </div>

      {visible.length===0 && <div className="empty"><div className="eico">📋</div><div className="etxt">{tab==='active'?'No active task lists.':'No archived task lists.'}</div></div>}

      {visible.map(tl=>{
        const activeItems = (tl.items||[]).filter(i=>!i.removedAt);
        const done = activeItems.filter(i=>i.status==='completed').length;
        const pct = activeItems.length?Math.round((done/activeItems.length)*100):0;
        const overdue = isOverdue(tl);
        const isATC = tl.allTasksComplete;
        const today = isTodayList(tl);
        return (
          <div key={tl.id} className={'tcard'+(tl.archived?' arc':'')+(isATC?' atc':'')+(overdue&&!tl.archived?' overdue':'')+(tl.type==='nodate'?' nodate':'')} onClick={()=>onSelect(tl)}>
            <div className="thd">
              <div style={{flex:1}}>
                <div className="ttitle">{tl.title}</div>
                {today && <div style={{fontSize:10,fontWeight:800,color:'var(--bl)',letterSpacing:1,marginTop:3}}>📅 TODAY</div>}
                {overdue && <div style={{fontSize:10,fontWeight:800,color:'var(--dn)',letterSpacing:1,marginTop:3}}>⚠ OVERDUE</div>}
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
                <span className={'ttype-badge ttype-'+tl.type}>{tl.type==='daily'?'📅 Daily':tl.type==='weekly'?'📆 Weekly':'🗂 No Date'}</span>
                {isATC && <span className="pill prtr" style={{fontSize:9}}>✓ Complete</span>}
                {isAdmin && (
                  <div style={{display:'flex',gap:4}} onClick={e=>e.stopPropagation()}>
                    <button className="btn bghost bsm" style={{fontSize:10}} onClick={()=>onDuplicate(tl)}>⧉ Copy</button>
                    {tl.archived
                      ? <button className="btn bok bsm" style={{fontSize:10}} onClick={()=>setConfirmUnarchive(tl)}>↩ Reinstate</button>
                      : <button className="btn bghost bsm" style={{fontSize:10}} onClick={()=>setConfirmArchive(tl)}>Archive</button>
                    }
                    <button className="btn bdng bsm" style={{fontSize:10}} onClick={()=>setConfirmDelete(tl)}>🗑</button>
                  </div>
                )}
              </div>
            </div>
            <div className="tmeta">
              {tl.type!=='nodate' && tl.dateStart && <span className="tmchip">📅 {fmtDate(tl.dateStart)}{tl.dateEnd?' – '+fmtDate(tl.dateEnd):''}</span>}
              <span className="tmchip">{activeItems.length} tasks</span>
              {msSupportItems.filter(i=>i.listId===tl.id).length>0 && <span className="tmchip" style={{color:'var(--dn)',borderColor:'var(--dn)'}}>🔴 {msSupportItems.filter(i=>i.listId===tl.id).length} needs support</span>}
            </div>
            <div className="tprog">
              <div className="ptrack"><div className="pfill" style={{width:`${pct}%`,background:isATC?'var(--ok)':'#B45309'}} /></div>
              <div className={'plbls'+(isATC?' rtr':'')}>
                <span>{activeItems.length} tasks</span>
                <span>{isATC?'✓ COMPLETE':`${pct}% done`}</span>
              </div>
            </div>
          </div>
        );
      })}
      {isAdmin && tab==='active' && <button className="fab" onClick={onCreateNew}>＋</button>}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      {confirmArchive && (
        <div className="mback ctr"><div className="mover" onClick={() => setConfirmArchive(null)} />
          <div className="modal">
            <Confirm title="Archive Task List?" body={`Archive "${confirmArchive.title}"? It will move to Archived and can be reinstated at any time.`}
              onConfirm={() => handleArchive(confirmArchive)} onCancel={() => setConfirmArchive(null)} confirmLabel="Archive" />
          </div>
        </div>
      )}
      {confirmUnarchive && (
        <div className="mback ctr"><div className="mover" onClick={() => setConfirmUnarchive(null)} />
          <div className="modal">
            <Confirm title="Reinstate Task List?" body={`Reinstate "${confirmUnarchive.title}"? It will move back to Active lists.`}
              onConfirm={() => handleUnarchive(confirmUnarchive)} onCancel={() => setConfirmUnarchive(null)} confirmLabel="Reinstate" />
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="mback ctr"><div className="mover" onClick={() => setConfirmDelete(null)} />
          <div className="modal">
            <Confirm title="Permanently Delete?" body={`Delete "${confirmDelete.title}" and all its tasks forever? This cannot be undone.`}
              danger onConfirm={() => handleDelete(confirmDelete)} onCancel={() => setConfirmDelete(null)} confirmLabel="Yes, Delete Permanently" />
          </div>
        </div>
      )}
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
  const [adminMode, setAdminMode] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');

  const ADMIN_PIN = '052390';
  const employees = users.filter(u => u.active !== false && u.role === 'employee');
  const adminUser = users.find(u => u.role === 'admin');

  const handlePad = (v) => {
    if (v === 'back') { setPin(p => p.slice(0,-1)); setError(''); return; }
    if (pin.length < 4) {
      const next = pin + v;
      setPin(next);
      if (next.length === 4) {
        const u = employees.find(u => u.id === userId && u.pin === next);
        if (!u) { setError('Incorrect PIN. Try again.'); setTimeout(() => setPin(''), 300); return; }
        setPendingUser(u); setStage('confirm');
      }
    }
  };

  const handleAdminPad = (v) => {
    if (v === 'back') { setAdminPin(p => p.slice(0,-1)); setAdminError(''); return; }
    if (adminPin.length < 6) {
      const next = adminPin + v;
      setAdminPin(next);
      if (next.length === 6) {
        if (next !== ADMIN_PIN) { setAdminError('Incorrect PIN.'); setTimeout(() => setAdminPin(''), 300); return; }
        if (adminUser) {
          setPendingUser(adminUser); setStage('adminconfirm');
        }
      }
    }
  };

  if (adminMode) return (
    <div className="login">
      <img src="/CrewFlowLogo.png" alt="CrewFlow" style={{width:'100%',maxWidth:380,marginBottom:28,objectFit:'contain'}} />
      <div className="l-card">
        {stage === 'adminconfirm' && pendingUser ? (
          <div className="l-confirm">
            <div className="lc-title">⚡ Admin Login</div>
            <div className="lc-body">Signing in as <strong>Admin</strong>.<br />Full access will be granted.</div>
            <div className="lc-btns">
              <button className="btn bghost" onClick={() => { setStage('select'); setAdminPin(''); setPendingUser(null); }}>Back</button>
              <button className="btn bprim" onClick={() => onLogin(pendingUser)}>Enter Admin</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{fontFamily:'var(--fh)',fontSize:13,fontWeight:800,letterSpacing:2,color:'var(--mu)',textTransform:'uppercase',marginBottom:14,textAlign:'center'}}>Admin Access</div>
            <div className="field">
              <label className="flbl">Enter Admin PIN</label>
              <div className="pdots">
                {[0,1,2,3,4,5].map(i => <div key={i} className={'pdot'+(i<adminPin.length?' on':'')} style={{height:38}}>{i<adminPin.length?'●':''}</div>)}
              </div>
            </div>
            <div className="pgrid">
              {['1','2','3','4','5','6','7','8','9','⌫','0','→'].map((k,i) => (
                <button key={i} className={'pkey'+(k==='→'?' go':'')} style={k==='→'?{opacity:.35,cursor:'default'}:{}}
                  onClick={() => k==='⌫'?handleAdminPad('back'):k!=='→'?handleAdminPad(k):null}>{k}</button>
              ))}
            </div>
            <div className="l-err">{adminError}</div>
            <button onClick={() => { setAdminMode(false); setAdminPin(''); setAdminError(''); setStage('select'); }}
              style={{background:'none',border:'none',color:'var(--mu)',fontSize:12,cursor:'pointer',width:'100%',textAlign:'center',marginTop:10}}>
              ← Back to crew login
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="login">
      <img src="/CrewFlowLogo.png" alt="CrewFlow" style={{width:'100%',maxWidth:380,marginBottom:28,objectFit:'contain'}} />
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
                {employees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
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
                    <button key={i} className={'pkey'+(k==='→'?' go':'')} style={k==='→'?{opacity:.35,cursor:'default'}:{}}
                      onClick={() => k==='⌫'?handlePad('back'):k!=='→'?handlePad(k):null}>{k}</button>
                  ))}
                </div>
                <div className="l-err">{error}</div>
              </>
            )}
            <div style={{textAlign:'center',marginTop:16}}>
              <button onClick={() => { setAdminMode(true); setStage('select'); }}
                style={{background:'none',border:'none',color:'var(--mu)',fontSize:11,cursor:'pointer',textDecoration:'underline',opacity:.6}}>
                Admin Login
              </button>
            </div>
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
  const [taskLists, setTaskLists] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [evs, us, mi, fl, cats, tls] = await Promise.all([
          db.getEvents(), db.getUsers(), db.getMasterItems(), db.getFleet(), db.getCategories(), db.getTaskLists()
        ]);
        setEvents(evs);
        setUsers(us.map(u => ({ id:u.id, name:u.name, pin:u.pin, role:u.role, email:u.email||'', active:u.active, deactivatedAt:u.deactivated_at, createdAt:u.created_at })));
        setMasterItems(mi);
        setFleet(fl);
        setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
        setTaskLists(tls||[]);
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

  const handleLogin = async (u) => {
    // Log first, then set user
    try {
      await db.addLoginLog({ id:uid(), userId:u.id, userName:u.name, role:u.role, at:nowISO() });
    } catch(e) { console.warn('Login log failed:', e); }
    setUser(u);
  };

  if (!user) return (
    <>
      <style>{CSS}</style>
      <Login onLogin={handleLogin} users={users} />
    </>
  );

  const isAdmin = user.role === 'admin';
  const ATABS = ['Events','Tasks','Activity Log','Team','Gear','Fleet'];

  return (
    <CatContext.Provider value={categories}>
      <div className="app">
        {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        <div className="hdr">
          <div className="brand"><img src="/CrewFlowLogo.png" alt="CrewFlow" style={{ height:32, objectFit:"contain" }} /></div>
          <div className="hdr-r">
            <div className="uchip"><div className="uav">{user.name[0]}</div><span className="uname">{user.name}</span>{isAdmin&&<span className="abadge">Admin</span>}</div>
            <button className="signout" onClick={() => { setUser(null); setSelectedEvent(null); setSelectedTask(null); setAdminTab('Events'); }}>Sign Out</button>
          </div>
        </div>
        {!selectedEvent && (
          <div className="nav">
            {isAdmin ? ATABS.map(t => <button key={t} className={'ntab'+(adminTab===t?' on':'')} onClick={() => setAdminTab(t)}>{t}</button>) : (['Events','Tasks'].map(t=><button key={t} className={'ntab'+(adminTab===t?' on':'')} onClick={()=>setAdminTab(t)}>{t}</button>))}
          </div>
        )}
        <div className="main">
          {selectedEvent ? (
            <EventDetail event={selectedEvent} user={user} onBack={() => setSelectedEvent(null)} onUpdate={handleUpdateEvent} masterItems={masterItems} fleet={fleet} users={users} />
          ) : !isAdmin && adminTab === 'Tasks' ? (
            selectedTask ? (
              <TaskDetail taskList={selectedTask} user={user} onBack={()=>setSelectedTask(null)} onUpdate={(tl)=>{ setTaskLists(prev=>prev.map(t=>t.id===tl.id?tl:t)); setSelectedTask(tl); }} users={users} />
            ) : (
              <TaskListView taskLists={taskLists} user={user} onSelect={setSelectedTask} onCreateNew={()=>setShowCreateTask(true)} onUpdate={(tl)=>setTaskLists(prev=>prev.map(t=>t.id===tl.id?tl:t))} onDuplicate={(tl)=>{ setShowCreateTask(true); sessionStorage.setItem('cf_template_task', JSON.stringify(tl)); }} onDeleteList={(id)=>setTaskLists(prev=>prev.filter(t=>t.id!==id))} />
            )
          ) : !isAdmin ? (
            <EventList events={events} user={user} onSelect={setSelectedEvent} onCreateNew={() => setShowCreate(true)} onUpdate={ev=>setEvents(prev=>prev.map(e=>e.id===ev.id?ev:e))} onDuplicate={ev=>{setShowCreate(true); sessionStorage.setItem('cf_template_event', JSON.stringify(ev));}} />
          ) : adminTab === 'Events' ? (
            <EventList events={events} user={user} onSelect={setSelectedEvent} onCreateNew={() => setShowCreate(true)} onUpdate={ev=>setEvents(prev=>prev.map(e=>e.id===ev.id?ev:e))} onDuplicate={ev=>{setShowCreate(true); sessionStorage.setItem('cf_template_event', JSON.stringify(ev));}} />
          ) : adminTab === 'Tasks' ? (
            selectedTask ? (
              <TaskDetail taskList={selectedTask} user={user} onBack={()=>setSelectedTask(null)} onUpdate={(tl)=>{ setTaskLists(prev=>prev.map(t=>t.id===tl.id?tl:t)); setSelectedTask(tl); }} users={users} />
            ) : (
              <TaskListView taskLists={taskLists} user={user} onSelect={setSelectedTask} onCreateNew={()=>setShowCreateTask(true)} onUpdate={(tl)=>setTaskLists(prev=>prev.map(t=>t.id===tl.id?tl:t))} onDuplicate={(tl)=>{ setShowCreateTask(true); sessionStorage.setItem('cf_template_task', JSON.stringify(tl)); }} onDeleteList={(id)=>setTaskLists(prev=>prev.filter(t=>t.id!==id))} />
            )
          ) : adminTab === 'Activity Log' ? (
            <ActivityLog users={users} events={events} />
          ) : adminTab === 'Team' ? (
            <UserManager users={users} onUpdate={setUsers} />
          ) : adminTab === 'Gear' ? (
            <GearTab masterItems={masterItems} onUpdateMaster={setMasterItems} categories={categories} onUpdateCategories={setCategories} />
          ) : adminTab === 'Fleet' ? (
            <FleetLibrary fleet={fleet} onUpdate={setFleet} />
          ) : null}
        </div>
        {showCreate && <EventForm masterItems={masterItems} users={users} onSave={handleCreateEvent} onClose={() => setShowCreate(false)} />}
        {showCreateTask && <TaskListForm users={users} onSave={async (tl)=>{ await db.upsertTaskList(tl); for(const item of tl.items||[]){ await db.upsertTaskItem(item,tl.id); } setTaskLists(prev=>[tl,...prev.filter(t=>t.id!==tl.id)]); setShowCreateTask(false); }} onClose={()=>setShowCreateTask(false)} />}
      </div>
    </CatContext.Provider>
  );
}
