import Image from "next/image";
import styles from "@/app/page.module.scss";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.hero}>
          <Image
            src="/next.svg"
            alt="Proflo Logo"
            width={90}
            height={18}
            className={styles.logo}
            priority
          />

          <h1 className={styles.title}>Welcome to Proflo</h1>

          <p className={styles.subtitle}>
            A clean and minimal workspace for agencies & freelancers.
          </p>

          <div className={styles.actions}>
            <a href="/auth/register" className={styles.primaryBtn}>
              Get Started
            </a>

            <a href="/auth/login" className={styles.secondaryBtn}>
              Login
            </a>

            <a href="/auth/otp" className={styles.secondaryBtn}>
              Login with OTP
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
