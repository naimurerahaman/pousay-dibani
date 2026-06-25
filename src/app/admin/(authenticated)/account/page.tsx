import { ChangePasswordForm } from "@/components/change-password-form";
import { changeAdminPassword } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default function AdminAccountPage() {
  async function action(formData: FormData) {
    "use server";
    return changeAdminPassword({
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Account</h1>
          <p className="muted">Manage your admin sign-in credentials.</p>
        </div>
      </div>
      <ChangePasswordForm action={action} />
    </>
  );
}
