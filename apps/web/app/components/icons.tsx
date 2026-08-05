import { SVGProps } from "react";

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" />
    </Icon>
  );
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m8 1.75 1.75 3.55 3.92.57-2.84 2.77.67 3.91L8 10.69l-3.5 1.86.67-3.91L2.33 5.87l3.92-.57L8 1.75Z" />
    </Icon>
  );
}

export function PaperclipIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5.5 8.5 10 4a2.12 2.12 0 1 1 3 3l-5.5 5.5a3.18 3.18 0 0 1-4.5-4.5L8.5 2.5" />
    </Icon>
  );
}

export function MoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="3" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="8" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="1.5" y="3" width="13" height="10" rx="2" />
      <path d="m2.5 4 5.5 4 5.5-4" />
    </Icon>
  );
}

export function InboxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M2 8.5h3l1.5 2h3L11 8.5h3" />
      <path d="M3.5 3.5h9l1 8.5a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2l1-8.5Z" />
    </Icon>
  );
}

export function LayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m8 2.5 5.5 2.75L8 8 2.5 5.25 8 2.5Z" />
      <path d="m2.5 8.25 5.5 2.75 5.5-2.75" />
      <path d="m2.5 11.25 5.5 2.75 5.5-2.75" />
    </Icon>
  );
}

export function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m8 1.75 1.1 3.15L12.25 6 9.1 7.1 8 10.25 6.9 7.1 3.75 6 6.9 4.9 8 1.75Z" />
      <path d="m12 10.5.55 1.45 1.45.55-1.45.55L12 14.5l-.55-1.45-1.45-.55 1.45-.55L12 10.5Z" />
    </Icon>
  );
}

export function FolderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M2 4.5h4l1.25 1.5H14v5.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7Z" />
    </Icon>
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="2.25" />
      <path d="M8 2.25v1.5M8 12.25v1.5M13.75 8h-1.5M3.75 8h-1.5M12.07 3.93 11 5M5 11l-1.07 1.07M12.07 12.07 11 11M5 5 3.93 3.93" />
    </Icon>
  );
}

export function ArchiveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="2" y="3" width="12" height="3" rx="1" />
      <path d="M3 6.5V12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6.5" />
      <path d="M6 9h4" />
    </Icon>
  );
}

export function ReplyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6.5 5 3 8.5 6.5 12" />
      <path d="M3.5 8.5h5a4 4 0 0 1 4 4" />
    </Icon>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m4 6 4 4 4-4" />
    </Icon>
  );
}
