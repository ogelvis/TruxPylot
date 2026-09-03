import Link from 'next/link';
import { Role } from '@prisma/client';

const nav: Record<Role, {label:string; href:string; icon:string}[]> = {
  CUSTOMER:[
    {label:'Overview',href:'/dashboard/customer',icon:'⌂'},
    {label:'My requests',href:'/dashboard/customer/jobs',icon:'▣'},
    {label:'Find a professional',href:'/marketplace',icon:'◎'},
    {label:'Manage profile',href:'/dashboard/customer/profile',icon:'◈'},
    {label:'Settings',href:'/dashboard/customer/settings',icon:'⚙'},
  ],
  PROFESSIONAL:[
    {label:'Overview',href:'/dashboard/professional',icon:'⌂'},
    {label:'My jobs',href:'/dashboard/professional/jobs',icon:'▣'},
    {label:'Earnings',href:'/dashboard/professional/earnings',icon:'◈'},
    {label:'Reviews',href:'/dashboard/professional/reviews',icon:'★'},
    {label:'Manage profile',href:'/dashboard/professional/profile',icon:'◎'},
    {label:'Settings',href:'/dashboard/professional/settings',icon:'⚙'},
  ],
  ADMIN:[
    {label:'Overview',href:'/dashboard/admin',icon:'⌂'},
    {label:'Verifications',href:'/dashboard/admin/verifications',icon:'✓'},
    {label:'Users',href:'/dashboard/admin/users',icon:'◎'},
    {label:'Audit log',href:'/dashboard/admin/audit-log',icon:'▣'},
  ]
};

function initials(name:string){return name.split(' ').map(n=>n[0]).filter(Boolean).slice(0,2).join('').toUpperCase();}

export function AppShell({role,name,avatarUrl,verified,children,active}:{role:Role;name:string;avatarUrl?:string|null;verified?:boolean;children:React.ReactNode;active?:string}){
  const items = nav[role];
  return <div className="app-shell">
    <aside className="sidebar">
      <Link className="dash-brand" href="/"><img src="/trux-pylot-logo.png" alt="Trux Pylot"/></Link>
      <div className="sidebar-identity">
        <span className="sidebar-avatar">{avatarUrl ? <img src={avatarUrl} alt={name}/> : initials(name)}</span>
        <div className="sidebar-identity-text">
          <b>{name}</b>
          <div className="sidebar-role-row">
            <span>{role.toLowerCase()}</span>
            {verified && <span className="verified-chip">✓ Verified</span>}
          </div>
        </div>
      </div>
      <p className="nav-title">WORKSPACE</p>
      <nav>{items.map((item)=><Link className={(active??items[0].href)===item.href?'active':''} key={item.href} href={item.href}><span>{item.icon}</span>{item.label}</Link>)}</nav>
      <div className="support-card"><span>◌</span><b>Need assistance?</b><p>Our support team is here to help.</p><a href="mailto:info@truxpylot.co">Contact support →</a></div>
    </aside>
    <section className="dashboard-content">
      <header className="dash-header">
        <div className="mobile-brand">TRUX PYLOT</div>
        <div className="header-right">
          <button className="notification" aria-label="Notifications">♧<i></i></button>
          <Link href={role==='ADMIN'?'/dashboard/admin':`/dashboard/${role.toLowerCase()}/profile`} className="user-chip">
            <span>{avatarUrl ? <img src={avatarUrl} alt={name}/> : initials(name)}</span>
            <div><b>{name}</b><small>{role.toLowerCase()}</small></div>
          </Link>
        </div>
      </header>
      {children}
    </section>
  </div>;
}
