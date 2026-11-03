import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/auth";
import { usePublicBrand } from "@/lib/public-brand";
import { ThemeToggle } from "@/components/app/theme-toggle";
export function PublicNav() {
  const { data: me } = useMe();
  const { data: brand } = usePublicBrand();
  return (
    <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-5">
      <Link
        to="/"
        className="flex items-center gap-2 font-display text-xl font-bold uppercase sm:text-2xl"
      >
        {brand?.logo && <img src={brand.logo} alt="" className="h-8 w-8 object-contain" />}
        {brand?.brand || "Team Oliveira"}
      </Link>
      <div className="flex items-center gap-3">
        <Link to="/william" className="hidden text-sm sm:block">
          O personal
        </Link>
        <ThemeToggle />
        <Button asChild size="sm" variant="secondary">
          <Link to={me ? "/painel" : "/auth"}>{me ? "Meu painel" : "Entrar"}</Link>
        </Button>
      </div>
    </nav>
  );
}
