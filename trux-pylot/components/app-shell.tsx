import Link from 'next/link';
import { Role } from '@prisma/client';

const nav: Record<Role, {label:string; href:string}[]> = {
  CUSTOMER:[{label:'Overview',href:'/dashboard/customer'},{label:'My requests',href:'/dashboard/customer#jobs'},{label:'Find professionals',href:'/marketplace'}],
  PROFESSIONAL:[{label:'Overview',href:'/dashboard/professional'},{label:'My jobs',href:'/dashboard/professional#jobs'},{label:'Profile & verification',href:'/dashboard/professional#profile'}],
  ADMIN:[{label:'Overview',href:'/dashboard/admin'},{label:'Verifications',href:'/dashboard/admin/verifications'},{label:'Jobs',href:'/dashboard/admin#jobs'}]
};
export function AppShell({role,name,children}:{role:Role;name:string;children:React.ReactNode}){return <div className="app-shell"><aside className="sidebar"><Link className="dash-brand" href="/"><img src="/trux-pylot-logo.png" alt="Trux Pylot"/></Link><p className="nav-title">WORKSPACE</p><nav>{nav[role].map((item,index)=><Link className={index===0?'active':''} key={item.href} href={item.href}><span>{['⌂','▣','◎'][index]}</span>{item.label}</Link>)}</nav><div className="support-card"><span>◌</span><b>Need assistance?</b><p>Our support team is here to help.</p><a href="mailto:info@truxpylot.co">Contact support →</a></div></aside><section className="dashboard-content"><header className="dash-header"><div className="mobile-brand">TRUX PYLOT</div><div className="header-right"><button className="notification" aria-label="Notifications">♧<i></i></button><div className="user-chip"><span>{name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span><div><b>{name}</b><small>{role.toLowerCase()}</small></div></div></div></header>{children}</section></div>}
