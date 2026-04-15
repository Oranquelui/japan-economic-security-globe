import { AppPage } from "../_components/AppPage";

export default async function LocalePage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;

  return <AppPage locale={locale} searchParams={searchParams} />;
}
