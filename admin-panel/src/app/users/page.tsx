import AdminLayout from "@/components/layout/AdminLayout";

export default function UsersPage() {
  return (
    <AdminLayout>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500">
          Review user accounts and access.
        </p>
      </div>
    </AdminLayout>
  );
}
