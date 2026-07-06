import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Table } from '@/shared/components/ui-bits';

const ROLES = ['USER', 'DEALER', 'EMPLOYEE', 'ADMIN', 'SYSTEM'];
const STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED'];

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = () => { setLoading(true); adminAPI.usersList({ q: q || undefined }).then(setUsers).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const setRole = async (id: number, role: string) => { try { await adminAPI.userSetRole(id, role); toast({ title: 'Role updated' }); load(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); } };
  const setStatus = async (id: number, status: string) => { try { await adminAPI.userSetStatus(id, status); toast({ title: 'Status updated' }); load(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); } };

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage accounts, roles & access" />
      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mb-4 flex max-w-sm items-center gap-2 rounded-lg border border-card-border bg-secondary px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / email / phone" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
      </form>
      {loading ? <Loader /> : (
        <Table head={['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined']}>
          {users.map((u) => (
            <tr key={u.user_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 text-foreground">{u.full_name}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.phone}</td>
              <td className="px-4 py-3">
                <select defaultValue={u.role} onChange={(e) => setRole(u.user_id, e.target.value)} className="rounded-lg border border-card-border bg-secondary px-2 py-1 text-xs outline-none">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              <td className="px-4 py-3">
                <select defaultValue={u.status} onChange={(e) => setStatus(u.user_id, e.target.value)} className="rounded-lg border border-card-border bg-secondary px-2 py-1 text-xs outline-none">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{String(u.created_at).slice(0, 10)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
