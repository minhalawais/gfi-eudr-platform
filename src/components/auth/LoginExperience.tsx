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
  Globe2,
  Leaf,
  Link2,
  LockKeyhole,
  ShieldCheck,
  User,
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

const CAPABILITY_ITEMS = [
  { icon: Link2, label: "Complete Traceability" },
  { icon: ShieldCheck, label: "Compliance Assurance" },
  { icon: FileCheck2, label: "Audit Ready Records" },
  { icon: Globe2, label: "Sustainable Future" },
] as const;


function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Username or email is required.";
  } else if (trimmedEmail.includes("@") && !EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return errors;
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
        form: "The username, email, or password is incorrect. Check the demo credentials and try again.",
      });
      setIsSubmitting(false);
      return;
    }

    login();
    router.replace("/dashboard");
  };

  return (
    <main className={styles.page}>
      <div className={styles.background}>
        <Image
          src="/login background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.backgroundImage}
        />
        <div className={styles.backgroundVeil} />
      </div>

      <div className={styles.shell}>
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
          className={styles.layout}
        >
          <aside className={styles.hero}>
            <div className={styles.heroInner}>
              <div className={styles.brandWrap}>
                <Image
                  src="/jojo_logo.png"
                  alt="Jojo"
                  width={140}
                  height={67}
                  className={styles.logo}
                  priority
                />
                <p className={styles.companyName}>Gujranwala Food Industries (Pvt.) Ltd.</p>
              </div>

              <div className={styles.heroCopy}>
                <h1>Digital Traceability &amp; Compliance Platform</h1>
                <p>End-to-end visibility. Trusted supply chains. Assured compliance.</p>
              </div>

              <div className={styles.capabilityGrid}>
                {CAPABILITY_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={styles.capabilityCard}>
                      <span className={styles.capabilityIcon}>
                        <Icon />
                      </span>
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>

            </div>
          </aside>

          <div className={styles.authColumn}>
            <div className={styles.authCard} aria-labelledby="login-heading">
              <div className={styles.badgeWrap} aria-hidden="true">
                <div className={styles.badgeCircle}>
                  <ShieldCheck />
                </div>
              </div>

              <div className={styles.authHeading}>
                <h2 id="login-heading">
                  Welcome Back! <Leaf aria-hidden="true" />
                </h2>
                <p>
                  Sign in to continue to JOJO <span>Traceability &amp; Compliance Platform</span>
                </p>
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
                  <label htmlFor="login-email">Username / Email</label>
                  <div className={styles.inputWrap}>
                    <User aria-hidden="true" />
                    <Input
                      id="login-email"
                      type="text"
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
                      placeholder="Enter your username or email"
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

                <div className={styles.formMeta}>
                  <label className={styles.checkbox}>
                    <input type="checkbox" defaultChecked />
                    <span>Remember me</span>
                  </label>
                  <Link href="#" className={styles.forgotLink}>
                    Forgot Password?
                  </Link>
                </div>

                <Button type="submit" fullWidth loading={isSubmitting} className={styles.submit}>
                  {isSubmitting ? "Opening workspace" : "Sign In"}
                  {!isSubmitting ? <ArrowRight className="h-5 w-5" /> : null}
                </Button>
              </form>

              <div className={styles.divider}>
                <span>or continue with</span>
              </div>

              <div className={styles.socialGrid}>
                <button type="button" className={styles.socialButton}>
                  <span className={styles.microsoftMark} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                  <span>Microsoft</span>
                </button>

                <button type="button" className={styles.socialButton}>
                  <span className={styles.googleMark} aria-hidden="true">
                    G
                  </span>
                  <span>Google</span>
                </button>
              </div>

              <div className={styles.cardFooter}>
                <LockKeyhole />
                <span>Secure • Reliable • Compliant</span>
              </div>
            </div>

          </div>
        </motion.section>
      </div>
    </main>
  );
}
