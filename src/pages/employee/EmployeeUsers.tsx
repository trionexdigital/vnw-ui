import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { employeeAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Table } from '@/shared/components/ui-bits';

const STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED'];

/** Employee user management — status changes are submitted for admin approval. */
export default function EmployeeUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = () => { setLoading(true); employeeAPI.usersList({ q: q || undefined }).then(setUsers).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const setStatus = async (target_id: number, status: string) => {
    try { await employeeAPI.submit('users.set-status', { target_id, status }); toast({ title: 'Submitted for approval', description: `Set user #${target_id} → ${status}` }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div>
      <PageHeader title="Users" subtitle="Status changes are applied after admin approval" />
      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mb-4 flex max-w-sm items-center gap-2 rounded-lg border border-card-border bg-secondary px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / email / phone" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
      </form>
      {loading ? <Loader /> : (
        <Table head={['Name', 'Email', 'Phone', 'Role', 'Status', 'Request Change']}>
          {users.map((u) => (
            <tr key={u.user_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 text-foreground">{u.full_name}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.phone}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.role}</td>
              <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
              <td className="px-4 py-3">
                <select defaultValue="" onChange={(e) => { if (e.target.value) setStatus(u.user_id, e.target.value); e.target.value = ''; }}
                  className="rounded-lg border border-card-border bg-secondary px-2 py-1 text-xs outline-none">
                  <option value="">Set status…</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
