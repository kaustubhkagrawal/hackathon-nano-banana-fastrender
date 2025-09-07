import Image from "next/image";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 h-16 md:h-16 flex items-center">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="zAxis logo"
            width={48}
            height={48}
            className="rounded"
            priority
          />
          <p className="text-2xl font-bold text-blue-500">zAxis</p>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
