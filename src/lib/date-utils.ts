import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatDate = (
  date: string | Date,
  formatString: string = "dd/MM/yyyy"
) => {
  return format(new Date(date), formatString, { locale: ptBR });
};

export const formatDateTime = (date: string | Date) => {
  return formatDate(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm");
};

export const formatDateTimeShort = (date: string | Date) => {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm");
};
