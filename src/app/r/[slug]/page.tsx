import CustomerReviewClient from './CustomerReviewClient';

export default async function CustomerReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ direct?: string; bypass?: string }>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const isDirect =
    search?.direct === '1' ||
    search?.direct === 'true' ||
    search?.bypass === '1' ||
    search?.bypass === 'true';

  return <CustomerReviewClient slug={slug} initialDirect={isDirect} />;
}
