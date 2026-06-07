"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileCheck2,
  LockKeyhole,
  Mail,
  MapPinned,
  Network,
  ShieldCheck,
} from "lucide-react";

import { Button, Input } from "@/components/ui";
import { useSession } from "@/components/ui/PermissionGuard";
import { authenticateDemoCredentials } from "@/lib/demo-auth";
import styles from "./LoginExperience.module.css";

type LoginErrors = {
  email?: string;
  password?: string;
  form?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WORKFLOW_ITEMS = [
  { icon: Network, label: "End-to-end supply chain traceability" },
  { icon: MapPinned, label: "Shipment and consignment control" },
  { icon: FileCheck2, label: "Compliance and evidence readiness" },
] as const;

function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};

  if (!email.trim()) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return errors;
}

function GeospatialBackground({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div className={styles.background} aria-hidden="true">
      <div className={styles.grid} />
      <svg className={styles.mapLines} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <path
          d="M-80 770 C165 620 264 722 438 555 C618 381 790 468 948 298 C1088 147 1280 188 1524 38"
          fill="none"
          stroke="rgba(14,90,70,0.08)"
          strokeWidth="52"
          strokeLinecap="round"
        />
        <motion.path
          d="M-80 770 C165 620 264 722 438 555 C618 381 790 468 948 298 C1088 147 1280 188 1524 38"
          fill="none"
          stroke="rgba(14,90,70,0.24)"
          strokeWidth="2"
          strokeDasharray="9 12"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
        />
        <path
          d="M100 100 L354 76 L446 226 L292 336 L64 278 Z"
          fill="rgba(255,255,255,0.22)"
          stroke="rgba(14,90,70,0.12)"
          strokeWidth="2"
          strokeDasharray="8 10"
        />
        <path
          d="M1040 572 L1320 516 L1460 682 L1270 842 L1022 760 Z"
          fill="rgba(255,255,255,0.2)"
          stroke="rgba(14,90,70,0.11)"
          strokeWidth="2"
          strokeDasharray="8 10"
        />
      </svg>
    </div>
  );
}

export function LoginExperience() {
  const router = useRouter();
  const { accountProfile, isHydrated, login, session } = useSession();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isHydrated && session?.user) {
      router.replace("/dashboard");
    }
  }, [isHydrated, router, session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validateLogin(email, password);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const result = await authenticateDemoCredentials(email, password, accountProfile.email);
    if (!result.authenticated) {
      setErrors({
        form: "The email or password is incorrect. Check the demo credentials and try again.",
      });
      setIsSubmitting(false);
      return;
    }

    login();
    router.replace("/dashboard");
  };

  return (
    <main className={styles.page}>
      <GeospatialBackground reduceMotion={reduceMotion} />

      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.jojoLogo}>
              <Image
                src="/jojo_logo.png"
                alt="Gujranwala Food Industries"
                width={218}
                height={76}
                className="h-auto w-auto object-contain"
                priority
              />
            </div>
            <div className={styles.brandCopy}>
              <strong>Gujranwala Food Industries</strong>
              <span>Traceability and compliance workspace</span>
            </div>
          </div>
        </header>

        <div className={styles.center}>
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className={styles.panel}
            aria-labelledby="login-heading"
          >
            <aside className={styles.context}>
              <div className={styles.contextGlow} />
              <div className={styles.contextGrid} />

              <div className={styles.contextContent}>
                <h1>Trace every ingredient. Prove every origin.</h1>
                <p>
                  Connect products to suppliers, producer plots and verified evidence before release to the EU market.
                </p>

                <div className={styles.workflowList}>
                  {WORKFLOW_ITEMS.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className={styles.workflowItem}>
                        <span className={styles.workflowIcon}>
                          <Icon />
                        </span>
                        <div>
                          <strong>{item.label}</strong>
                          <span>0{index + 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.contextFooter}>
                <Link
                  href="https://fruitofsustainability.com/"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.contextFooterLink}
                  aria-label="Visit Fruit of Sustainability website"
                >
                  <Image
                    src="/fos_square_logo.png"
                    alt="Fruit of Sustainability"
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-md"
                  />
                  <span>Developed by Fruit of Sustainability</span>
                </Link>
              </div>
            </aside>

            <div className={styles.auth}>
              <div className={styles.authHeading}>
                <p>Workspace access</p>
                <h2 id="login-heading">Welcome back</h2>
                <span>Log in to continue to the GFI EUDR compliance workspace.</span>
              </div>

              <div className={styles.formAlertSlot}>
                {errors.form ? (
                  <div role="alert" className={styles.formAlert}>
                    <LockKeyhole />
                    <span>{errors.form}</span>
                  </div>
                ) : null}
              </div>

              <form className={styles.form} noValidate onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label htmlFor="login-email">Email address</label>
                  <div className={styles.inputWrap}>
                    <Mail aria-hidden="true" />
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      inputMode="email"
                      value={email}
                      state={errors.email ? "error" : "default"}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby="login-email-error"
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (errors.email || errors.form) {
                          setErrors((current) => ({ ...current, email: undefined, form: undefined }));
                        }
                      }}
                      className={styles.input}
                      placeholder="name@company.com"
                    />
                  </div>
                  <p id="login-email-error" className={styles.fieldError} aria-live="polite">
                    {errors.email ?? ""}
                  </p>
                </div>

                <div className={styles.field}>
                  <label htmlFor="login-password">Password</label>
                  <div className={styles.inputWrap}>
                    <LockKeyhole aria-hidden="true" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      state={errors.password ? "error" : "default"}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby="login-password-error"
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (errors.password || errors.form) {
                          setErrors((current) => ({ ...current, password: undefined, form: undefined }));
                        }
                      }}
                      className={styles.input}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className={styles.passwordToggle}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  <p id="login-password-error" className={styles.fieldError} aria-live="polite">
                    {errors.password ?? ""}
                  </p>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  loading={isSubmitting}
                  className={styles.submit}
                >
                  {isSubmitting ? "Opening compliance workspace" : "Log in to workspace"}
                  {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
              </form>

              <div className={styles.authFooter}>
                <ShieldCheck />
                <span>Need access? Contact your administrator.</span>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
