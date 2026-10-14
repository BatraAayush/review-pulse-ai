import CustomerReviewClient from './CustomerReviewClient';

export default async function CustomerReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CustomerReviewClient slug={slug} />;
}
