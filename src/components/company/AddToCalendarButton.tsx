"use client";

import { CalendarPlus } from "lucide-react";
import { recruitmentToICS, type IcsCompany, type IcsRecruitment } from "@/lib/ics";
import { cn } from "../ui";

/** 기관 채용 일정을 .ics 파일로 내려받아 구글·애플·아웃룩 캘린더에 추가 (button-secondary) */
export function AddToCalendarButton({
  company,
  recruitment,
  className,
  small = false,
}: {
  company: IcsCompany;
  recruitment: IcsRecruitment;
  className?: string;
  small?: boolean;
}) {
  if (!recruitment.events.length) return null;
  const onClick = () => {
    const ics = recruitmentToICS(company, recruitment, window.location.origin);
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${company.name}-채용일정.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title="구글·애플·아웃룩 캘린더로 가져올 수 있는 .ics 파일을 내려받아요"
      className={cn("btn btn-secondary", small && "btn-sm", className)}
    >
      <CalendarPlus className="h-4 w-4" strokeWidth={1.75} />
      내 캘린더에 추가
    </button>
  );
}
