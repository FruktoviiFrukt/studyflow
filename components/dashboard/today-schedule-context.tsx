"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type DashboardLesson = {
  id: string;
  startMinutes: number;
  endMinutes: number;
  subject: {
    name: string;
  };
  type: string;
  classroom: string | null;
};

export type DashboardScheduleDay = {
  date: string;
  status: "NOT_PUBLISHED" | "HOLIDAY" | "NO_LESSONS" | "LESSONS";
  holidays: {
    id: string;
    name: string;
  }[];
  lessons: DashboardLesson[];
};

export type DashboardScheduleResponse = {
  status: "READY" | "PROFILE_REQUIRED";
  message?: string;
  days: DashboardScheduleDay[];
};

type TodayScheduleContextValue = {
  data: DashboardScheduleResponse | null;
  isLoading: boolean;
  hasError: boolean;
};

const TodayScheduleContext = createContext<TodayScheduleContextValue | null>(
  null,
);

function universityToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Chisinau",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function TodayScheduleProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const today = universityToday();

    async function loadSchedule() {
      try {
        const response = await fetch(
          `/api/schedule?from=${today}&to=${today}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Schedule request failed");
        }

        const result = (await response.json()) as DashboardScheduleResponse;

        setData(result);
        setHasError(false);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setHasError(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadSchedule();

    return () => controller.abort();
  }, []);

  return (
    <TodayScheduleContext.Provider value={{ data, isLoading, hasError }}>
      {children}
    </TodayScheduleContext.Provider>
  );
}

export function useTodaySchedule() {
  const context = useContext(TodayScheduleContext);

  if (!context) {
    throw new Error(
      "useTodaySchedule must be used inside TodayScheduleProvider",
    );
  }

  return context;
}
