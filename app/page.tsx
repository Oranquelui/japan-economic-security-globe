import { AppPage } from "./_components/AppPage";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AppPage locale="ja" searchParams={searchParams} />;
}
