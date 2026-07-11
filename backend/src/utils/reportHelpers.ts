export type SummaryEntry = {
  client_id: string;
  project_id: string;
  hours: number;
  price_per_hour: number;
};

export type SummaryBucket = {
  id: string;
  hours: number;
  amount: number;
  name: string;
};

export type SummaryResult = {
  total_hours: number;
  total_amount: number;
  by_client: SummaryBucket[];
  by_project: SummaryBucket[];
};

export const buildSummary = (
  entries: SummaryEntry[],
  clientNames: Record<string, string>,
  projectNames: Record<string, string>,
): SummaryResult => {
  const byClient: Record<string, Omit<SummaryBucket, "id">> = {};
  const byProject: Record<string, Omit<SummaryBucket, "id">> = {};

  let totalHours = 0;
  let totalAmount = 0;

  for (const entry of entries) {
    const amount = entry.hours * entry.price_per_hour;
    totalHours += entry.hours;
    totalAmount += amount;

    if (!byClient[entry.client_id]) {
      byClient[entry.client_id] = {
        hours: 0,
        amount: 0,
        name: clientNames[entry.client_id] || "Unknown",
      };
    }

    if (!byProject[entry.project_id]) {
      byProject[entry.project_id] = {
        hours: 0,
        amount: 0,
        name: projectNames[entry.project_id] || "Unknown",
      };
    }

    byClient[entry.client_id].hours += entry.hours;
    byClient[entry.client_id].amount += amount;
    byProject[entry.project_id].hours += entry.hours;
    byProject[entry.project_id].amount += amount;
  }

  return {
    total_hours: totalHours,
    total_amount: totalAmount,
    by_client: Object.entries(byClient).map(([id, data]) => ({ id, ...data })),
    by_project: Object.entries(byProject).map(([id, data]) => ({
      id,
      ...data,
    })),
  };
};
