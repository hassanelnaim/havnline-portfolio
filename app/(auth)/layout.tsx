export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-12">
      <div className="mb-8 font-display text-[18px] font-semibold text-ink">HavnLine Sales Portfolio</div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
