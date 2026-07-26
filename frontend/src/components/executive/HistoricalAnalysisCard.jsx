import React from "react";
import { FiActivity, FiTrendingUp, FiTrendingDown, FiMinus } from "react-icons/fi";
import "./HistoricalAnalysisCard.css";

const average=(a)=>{const n=a.map(v=>Number(v.value)).filter(Number.isFinite);return n.length?n.reduce((x,y)=>x+y,0)/n.length:null;};
const vol=(a)=>{const n=a.map(v=>Number(v.value)).filter(Number.isFinite);if(n.length<2)return"Low";const m=average(a);const sd=Math.sqrt(n.reduce((s,v)=>s+(v-m)**2,0)/n.length);const cv=sd/Math.max(Math.abs(m),1)*100;return cv>15?"High":cv>7?"Medium":"Low";};

export default function HistoricalAnalysisCard({dailyValues=[],currentValue,previousValue,unit="",title="Historical Analysis"}){
 const avg=average(dailyValues);
 const cur=Number(currentValue), prev=Number(previousValue);
 let label="Stable",Icon=FiMinus;
 if(Number.isFinite(cur)&&Number.isFinite(prev)){if(cur>prev){label="Improving";Icon=FiTrendingUp;}else if(cur<prev){label="Declining";Icon=FiTrendingDown;}}
 const change=(Number.isFinite(cur)&&Number.isFinite(prev))?(cur-prev):null;
 return (
<section className="historical-analysis-card">
<div className="historical-header"><div className="historical-title"><FiActivity/><h3>{title}</h3></div></div>
<div className="historical-grid">
<div className="metric"><span>Trend</span><strong><Icon/> {label}</strong></div>
<div className="metric"><span>Rolling Avg</span><strong>{avg!==null?avg.toFixed(1):"—"} {unit}</strong></div>
<div className="metric"><span>Volatility</span><strong>{vol(dailyValues)}</strong></div>
<div className="metric"><span>Previous</span><strong>{previousValue??"—"} {unit}</strong></div>
<div className="metric"><span>Change</span><strong>{change!==null?change.toFixed(1):"—"} {unit}</strong></div>
</div>
<div className="historical-summary">
<h4>AI Trend Summary</h4>
<p>Overall trend is <b>{label}</b>. Rolling average is <b>{avg!==null?avg.toFixed(1):"—"} {unit}</b> with <b>{vol(dailyValues)}</b> volatility.</p>
</div>
</section>);
}
