import { requireRole } from '@/lib/guard';
import { AppShell } from '@/components/app-shell';
import { AnnouncementManager } from '@/components/announcement-manager';
export default async function AdminAnnouncements(){await requireRole('ADMIN');return <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/announcements"><main className="dash-page"><div className="overview-top"><div><p className="page-kicker">CONTROL CENTER / COMMUNICATION</p><h1>System announcements</h1><p className="subcopy">Publish important updates to customers and professionals when you decide.</p></div></div><AnnouncementManager/></main></AppShell>}
