import { useQuery } from "@tanstack/react-query";
import type { Question } from "@/api/contracts";
import { useServices } from "@/providers/ServicesProvider";
import { useSession } from "@/providers/session";
import { configQuery } from "../api/queries";

const NO_QUESTIONS: Question[] = [];

export function useQuestions(): Question[] {
  const services = useServices();
  const { practiceId } = useSession();
  const { data } = useQuery(configQuery(services, practiceId));
  return data?.questions ?? NO_QUESTIONS;
}
