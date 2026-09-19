import { requireRole } from '@/lib/guard';
import { AppShell } from '@/components/app-shell';
import { AnnouncementManager } from '@/components/announcement-manager';
export default async function AdminAnnouncements(){await requireRole('ADMIN');return <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/announcements"><main className="dash-page admin-announcements-future"><section className="admin-section-hero announcement-hero-future"><div><span className="admin-future-kicker">MASTER CONTROL / BROADCAST</span><h1>Speak to the network.</h1><p>Write once, choose the audience, then publish only when you are ready.</p></div><div className="broadcast-orbit"><span>TRUX</span><b>01</b><small>controlled broadcast</small></div></section><AnnouncementManager/></main></AppShell>}
