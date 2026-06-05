import type { Metadata } from "next";
import { CheckCircle2, XCircle, Download, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { formatIST } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface VerifyResponse {
  valid: boolean;
  certificate?: {
    recipient_name: string | null;
    serial_no: string;
    batch_name: string;
    template_name: string;
    issued_at: string | null;
    certificate_url: string;
    verification_count: number;
  };
}

const EMAIL_API_BASE = (process.env.EMAIL_API_URL || "http://localhost:4000").replace(/\/$/, "");

async function fetchVerification(code: string): Promise<VerifyResponse> {
  const safeCode = encodeURIComponent(code);
  try {
    const res = await fetch(`${EMAIL_API_BASE}/api/public/cert/verify/${safeCode}`, {
      cache: "no-store",
    });
    if (!res.ok) return { valid: false };
    return (await res.json()) as VerifyResponse;
  } catch {
    return { valid: false };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const data = await fetchVerification(code);
  if (data.valid && data.certificate) {
    return {
      title: `${data.certificate.template_name} — Verified Certificate | BSERC`,
      description: `Verified certificate for ${data.certificate.recipient_name ?? "recipient"} (${data.certificate.serial_no})`,
      robots: { index: false, follow: false },
    };
  }
  return {
    title: "Certificate Verification | BSERC",
    robots: { index: false, follow: false },
  };
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = await fetchVerification(code);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            BSERC Certificate Authentication
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Certificate Verification
          </h1>
        </header>

        {data.valid && data.certificate ? (
          <VerifiedCard certificate={data.certificate} code={code} />
        ) : (
          <UnverifiedCard code={code} />
        )}

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          <p>
            This verification page checks BSERC&rsquo;s authoritative record of issued certificates.
            Tampering with a downloaded PDF does not affect the canonical record.
          </p>
        </footer>
      </div>
    </main>
  );
}

function VerifiedCard({
  certificate,
  code,
}: {
  certificate: NonNullable<VerifyResponse["certificate"]>;
  code: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <CheckCircle2 className="size-10 shrink-0 text-emerald-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-foreground">Certificate verified</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This certificate is authentic and matches BSERC&rsquo;s records.
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-foreground/10 pt-6 sm:grid-cols-2">
        <Field label="Recipient">
          {certificate.recipient_name ?? "—"}
        </Field>
        <Field label="Certificate ID">
          <span className="font-mono text-xs">{certificate.serial_no}</span>
        </Field>
        <Field label="Programme">{certificate.template_name}</Field>
        <Field label="Cohort / Batch">{certificate.batch_name}</Field>
        <Field label="Issued">
          {certificate.issued_at ? formatIST(certificate.issued_at) : "—"}
        </Field>
        <Field label="Verification code">
          <span className="font-mono text-xs break-all">{code}</span>
        </Field>
      </dl>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-foreground/10 pt-6">
        {certificate.certificate_url ? (
          <>
            <Button asChild>
              <a
                href={certificate.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Download className="size-4" /> Download PDF
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={certificate.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" /> View certificate
              </a>
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Certificate file is being prepared. Please check back shortly.
          </p>
        )}
      </div>
    </Card>
  );
}

function UnverifiedCard({ code }: { code: string }) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <XCircle className="size-10 shrink-0 text-destructive" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-foreground">Not a valid certificate</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We could not find a published certificate with this verification code. This may mean:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>The link or QR code was mistyped or partially copied.</li>
            <li>The certificate has been revoked.</li>
            <li>The certificate is still being processed and not yet public.</li>
          </ul>
        </div>
      </div>
      <div className="mt-6 border-t border-foreground/10 pt-6 text-xs text-muted-foreground">
        <p>
          Verification code searched:{" "}
          <span className="font-mono break-all">{code}</span>
        </p>
        <p className="mt-2">
          If you believe this is in error, please contact{" "}
          <a className="underline" href="mailto:support@bserc.org">
            support@bserc.org
          </a>
          .
        </p>
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  );
}
