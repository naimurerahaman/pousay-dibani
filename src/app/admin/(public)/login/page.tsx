import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/admin-login-form";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{
    from?: string;
    error?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const fromParam = params.from && params.from.startsWith("/admin") ? params.from : "/admin";
  const callbackUrl = fromParam === "/admin/login" ? "/admin" : fromParam;

  return (
    <section className="section admin-login-section">
      <Link className="brand admin-login-brand" href="/">
        <span className="brand__mark">
          <PackageCheck size={21} aria-hidden="true" />
        </span>
        <span className="brand__copy">
          <span className="brand__name">Pousay Dibani</span>
          <span className="brand__area">Admin console</span>
        </span>
      </Link>
      <AdminLoginForm callbackUrl={callbackUrl} initialError={null} />
    </section>
  );
}
