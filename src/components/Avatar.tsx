import Image from "next/image";
import { editable } from "@/lib/editable";

const EDIT = editable("프로필 사진", "src/components/Avatar.tsx");

export function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <Image
        {...EDIT}
        src={src}
        alt={`${name} 프로필 사진`}
        width={128}
        height={128}
        className="size-32 rounded-full object-cover ring-1 ring-border"
        priority
      />
    );
  }

  return (
    <div
      {...EDIT}
      aria-hidden
      className="flex size-32 items-center justify-center rounded-full bg-accent-soft text-4xl font-bold text-accent ring-1 ring-border"
    >
      {name.slice(0, 1)}
    </div>
  );
}
