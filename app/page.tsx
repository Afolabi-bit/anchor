import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingHero from "@/app/components/LandingHero";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    if (session.isOnboarded) {
      redirect("/today");
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <main className="min-h-screen bg-[#0D0B0A] text-[#ECE7E0] overflow-x-hidden">
      <LandingHero />
    </main>
  );
}

