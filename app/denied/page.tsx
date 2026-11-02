import SignOutButton from "@/components/sign-out-button";

export default function DeniedPage() {
  return (
      <div className="flex justify-center py-16">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-300 p-8 text-center dark:border-zinc-700">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            This tool is for superadmins only. Your account does not have
            permission.
          </p>
          <div className="mt-6 flex justify-center">
            <SignOutButton />
          </div>
        </div>
      </div>
  );
}