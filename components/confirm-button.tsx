"use client";

export default function ConfirmButton({
                                          message,
                                          label = "Delete",
                                      }: {
    message: string;
    label?: string;
}) {
    return (
        <button
            type="submit"
            onClick={(e) => {
                if (!confirm(message)) {
                    e.preventDefault();
                }
            }}
            className="rounded-full border border-red-500 px-3 py-1 text-xs text-red-500 hover:bg-red-500/10"
        >
            {label}
        </button>
    );
}